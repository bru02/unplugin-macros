"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/core/options.ts
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
var _module = require('module');













var _astkit = require('ast-kit');
var _magicstringast = require('magic-string-ast');
async function transformMacros({
  source,
  id,
  unpluginContext,
  getRunner,
  deps,
  attrs
}) {
  const program = _astkit.babelParse.call(void 0, source, _astkit.getLang.call(void 0, id), {
    plugins: [["importAttributes", { deprecatedAssertSyntax: true }]]
  });
  const s = new (0, _magicstringast.MagicStringAST)(source);
  const imports = new Map(Object.entries(recordImports()));
  const macros = collectMacros();
  if (macros.length > 0) {
    await executeMacros();
  } else {
    deps.delete(id);
  }
  return _magicstringast.generateTransform.call(void 0, s, id);
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
      if (resolved.startsWith("node:") || _module.builtinModules.includes(resolved.split("/")[0])) {
        exported = await Promise.resolve().then(() => _interopRequireWildcard(require(resolved)));
      } else {
        const module = await runner.executeFile(resolved);
        exported = module;
      }
      const props = [...keys];
      if (binding.imported !== "*") props.unshift(binding.imported);
      for (const key of props) {
        exported = _optionalChain([exported, 'optionalAccess', _ => _[key]]);
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
    let scope = _astkit.attachScopes.call(void 0, program, "scope");
    const parentStack = [];
    _astkit.walkAST.call(void 0, program, {
      enter(node, parent) {
        parent && parentStack.push(parent);
        if (node.scope) scope = node.scope;
        if (node.type.startsWith("TS") && !_astkit.TS_NODE_TYPES.includes(node.type)) {
          this.skip();
          return;
        }
        const isAwait = _optionalChain([parent, 'optionalAccess', _2 => _2.type]) === "AwaitExpression";
        if (node.type === "TaggedTemplateExpression") {
          node = {
            ...node,
            type: "CallExpression",
            callee: node.tag,
            arguments: [node.quasi]
          };
        }
        if (node.type === "CallExpression" && _astkit.isTypeOf.call(void 0, node.callee, ["Identifier", "MemberExpression"])) {
          let id2;
          try {
            id2 = _astkit.resolveIdentifier.call(void 0, node.callee);
          } catch (e) {
            return;
          }
          if (!imports.has(id2[0]) || scope.contains(id2[0])) return;
          const args = node.arguments.map((arg) => {
            if (_astkit.isLiteralType.call(void 0, arg)) return _astkit.resolveLiteral.call(void 0, arg);
            try {
              if (_astkit.isTypeOf.call(void 0, arg, ["ObjectExpression", "ArrayExpression"]))
                return new Function(
                  `return (${source.slice(arg.start, arg.end)})`
                )();
            } catch (e2) {
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
        } else if (_astkit.isTypeOf.call(void 0, node, ["Identifier", "MemberExpression"]) && (!parent || _astkit.isReferenced.call(void 0, node, parent, parentStack.at(-2)))) {
          let id2;
          try {
            id2 = _astkit.resolveIdentifier.call(void 0, node);
          } catch (e3) {
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





exports.resolveOptions = resolveOptions; exports.defineMacro = defineMacro; exports.transformMacros = transformMacros;
