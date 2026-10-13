export type BrainSection =
  | "sensory" | "working_memory" | "episodic_memory" | "semantic_memory"
  | "association" | "language" | "executive" | "motor" | "self_monitor";

export interface ReasoningTrace {
  nodeId: string;
  inputText: string;
  sections: BrainSection[];
  observations: string[];
  reasoningSteps: string[];
  answer: unknown;
  confidence: number;
  selfExplanation: string;
}

export const BRAIN_SECTIONS: BrainSection[] = [
  "sensory","working_memory","episodic_memory","semantic_memory",
  "association","language","executive","motor","self_monitor"
];

export class NeuroCognitiveClient {
  private traces = new Map<string, ReasoningTrace[]>();
  record(trace: ReasoningTrace) {
    const list = this.traces.get(trace.nodeId) ?? [];
    list.push(trace);
    this.traces.set(trace.nodeId, list);
    return trace;
  }
  history(nodeId: string) { return [...(this.traces.get(nodeId) ?? [])]; }
  clear(nodeId?: string) { nodeId ? this.traces.delete(nodeId) : this.traces.clear(); }
}
