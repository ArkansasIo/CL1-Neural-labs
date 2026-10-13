"""Brain-inspired symbolic reasoning for virtual neural-cluster nodes.

Functional labels are computational analogies, not anatomical equivalences or claims of consciousness.
"""
from dataclasses import dataclass, field
from typing import Any
from .education import TeachingNode, evaluate, solve_linear, derivative_polynomial, integrate_polynomial

BRAIN_SYSTEMS = ("sensory","working_memory","episodic_memory","semantic_memory",
                 "association","language","executive","motor","self_monitor")

@dataclass
class BrainSectionState:
    name: str
    activity: float = 0.0
    messages: int = 0
    last_input: Any = None

@dataclass
class ReasoningTrace:
    node_id: str
    input_text: str
    sections: list[str]
    observations: list[str]
    reasoning_steps: list[str]
    answer: Any
    confidence: float
    self_explanation: str

class VirtualNeuronBrain:
    def __init__(self, node_id: str, level: str = "kindergarten"):
        self.node_id = node_id
        self.education = TeachingNode(node_id, level)
        self.sections = {name: BrainSectionState(name) for name in BRAIN_SYSTEMS}
        self.history: list[ReasoningTrace] = []

    def _touch(self, name: str, value: Any = None, activity: float = .5):
        s = self.sections[name]
        s.activity = max(0.0, min(1.0, activity))
        s.messages += 1
        s.last_input = value

    def reason(self, prompt: str) -> ReasoningTrace:
        p = prompt.strip()
        self._touch("sensory", p, .4)
        self._touch("working_memory", p, .5)
        observations: list[str] = []
        steps: list[str] = []
        try:
            if "=" in p and "x" in p:
                self._touch("semantic_memory", "linear equation", .8)
                result = solve_linear(p)
                observations.append("Detected a one-variable linear equation.")
                steps = ["parse equation", "identify variable x", "solve", "verify"]
            elif p.lower().startswith("d/dx "):
                self._touch("semantic_memory", "polynomial differentiation", .8)
                result = {"derivative": derivative_polynomial(p[5:])}
                observations.append("Detected a polynomial derivative task.")
                steps = ["parse derivative", "identify terms", "apply power rule", "combine terms"]
            elif p.lower().startswith("integral "):
                self._touch("semantic_memory", "polynomial integration", .8)
                result = {"integral": integrate_polynomial(p[9:])}
                observations.append("Detected an indefinite polynomial integral.")
                steps = ["parse integral", "identify terms", "apply reverse power rule", "add C"]
            else:
                self._touch("semantic_memory", "expression evaluation", .7)
                result = {"value": evaluate(p)}
                observations.append("Detected a supported numeric expression.")
                steps = ["parse expression", "evaluate", "return result"]
            self._touch("association", steps, .7)
            self._touch("executive", result, .8)
            self._touch("language", result, .7)
            self._touch("motor", "answer", .4)
            confidence = .95
            explanation = (
                f"I am virtual reasoning node {self.node_id}. I routed the task through "
                "brain-inspired software stages. My answer comes from constrained symbolic "
                "rules, not a claim of human consciousness."
            )
        except Exception as exc:
            result = {"error": str(exc)}
            observations.append("The current symbolic rule set does not support this problem.")
            steps = ["parse input", "check supported solvers", "report limitation"]
            confidence = .1
            explanation = (
                f"I am virtual reasoning node {self.node_id}. I could not solve this input "
                "with my current rule set, so I report that limitation."
            )
        self._touch("self_monitor", {"confidence": confidence}, confidence)
        trace = ReasoningTrace(self.node_id, p, list(self.sections), observations,
                               steps, result, confidence, explanation)
        self.history.append(trace)
        return trace

    def introspection(self) -> dict[str, Any]:
        return {
            "node_id": self.node_id,
            "curriculum_level": self.education.state.level,
            "sections": {
                k: {"activity": v.activity, "messages": v.messages}
                for k, v in self.sections.items()
            },
            "history_count": len(self.history),
            "capability_boundary": "symbolic computational model; not biological consciousness",
        }

    def explain_last(self) -> str:
        return (self.history[-1].self_explanation if self.history
                else f"I am virtual node {self.node_id}; I have no reasoning trace yet.")
