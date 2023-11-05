"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/core/options.ts
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












var _astkit = require('ast-kit');
var _magicstringast = require('magic-string-ast');
async function transformMacros(code, id, getRunner, deps, attrs) {
  const program = _astkit.babelParse.call(void 0, code, _astkit.getLang.call(void 0, id), {
    plugins: [["importAttributes", { deprecatedAssertSyntax: true }]]
  });
  const s = new (0, _magicstringast.MagicString)(code);
  const imports = new Map(Object.entries(recordImports()));
  let scope = _astkit.attachScopes.call(void 0, program, "scope");
  const macros = [];
  const parentStack = [];
  _astkit.walkAST.call(void 0, program, {
    enter(node, parent) {
      parent && parentStack.push(parent);
      if (node.scope)
        scope = node.scope;
      if (node.type.startsWith("TS")) {
        this.skip();
        return;
      }
      const isAwait = _optionalChain([parent, 'optionalAccess', _ => _.type]) === "AwaitExpression";
      if (node.type === "CallExpression" && _astkit.isTypeOf.call(void 0, node.callee, ["Identifier", "MemberExpression"])) {
        let id2;
        try {
          id2 = _astkit.resolveIdentifier.call(void 0, node.callee);
        } catch (e) {
          return;
        }
        if (!imports.has(id2[0]) || scope.contains(id2[0]))
          return;
        const args = node.arguments.map((arg) => {
          if (_astkit.isLiteralType.call(void 0, arg))
            return _astkit.resolveLiteral.call(void 0, arg);
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
      } else if (_astkit.isTypeOf.call(void 0, node, ["Identifier", "MemberExpression"]) && (!parent || _astkit.isReferenced.call(void 0, node, parent, parentStack.at(-2)))) {
        let id2;
        try {
          id2 = _astkit.resolveIdentifier.call(void 0, node);
        } catch (e2) {
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
      exported = _optionalChain([exported, 'optionalAccess', _2 => _2[key]]);
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
  return _magicstringast.generateTransform.call(void 0, s, id);
  function recordImports() {
    const imports2 = {};
    for (const node of program.body) {
      if (node.type === "ImportDeclaration" && node.importKind !== "type" && node.attributes && checkImportAttributes(attrs, node.attributes)) {
        s.removeNode(node);
        _astkit.walkImportDeclaration.call(void 0, imports2, node);
      }
    }
    return imports2;
  }
}
function checkImportAttributes(expected, actual) {
  const actualAttrs = Object.fromEntries(
    actual.map((attr) => [_astkit.resolveObjectKey.call(void 0, attr), attr.value.value])
  );
  return Object.entries(expected).every(
    ([key, expectedValue]) => actualAttrs[key] === expectedValue
  );
}




exports.resolveOptions = resolveOptions; exports.transformMacros = transformMacros;
