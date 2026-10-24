"""BrainScript — a small Lua-like scripting language for CL1 Neural Labs.

Features:
  - variables, arithmetic, comparisons
  - `if/then/else/end`, `while/do/end`, `for i = a, b do ... end`
  - `function name(args) ... end` and anonymous `function(args) ... end`
  - tables (dicts) with `t.key` and `t["key"]`, array-style `t[i]`
  - OOP: `class Name ... end` with `method` definitions and `self`,
        instantiation via `Name.new(...)`, inheritance via `: super(Name)`
  - native functions provided by the host (stim, rate, log, ...)

Example:

    class Neuron
        method init(self, threshold)
            self.threshold = threshold
        end
        method tick(self, rate)
            if rate > self.threshold then
                return 1
            else
                return 0
            end
        end
    end

    local n = Neuron.new(5)
    log(n:tick(7))
"""

from __future__ import annotations

import re
from typing import Any, Callable


class BrainScriptError(Exception):
    pass


# ---------------------------------------------------------------------------
# Tokenizer
# ---------------------------------------------------------------------------

TOKEN_RE = re.compile(r"""
    (?P<ws>\s+|--[^\n]*)
  | (?P<number>\d+\.\d+|\d+)
  | (?P<name>[A-Za-z_][A-Za-z0-9_]*)
  | (?P<string>"(?:[^"\\]|\\.)*")
  | (?P<op>==|~=|<=|>=|\.\.|[-+*/%<>=(){}\[\],.:;])
""", re.VERBOSE)

KEYWORDS = {"local", "if", "then", "else", "elif", "end", "while", "do", "for",
            "function", "return", "and", "or", "not", "true", "false", "nil",
            "class", "method", "super"}


def tokenize(src: str) -> list[tuple[str, str]]:
    tokens: list[tuple[str, str]] = []
    pos = 0
    while pos < len(src):
        m = TOKEN_RE.match(src, pos)
        if not m:
            raise BrainScriptError(f"unexpected character {src[pos]!r} at {pos}")
        pos = m.end()
        kind = m.lastgroup
        if kind == "ws":
            continue
        value = m.group()
        if kind == "string":
            value = value[1:-1].replace('\\"', '"').replace("\\n", "\n")
        tokens.append((kind, value))
    tokens.append(("eof", ""))
    return tokens


# ---------------------------------------------------------------------------
# AST + Parser (recursive descent)
# ---------------------------------------------------------------------------

class Node:
    __slots__ = ()


class Num(Node):
    def __init__(self, v): self.v = float(v)


class Str(Node):
    def __init__(self, v): self.v = v


class Name(Node):
    def __init__(self, v): self.v = v


class BinOp(Node):
    def __init__(self, op, l, r): self.op, self.l, self.r = op, l, r


class UnaryOp(Node):
    def __init__(self, op, e): self.op, self.e = op, e


class Call(Node):
    def __init__(self, func, args): self.func, self.args = func, args


class MethodCall(Node):
    def __init__(self, obj, name, args): self.obj, self.name, self.args = obj, name, args


class Index(Node):
    def __init__(self, obj, key): self.obj, self.key = obj, key


class Field(Node):
    def __init__(self, obj, name): self.obj, self.name = obj, name


class Assign(Node):
    def __init__(self, target, value, local=False): self.target, self.value, self.local = target, value, local


class Block(Node):
    def __init__(self, stmts): self.stmts = stmts


class If(Node):
    def __init__(self, cond, then, els): self.cond, self.then, self.els = cond, then, els


class While(Node):
    def __init__(self, cond, body): self.cond, self.body = cond, body


class For(Node):
    def __init__(self, var, start, stop, body): self.var, self.start, self.stop, self.body = var, start, stop, body


class FuncDef(Node):
    def __init__(self, name, params, body): self.name, self.params, self.body = name, params, body


class Return(Node):
    def __init__(self, value): self.value = value


class ClassDef(Node):
    def __init__(self, name, parent, methods): self.name, self.parent, self.methods = name, parent, methods


class MethodDef(Node):
    def __init__(self, name, params, body): self.name, self.params, self.body = name, params, body


class TableLit(Node):
    def __init__(self, items): self.items = items


class Parser:
    def __init__(self, tokens):
        self.toks = tokens
        self.i = 0

    def peek(self):
        return self.toks[self.i]

    def next(self):
        t = self.toks[self.i]
        self.i += 1
        return t

    def expect(self, value):
        t = self.next()
        if t[1] != value:
            raise BrainScriptError(f"expected {value!r}, got {t[1]!r}")
        return t

    def at(self, value):
        return self.peek()[1] == value

    # ---- statements ----
    def parse_block(self, terminators: set[str]) -> Block:
        stmts = []
        while self.peek()[0] != "eof" and self.peek()[1] not in terminators:
            stmts.append(self.parse_stmt())
        return Block(stmts)

    def parse_stmt(self):
        kind, val = self.peek()
        if kind == "name" and val == "local":
            self.next()
            name = self.next()[1]
            self.expect("=")
            value = self.parse_expr()
            return Assign(Name(name), value, local=True)
        if kind == "name" and val == "if":
            return self.parse_if()
        if kind == "name" and val == "while":
            self.next()
            cond = self.parse_expr()
            self.expect("do")
            body = self.parse_block({"end"})
            self.expect("end")
            return While(cond, body)
        if kind == "name" and val == "for":
            self.next()
            var = self.next()[1]
            self.expect("=")
            start = self.parse_expr()
            self.expect(",")
            stop = self.parse_expr()
            self.expect("do")
            body = self.parse_block({"end"})
            self.expect("end")
            return For(var, start, stop, body)
        if kind == "name" and val == "function":
            self.next()
            name = self.next()[1]
            self.expect("(")
            params = self.parse_params()
            body = self.parse_block({"end"})
            self.expect("end")
            return FuncDef(name, params, body)
        if kind == "name" and val == "class":
            self.next()
            name = self.next()[1]
            parent = None
            if self.at(":") or self.at("super"):
                self.next()
                if self.at("("):
                    self.expect("(")
                    parent = self.next()[1]
                    self.expect(")")
                else:
                    parent = self.next()[1]
            methods = []
            self.expect("{") if self.at("{") else None
            while self.peek()[0] == "name" and self.peek()[1] == "method":
                self.next()
                mname = self.next()[1]
                self.expect("(")
                params = self.parse_params()
                body = self.parse_block({"end"})
                self.expect("end")
                methods.append(MethodDef(mname, params, body))
            if self.at("}"):
                self.next()
            self.expect("end")
            return ClassDef(name, parent, methods)
        if kind == "name" and val == "return":
            self.next()
            value = None if (self.peek()[1] in ("end", "else", "elif")) else self.parse_expr()
            return Return(value)
        # expression statement / assignment
        expr = self.parse_expr()
        if self.at("="):
            self.next()
            value = self.parse_expr()
            return Assign(expr, value)
        return expr

    def parse_if(self):
        self.next()  # if
        cond = self.parse_expr()
        self.expect("then")
        then = self.parse_block({"else", "elif", "end"})
        els = None
        if self.at("elif"):
            els = self.parse_if_tail()
        elif self.at("else"):
            self.next()
            els = self.parse_block({"end"})
        self.expect("end")
        return If(cond, then, els)

    def parse_if_tail(self):
        self.next()  # elif
        cond = self.parse_expr()
        self.expect("then")
        then = self.parse_block({"else", "elif", "end"})
        els = None
        if self.at("elif"):
            els = self.parse_if_tail()
        elif self.at("else"):
            self.next()
            els = self.parse_block({"end"})
        self.expect("end")
        return If(cond, then, els)

    def parse_params(self) -> list[str]:
        params = []
        if not self.at(")"):
            while True:
                params.append(self.next()[1])
                if self.at(","):
                    self.next()
                else:
                    break
        self.expect(")")
        return params

    # ---- expressions (precedence climbing) ----
    def parse_expr(self):
        return self.parse_or()

    def parse_or(self):
        left = self.parse_and()
        while self.peek()[1] == "or":
            self.next()
            left = BinOp("or", left, self.parse_and())
        return left

    def parse_and(self):
        left = self.parse_cmp()
        while self.peek()[1] == "and":
            self.next()
            left = BinOp("and", left, self.parse_cmp())
        return left

    def parse_cmp(self):
        left = self.parse_concat()
        while self.peek()[1] in ("==", "~=", "<", ">", "<=", ">="):
            op = self.next()[1]
            left = BinOp(op, left, self.parse_concat())
        return left

    def parse_concat(self):
        left = self.parse_add()
        while self.peek()[1] == "..":
            self.next()
            left = BinOp("..", left, self.parse_add())
        return left

    def parse_add(self):
        left = self.parse_mul()
        while self.peek()[1] in ("+", "-"):
            op = self.next()[1]
            left = BinOp(op, left, self.parse_mul())
        return left

    def parse_mul(self):
        left = self.parse_unary()
        while self.peek()[1] in ("*", "/", "%"):
            op = self.next()[1]
            left = BinOp(op, left, self.parse_unary())
        return left

    def parse_unary(self):
        if self.peek()[1] in ("-", "not"):
            op = self.next()[1]
            return UnaryOp(op, self.parse_unary())
        return self.parse_postfix()

    def parse_postfix(self):
        expr = self.parse_primary()
        while True:
            if self.at("."):
                self.next()
                name = self.next()[1]
                if self.at("("):
                    expr = MethodCall(expr, name, self.parse_args())
                else:
                    expr = Field(expr, name)
            elif self.at("["):
                self.next()
                key = self.parse_expr()
                self.expect("]")
                expr = Index(expr, key)
            elif self.at("("):
                expr = Call(expr, self.parse_args())
            elif self.at(":"):
                self.next()
                name = self.next()[1]
                expr = MethodCall(expr, name, self.parse_args())
            else:
                break
        return expr

    def parse_args(self) -> list:
        self.expect("(")
        args = []
        if not self.at(")"):
            while True:
                args.append(self.parse_expr())
                if self.at(","):
                    self.next()
                else:
                    break
        self.expect(")")
        return args

    def parse_primary(self):
        kind, val = self.next()
        if kind == "number":
            return Num(val)
        if kind == "string":
            return Str(val)
        if kind == "name":
            if val == "true":
                return Num(1)
            if val == "false":
                return Num(0)
            if val == "nil":
                return Name("nil")
            if val == "function":
                self.expect("(")
                params = self.parse_params()
                body = self.parse_block({"end"})
                self.expect("end")
                return FuncDef("<anon>", params, body)
            if val == "{":
                items = []
                if not self.at("}"):
                    while True:
                        if self.at("["):
                            self.next()
                            key = self.parse_expr()
                            self.expect("]")
                            self.expect("=")
                            items.append((key, self.parse_expr()))
                        elif self.peek()[1] == "}":
                            break
                        else:
                            k = self.next()[1]
                            if self.at("="):
                                self.next()
                                items.append((Str(k), self.parse_expr()))
                            else:
                                raise BrainScriptError("bad table literal")
                        if self.at(","):
                            self.next()
                        else:
                            break
                self.expect("}")
                return TableLit(items)
            return Name(val)
        if val == "(":
            e = self.parse_expr()
            self.expect(")")
            return e
        raise BrainScriptError(f"unexpected token {val!r}")


# ---------------------------------------------------------------------------
# Interpreter
# ---------------------------------------------------------------------------

class BSFunction:
    def __init__(self, name, params, body, env, interp):
        self.name = name
        self.params = params
        self.body = body
        self.env = env
        self.interp = interp

    def __repr__(self):
        return f"<fn {self.name}>"


class BSClass:
    def __init__(self, name, parent, methods):
        self.name = name
        self.parent = parent
        self.methods = methods

    def new(self, *args, interp=None):
        inst = BSInstance(self)
        init = self.find_method("init")
        if init:
            if interp is None:
                raise BrainScriptError("interpreter required")
            interp.call(init, [inst, *args])
        return inst

    def find_method(self, name: str):
        cls = self
        while cls:
            if name in cls.methods:
                return cls.methods[name]
            cls = cls.parent
        return None


class BSInstance:
    def __init__(self, cls: BSClass):
        self.cls = cls
        self.fields: dict[str, Any] = {}


class ReturnSignal(Exception):
    def __init__(self, value):
        self.value = value


class Interpreter:
    def __init__(self, natives: dict[str, Callable] | None = None):
        self.globals: dict[str, Any] = {"_": None}
        for name, fn in (natives or {}).items():
            self.globals[name] = fn

    # -- environment is a chain of dicts --
    def run(self, src: str) -> Any:
        tokens = tokenize(src)
        ast = Parser(tokens).parse_block({"__eof__"})
        try:
            self.exec_block(ast, self.globals)
        except ReturnSignal as r:
            return r.value
        return None

    def exec_block(self, block: Block, env: dict):
        for stmt in block.stmts:
            self.exec_stmt(stmt, env)

    def exec_stmt(self, stmt: Node, env: dict):
        if isinstance(stmt, Assign):
            value = self.eval(stmt.value, env)
            self.assign(stmt.target, value, env, local=stmt.local)
        elif isinstance(stmt, If):
            if self.truthy(self.eval(stmt.cond, env)):
                self.exec_block(stmt.then, env)
            elif stmt.els is not None:
                if isinstance(stmt.els, Block):
                    self.exec_block(stmt.els, env)
                else:
                    self.exec_stmt(stmt.els, env)
        elif isinstance(stmt, While):
            while self.truthy(self.eval(stmt.cond, env)):
                self.exec_block(stmt.body, env)
        elif isinstance(stmt, For):
            start = int(self.eval(stmt.start, env))
            stop = int(self.eval(stmt.stop, env))
            for i in range(start, stop + 1):
                env[stmt.var] = float(i)
                self.exec_block(stmt.body, env)
        elif isinstance(stmt, FuncDef):
            env[stmt.name] = BSFunction(stmt.name, stmt.params, stmt.body, env, self)
        elif isinstance(stmt, ClassDef):
            parent = env.get(stmt.parent) if stmt.parent else None
            if stmt.parent and not isinstance(parent, BSClass):
                raise BrainScriptError(f"unknown parent class {stmt.parent!r}")
            methods = {m.name: BSFunction(m.name, m.params, m.body, env, self) for m in stmt.methods}
            env[stmt.name] = BSClass(stmt.name, parent, methods)
        elif isinstance(stmt, Return):
            raise ReturnSignal(self.eval(stmt.value, env) if stmt.value is not None else None)
        else:
            self.eval(stmt, env)

    def assign(self, target: Node, value: Any, env: dict, local: bool = False):
        if isinstance(target, Name):
            if target.v == "nil":
                raise BrainScriptError("cannot assign to nil")
            if local or target.v not in env:
                if not local and target.v not in env:
                    # create in the nearest writable scope (globals here)
                    self.globals[target.v] = value
                else:
                    env[target.v] = value
            else:
                env[target.v] = value
        elif isinstance(target, Field):
            obj = self.eval(target.obj, env)
            if isinstance(obj, BSInstance):
                obj.fields[target.name] = value
            elif isinstance(obj, dict):
                obj[target.name] = value
            else:
                raise BrainScriptError("cannot assign field on this value")
        elif isinstance(target, Index):
            obj = self.eval(target.obj, env)
            key = self.eval(target.key, env)
            if not isinstance(obj, dict):
                raise BrainScriptError("index assignment requires a table")
            obj[key] = value
        else:
            raise BrainScriptError("invalid assignment target")

    def truthy(self, v: Any) -> bool:
        if v is None or v is False:
            return False
        if isinstance(v, (int, float)):
            return v != 0
        return True

    def eval(self, node: Node, env: dict) -> Any:
        if isinstance(node, Num):
            return node.v
        if isinstance(node, Str):
            return node.v
        if isinstance(node, Name):
            if node.v == "nil":
                return None
            if node.v in env:
                return env[node.v]
            if node.v in self.globals:
                return self.globals[node.v]
            raise BrainScriptError(f"undefined name {node.v!r}")
        if isinstance(node, BinOp):
            l = self.eval(node.l, env)
            r = self.eval(node.r, env)
            op = node.op
            if op == "+":
                if isinstance(l, str) or isinstance(r, str):
                    return f"{l}{r}"
                return l + r
            if op == "-": return l - r
            if op == "*": return l * r
            if op == "/": return l / r
            if op == "%": return l % r
            if op == "..": return f"{l}{r}"
            if op == "==": return l == r
            if op == "~=": return l != r
            if op == "<": return l < r
            if op == ">": return l > r
            if op == "<=": return l <= r
            if op == ">=": return l >= r
            if op == "and": return r if self.truthy(l) else l
            if op == "or": return l if self.truthy(l) else r
            raise BrainScriptError(f"unknown operator {op}")
        if isinstance(node, UnaryOp):
            v = self.eval(node.e, env)
            if node.op == "-":
                return -v
            if node.op == "not":
                return 0 if self.truthy(v) else 1
        if isinstance(node, Call):
            fn = self.eval(node.func, env)
            args = [self.eval(a, env) for a in node.args]
            return self.call(fn, args)
        if isinstance(node, MethodCall):
            obj = self.eval(node.obj, env)
            args = [self.eval(a, env) for a in node.args]
            return self.method_call(obj, node.name, args)
        if isinstance(node, Field):
            obj = self.eval(node.obj, env)
            if isinstance(obj, BSInstance):
                if node.name in obj.fields:
                    return obj.fields[node.name]
                raise BrainScriptError(f"no field {node.name!r}")
            if isinstance(obj, dict):
                return obj.get(node.name)
            if isinstance(obj, BSClass):
                m = obj.find_method(node.name)
                if m:
                    return m
            raise BrainScriptError(f"no field {node.name!r}")
        if isinstance(node, Index):
            obj = self.eval(node.obj, env)
            key = self.eval(node.key, env)
            if isinstance(obj, dict):
                return obj.get(key)
            if isinstance(obj, (list, str)):
                return obj[int(key)]
            raise BrainScriptError("cannot index this value")
        if isinstance(node, TableLit):
            return {self.eval(k, env): self.eval(v, env) for k, v in node.items}
        if isinstance(node, FuncDef):
            return BSFunction(node.name, node.params, node.body, env, self)
        raise BrainScriptError(f"cannot evaluate {type(node).__name__}")

    def call(self, fn: Any, args: list) -> Any:
        if isinstance(fn, BSFunction):
            child = dict(fn.env)
            child["self"] = None
            for p, a in zip(fn.params, args):
                child[p] = a
            try:
                fn.interp.exec_block(fn.body, child)
            except ReturnSignal as r:
                return r.value
            return None
        if callable(fn):
            return fn(*args)
        raise BrainScriptError(f"{fn!r} is not callable")

    def method_call(self, obj: Any, name: str, args: list) -> Any:
        if isinstance(obj, BSInstance):
            m = obj.cls.find_method(name)
            if m is None:
                raise BrainScriptError(f"no method {name!r} on {obj.cls.name}")
            return self.call(m, [obj, *args])
        if isinstance(obj, BSClass):
            if name == "new":
                return obj.new(*args, interp=self)
            m = obj.find_method(name)
            if m:
                return self.call(m, args)
        if isinstance(obj, dict):
            return self.call(obj.get(name), args)
        if isinstance(obj, str):
            if name == "len":
                return float(len(obj))
        raise BrainScriptError(f"no method {name!r} for {type(obj).__name__}")


# ---------------------------------------------------------------------------
# Host-native function library (wired to the CL1 backend by the server)
# ---------------------------------------------------------------------------

def default_natives() -> dict[str, Callable]:
    import math
    import random

    def log(*args):
        print("[brainscript]", *args)
        return None

    def tostring(v):
        return str(v)

    def tonumber(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    return {
        "log": log,
        "print": log,
        "tostring": tostring,
        "tonumber": tonumber,
        "abs": abs,
        "floor": math.floor,
        "ceil": math.ceil,
        "sqrt": math.sqrt,
        "sin": math.sin,
        "cos": math.cos,
        "random": random.random,
        "time": lambda: float(random.randint(0, 2**30)),
    }


def run_script(src: str, natives: dict[str, Callable] | None = None) -> Any:
    """Run a BrainScript program; returns the value of the last top-level return."""
    interp = Interpreter(natives or default_natives())
    return interp.run(src)


EXAMPLE_SCRIPT = """
-- BrainScript demo: OOP neuron model
class Neuron
    method init(self, threshold)
        self.threshold = threshold
        self.spikes = 0
    end
    method tick(self, rate)
        if rate > self.threshold then
            self.spikes = self.spikes + 1
            return 1
        else
            return 0
        end
    end
end

class LIFNeuron super(Neuron)
    method init(self, threshold, decay)
        super.init(self, threshold)
        self.decay = decay
    end
end

local n = Neuron.new(5)
local total = 0
for i = 1, 10 do
    total = total + n:tick(i)
end
log("spikes fired:", total)
return total
"""

if __name__ == "__main__":
    result = run_script(EXAMPLE_SCRIPT)
    print("returned:", result)
