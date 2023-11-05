// src/core/options.ts
function resolveOptions(options) {
  return {
    include: options.include || [/\.[cm]?[jt]sx?$/],
    exclude: options.exclude || [/node_modules/],
    viteConfig: options.viteConfig || {},
    enforce: "enforce" in options ? options.enforce : "pre",
    attrs: options.attrs || { type: "macro" }
  };
}

// src/core/index.ts
import {
  attachScopes,
  babelParse,
  getLang,
  isLiteralType,
  isReferenced,
  isTypeOf,
  resolveIdentifier,
  resolveLiteral,
  resolveObjectKey,
  walkAST,
  walkImportDeclaration
} from "ast-kit";
import { MagicString, generateTransform } from "magic-string-ast";
async function transformMacros(code, id, getRunner, deps, attrs) {
  const program = babelParse(code, getLang(id), {
    plugins: [["importAttributes", { deprecatedAssertSyntax: true }]]
  });
  const s = new MagicString(code);
  const imports = new Map(Object.entries(recordImports()));
  let scope = attachScopes(program, "scope");
  const macros = [];
  const parentStack = [];
  walkAST(program, {
    enter(node, parent) {
      parent && parentStack.push(parent);
      if (node.scope)
        scope = node.scope;
      if (node.type.startsWith("TS")) {
        this.skip();
        return;
      }
      const isAwait = parent?.type === "AwaitExpression";
      if (node.type === "CallExpression" && isTypeOf(node.callee, ["Identifier", "MemberExpression"])) {
        let id2;
        try {
          id2 = resolveIdentifier(node.callee);
        } catch {
          return;
        }
        if (!imports.has(id2[0]) || scope.contains(id2[0]))
          return;
        const args = node.arguments.map((arg) => {
          if (isLiteralType(arg))
            return resolveLiteral(arg);
          throw new Error("Macro arguments must be literals.");
        });
        macros.push({
          type: "call",
          node: isAwait ? parent : node,
          id: id2,
          args,
          isAwait
        });
        this.skip();
      } else if (isTypeOf(node, ["Identifier", "MemberExpression"]) && (!parent || isReferenced(node, parent, parentStack.at(-2)))) {
        let id2;
        try {
          id2 = resolveIdentifier(node);
        } catch {
          return;
        }
        if (!imports.has(id2[0]) || scope.contains(id2[0]))
          return;
        macros.push({
          type: "identifier",
          node: isAwait ? parent : node,
          id: id2,
          isAwait
        });
        this.skip();
      }
    },
    leave(node) {
      if (node.scope)
        scope = scope.parent;
      parentStack.pop();
    }
  });
  if (macros.length === 0) {
    deps.delete(id);
    return;
  }
  const runner = await getRunner();
  deps.set(id, /* @__PURE__ */ new Set());
  for (const macro of macros) {
    const {
      node,
      id: [local, ...keys],
      isAwait
    } = macro;
    const binding = imports.get(local);
    const [, resolved] = await runner.resolveUrl(binding.source, id);
    const module = await runner.executeFile(resolved);
    let exported = module;
    const props = [...keys];
    if (binding.imported !== "*")
      props.unshift(binding.imported);
    for (const key of props) {
      exported = exported?.[key];
    }
    if (!exported) {
      throw new Error(`Macro ${local} is not existed.`);
    }
    let ret;
    if (macro.type === "call") {
      const ctx = {
        id
      };
      ret = exported.apply(ctx, macro.args);
    } else {
      ret = exported;
    }
    if (isAwait) {
      ret = await ret;
    }
    s.overwriteNode(node, ret === void 0 ? "undefined" : JSON.stringify(ret));
    deps.get(id).add(resolved);
  }
  return generateTransform(s, id);
  function recordImports() {
    const imports2 = {};
    for (const node of program.body) {
      if (node.type === "ImportDeclaration" && node.importKind !== "type" && node.attributes && checkImportAttributes(attrs, node.attributes)) {
        s.removeNode(node);
        walkImportDeclaration(imports2, node);
      }
    }
    return imports2;
  }
}
function checkImportAttributes(expected, actual) {
  const actualAttrs = Object.fromEntries(
    actual.map((attr) => [resolveObjectKey(attr), attr.value.value])
  );
  return Object.entries(expected).every(
    ([key, expectedValue]) => actualAttrs[key] === expectedValue
  );
}

export {
  resolveOptions,
  transformMacros
};
