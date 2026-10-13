"""Curriculum, symbolic algebra/calculus practice, and per-node teaching state."""
from __future__ import annotations
from dataclasses import dataclass, field
import ast, math, operator, re
from typing import Any

LEVELS=("kindergarten","elementary","middle_school","high_school","college","university")

@dataclass(frozen=True)
class Lesson:
    lesson_id:str
    domain:str
    level:str
    title:str
    concepts:tuple[str,...]
    examples:tuple[str,...]
    difficulty:int

@dataclass
class NodeLearningState:
    node_id:str
    level:str="kindergarten"
    mastery:dict[str,float]=field(default_factory=dict)
    attempts:int=0
    correct:int=0
    learned_lessons:list[str]=field(default_factory=list)
    knowledge_table:dict[str,dict[str,Any]]=field(default_factory=dict)

def curriculum() -> list[Lesson]:
    return [
      Lesson("K-NUM","mathematics","kindergarten","Counting and shapes",("counting","comparison","shapes"),("2+1","3>2"),1),
      Lesson("E-ARITH","mathematics","elementary","Arithmetic",("addition","subtraction","multiplication","division","fractions"),("12*4","3/4"),2),
      Lesson("E-GEOM","mathematics","elementary","Measurement and geometry",("length","area","perimeter","angles"),("2*(3+4)","pi*r^2"),3),
      Lesson("M-ALG","algebra","middle_school","Expressions and equations",("variables","order_of_operations","linear_equations","ratios"),("2*x+3=11","y=2*x+1"),4),
      Lesson("HS-ALG","algebra","high_school","Algebra and functions",("quadratics","systems","polynomials","functions","exponents"),("x^2-5*x+6=0","f(x)=x^2+1"),5),
      Lesson("HS-TRIG","mathematics","high_school","Trigonometry",("sine","cosine","tangent","identities"),("sin(x)^2+cos(x)^2=1",),5),
      Lesson("C-ALG","algebra","college","Linear algebra foundations",("vectors","matrices","linear_maps"),("A*x=b","det(A)"),7),
      Lesson("C-CALC","calculus","college","Differential and integral calculus",("limits","derivatives","integrals","series"),("d/dx x^3","integral x^2 dx"),7),
      Lesson("U-CALC","calculus","university","Multivariable and advanced calculus",("partial_derivatives","gradients","multiple_integrals","ode"),("grad f","integral_0^1 x^2 dx"),9),
      Lesson("U-ANALYSIS","mathematics","university","Analysis and numerical methods",("convergence","error","optimization","numerical_methods"),("Newton iteration","Taylor series"),10),
    ]

def lessons_for_level(level:str)->list[Lesson]:
    if level not in LEVELS: raise ValueError(f"unknown level: {level}")
    rank=LEVELS.index(level)
    return [x for x in curriculum() if LEVELS.index(x.level)<=rank]

_ALLOWED={"pi":math.pi,"e":math.e,"sqrt":math.sqrt,"sin":math.sin,"cos":math.cos,"tan":math.tan,"abs":abs,"log":math.log}
_BIN={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv,ast.Pow:operator.pow}
_UNARY={ast.USub:operator.neg,ast.UAdd:operator.pos}

def evaluate(expression:str, variables:dict[str,float]|None=None)->float:
    env=dict(_ALLOWED);env.update(variables or {})
    tree=ast.parse(expression.replace("^","**").replace("×","*").replace("÷","/").strip(),mode="eval")
    def ev(n:ast.AST)->float:
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)): return float(n.value)
        if isinstance(n,ast.Name) and n.id in env and isinstance(env[n.id],(int,float)): return float(env[n.id])
        if isinstance(n,ast.UnaryOp) and type(n.op) in _UNARY:return _UNARY[type(n.op)](ev(n.operand))
        if isinstance(n,ast.BinOp) and type(n.op) in _BIN:return _BIN[type(n.op)](ev(n.left),ev(n.right))
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id in _ALLOWED:return float(_ALLOWED[n.func.id](*(ev(a) for a in n.args)))
        raise ValueError("unsupported expression")
    return ev(tree.body)

def solve_linear(equation:str)->dict[str,Any]:
    lhs,rhs=map(str.strip,equation.split("=",1)); samples=(0.0,1.0)
    y=[evaluate(lhs,{"x":x})-evaluate(rhs,{"x":x}) for x in samples]; a=y[1]-y[0]; b=y[0]
    if abs(a)<1e-12:return {"kind":"linear","variable":"x","solutions":[] if abs(b)>1e-12 else "all"}
    x=-b/a; return {"kind":"linear","variable":"x","solutions":[x],"explanation":f"x = {x:g}"}

def _poly_terms(expression:str, variable:str)->list[tuple[float,int]]:
    text=expression.replace("^","**").replace(" ",""); terms=re.findall(r"[+-]?[^+-]+",text); out=[]
    for term in terms:
        m=re.fullmatch(r"([+-]?\d*\.?\d*)\*?"+re.escape(variable)+r"(?:\*\*(\d+))?",term)
        if m:
            c=m.group(1); coef=1.0 if c in ("","+") else -1.0 if c=="-" else float(c); out.append((coef,int(m.group(2) or "1")))
        elif re.fullmatch(r"[+-]?\d*\.?\d*",term): out.append((float(term),0))
        else: raise ValueError(f"unsupported polynomial term: {term}")
    return out

def derivative_polynomial(expression:str, variable:str="x")->str:
    out=[]
    for c,p in _poly_terms(expression,variable):
        if p==0: continue
        n=c*p; q=p-1; out.append(f"{n:g}" if q==0 else f"{n:g}*{variable}" if q==1 else f"{n:g}*{variable}**{q}")
    return "+".join(out).replace("+-","-") or "0"

def integrate_polynomial(expression:str, variable:str="x", constant:str="C")->str:
    out=[]
    for c,p in _poly_terms(expression,variable):
        q=p+1; n=c/q; out.append(f"{n:g}*{variable}" if q==1 else f"{n:g}*{variable}**{q}")
    return "+".join(out).replace("+-","-")+f"+{constant}"

class TeachingNode:
    def __init__(self,node_id:str,level:str="kindergarten"):
        if level not in LEVELS: raise ValueError(f"unknown level: {level}")
        self.state=NodeLearningState(node_id=node_id,level=level)
    def learn(self,lesson_id:str,score:float=1.0):
        lesson=next((x for x in curriculum() if x.lesson_id==lesson_id),None)
        if lesson is None: raise KeyError(lesson_id)
        score=max(0.0,min(1.0,score)); self.state.attempts+=1
        if score>=.8:self.state.correct+=1
        self.state.mastery[lesson_id]=max(self.state.mastery.get(lesson_id,0),score)
        if lesson_id not in self.state.learned_lessons:self.state.learned_lessons.append(lesson_id)
        self.state.knowledge_table[lesson_id]={"title":lesson.title,"domain":lesson.domain,"level":lesson.level,"mastery":self.state.mastery[lesson_id],"concepts":lesson.concepts}
    def answer(self,prompt:str)->dict[str,Any]:
        p=prompt.strip()
        try:
            if "=" in p and re.search(r"\bx\b",p): result=solve_linear(p)
            elif p.lower().startswith("d/dx "): result={"operation":"derivative","result":derivative_polynomial(p[5:])}
            elif p.lower().startswith("integral "): result={"operation":"integral","result":integrate_polynomial(p[9:])}
            else: result={"operation":"evaluate","result":evaluate(p)}
            return {"node_id":self.state.node_id,"level":self.state.level,"answer":result,"confidence":"symbolic-rule-based"}
        except Exception as exc:return {"node_id":self.state.node_id,"level":self.state.level,"answer":None,"error":str(exc)}
