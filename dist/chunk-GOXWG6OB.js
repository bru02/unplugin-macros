// src/core/options.ts
function resolveOptions(options) {
  return {
    include: options.include || [/\.[cm]?[jt]sx?$/],
    exclude: options.exclude || [/node_modules/],
    viteServer: options.viteServer,
    viteConfig: options.viteConfig || {},
    enforce: "enforce" in options ? options.enforce : "pre",
    attrs: options.attrs || { type: "macro" }
  };
}

// src/core/define.ts
function defineMacro(fn) {
  return fn;
}

// src/core/index.ts
import { builtinModules } from "node:module";
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
  TS_NODE_TYPES,
  walkAST,
  walkImportDeclaration
} from "ast-kit";
import { generateTransform, MagicStringAST } from "magic-string-ast";
async function transformMacros({
  source,
  id,
  unpluginContext,
  getRunner,
  deps,
  attrs
}) {
  const program = babelParse(source, getLang(id), {
    plugins: [["importAttributes", { deprecatedAssertSyntax: true }]]
  });
  const s = new MagicStringAST(source);
  const imports = new Map(Object.entries(recordImports()));
  const macros = collectMacros();
  if (macros.length > 0) {
    await executeMacros();
  } else {
    deps.delete(id);
  }
  return generateTransform(s, id);
  async function executeMacros() {
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
      let exported;
      if (resolved.startsWith("node:") || builtinModules.includes(resolved.split("/")[0])) {
        exported = await import(resolved);
      } else {
        const module = await runner.executeFile(resolved);
        exported = module;
      }
      const props = [...keys];
      if (binding.imported !== "*") props.unshift(binding.imported);
      for (const key of props) {
        exported = exported?.[key];
      }
      if (!exported) {
        throw new Error(`Macro ${local} is not existed.`);
      }
      let ret;
      if (macro.type === "call") {
        const ctx = {
          id,
          source,
          emitFile: unpluginContext.emitFile,
          unpluginContext
        };
        ret = exported.apply(ctx, macro.args);
      } else {
        ret = exported;
      }
      if (isAwait) {
        ret = await ret;
      }
      s.overwriteNode(
        node,
        ret === void 0 ? "undefined" : JSON.stringify(ret)
      );
      deps.get(id).add(resolved);
    }
  }
  function collectMacros() {
    const macros2 = [];
    let scope = attachScopes(program, "scope");
    const parentStack = [];
    walkAST(program, {
      enter(node, parent) {
        parent && parentStack.push(parent);
        if (node.scope) scope = node.scope;
        if (node.type.startsWith("TS") && !TS_NODE_TYPES.includes(node.type)) {
          this.skip();
          return;
        }
        const isAwait = parent?.type === "AwaitExpression";
        if (node.type === "TaggedTemplateExpression") {
          node = {
            ...node,
            type: "CallExpression",
            callee: node.tag,
            arguments: [node.quasi]
          };
        }
        if (node.type === "CallExpression" && isTypeOf(node.callee, ["Identifier", "MemberExpression"])) {
          let id2;
          try {
            id2 = resolveIdentifier(node.callee);
          } catch {
            return;
          }
          if (!imports.has(id2[0]) || scope.contains(id2[0])) return;
          const args = node.arguments.map((arg) => {
            if (isLiteralType(arg)) return resolveLiteral(arg);
            try {
              if (isTypeOf(arg, ["ObjectExpression", "ArrayExpression"]))
                return new Function(
                  `return (${source.slice(arg.start, arg.end)})`
                )();
            } catch {
            }
            throw new Error("Macro arguments cannot be resolved.");
          });
          macros2.push({
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
          if (!imports.has(id2[0]) || scope.contains(id2[0])) return;
          macros2.push({
            type: "identifier",
            node: isAwait ? parent : node,
            id: id2,
            isAwait
          });
          this.skip();
        }
      },
      leave(node) {
        if (node.scope) scope = scope.parent;
        parentStack.pop();
      }
    });
    return macros2;
  }
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
  defineMacro,
  transformMacros
};
