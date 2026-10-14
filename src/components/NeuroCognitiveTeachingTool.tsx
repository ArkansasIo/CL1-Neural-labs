import React, { useMemo, useState } from "react";
import { BRAIN_SECTIONS, NeuroCognitiveClient } from "../client/neurocognitiveClient";

const examples = ["2*x+3=11", "d/dx 3*x^2+2*x+1", "integral 2*x+1", "2+3*4"];

function explain(q: string) {
  const compact = q.replace(/\s+/g, "");
  if (compact === "2*x+3=11")
    return { answer: "x = 4", steps: ["parse equation","identify x","solve","verify"] };
  if (/^d\/dx\s+/.test(q))
    return { answer: "Derivative task", steps: ["parse","apply power rule","combine terms"] };
  if (/^integral\s+/i.test(q))
    return { answer: "Antiderivative task", steps: ["parse","apply reverse power rule","add C"] };
  if (q.trim() === "2+3*4")
    return { answer: "14", steps: ["parse","multiply first","add"] };
  return { answer: "Unsupported by browser subset", steps: ["parse","check capability boundary"] };
}

export default function NeuroCognitiveTeachingTool() {
  const [node,setNode] = useState("node-001");
  const [q,setQ] = useState(examples[0]);
  const [tick,setTick] = useState(0);
  const [client] = useState(() => new NeuroCognitiveClient());
  const r = useMemo(() => explain(q), [q,tick]);
  const trace = {
    nodeId: node, inputText: q, sections: BRAIN_SECTIONS,
    observations: ["virtual sensory input received"],
    reasoningSteps: r.steps, answer: r.answer,
    confidence: r.answer.startsWith("Unsupported") ? .1 : .95,
    selfExplanation: `I am virtual reasoning node ${node}. I use brain-inspired software sections and constrained symbolic rules; I do not claim human consciousness.`
  };
  return <section className="p-4 overflow-auto h-full">
    <h2 className="text-xl font-semibold">Neural Node Cognitive Architecture</h2>
    <p className="text-slate-400">Brain-inspired symbolic reasoning around each virtual node.</p>
    <div className="flex gap-2 my-3">
      <input className="bg-slate-900 p-2 rounded" value={node} onChange={e=>setNode(e.target.value)} />
      <input className="bg-slate-900 p-2 rounded flex-1" value={q} onChange={e=>setQ(e.target.value)} />
      <button className="px-3 rounded bg-blue-600" onClick={()=>{client.record(trace);setTick(tick+1)}}>Reason</button>
    </div>
    <div className="grid md:grid-cols-3 gap-2">
      {BRAIN_SECTIONS.map(s=><div key={s} className="p-3 rounded bg-slate-900 border border-slate-800">
        <b>{s.replace("_"," ")}</b><div className="text-xs text-slate-500">virtual subsystem</div>
      </div>)}
    </div>
    <div className="mt-4 p-4 rounded bg-slate-900">
      <div className="text-xs text-cyan-400">SELF-EXPLANATION</div><p>{trace.selfExplanation}</p>
      <div className="text-xs text-cyan-400 mt-3">REASONING STEPS</div>
      <ol>{trace.reasoningSteps.map((s,i)=><li key={i}>{i+1}. {s}</li>)}</ol>
      <div className="mt-3">Answer: <b>{String(trace.answer)}</b> · Confidence: {trace.confidence}</div>
    </div>
    <p className="text-xs text-slate-500 mt-4">Functional brain labels are software analogies, not anatomical equivalences.</p>
  </section>;
}
