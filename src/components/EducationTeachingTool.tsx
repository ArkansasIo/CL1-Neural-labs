import React,{useState} from "react";
import {EDUCATION_LEVELS,EducationTeachingClient,type EducationLevel} from "../client/educationClient";
const examples:Record<EducationLevel,string[]>={kindergarten:["2+1","3>2"],elementary:["12*4","3/4"],middle_school:["2*x+3=11"],high_school:["x^2-5*x+6=0","f(x)=x^2+1"],college:["d/dx 3*x^2+2*x+1","integral 2*x+1"],university:["d/dx 3*x^4+2*x^2+1","integral 2*x^3+1"]};
function answer(q:string){if(q.trim()==="2+1")return "3";if(q.trim()==="12*4")return "48";if(/^2\*x\+3\s*=\s*11$/.test(q.replace(/\s+/g,"")))return "x = 4";if(/^d\/dx\s+/i.test(q))return "Use the power rule; exact polynomial differentiation is handled by the Python engine.";if(/^integral\s+/i.test(q))return "Use the power rule and add C; exact polynomial integration is handled by the Python engine.";return "Question captured. Connect this node to the Python symbolic engine for exact solving."}
export default function EducationTeachingTool(){
 const [level,setLevel]=useState<EducationLevel>("kindergarten"),[node,setNode]=useState("node-001"),[question,setQuestion]=useState("2+1"),[score,setScore]=useState(1);
 const [client]=useState(()=>new EducationTeachingClient()); const [version,setVersion]=useState(0); const state=client.ensureNode(node,level);
 return <section className="p-4 overflow-auto h-full"><h2 className="text-xl font-semibold">Education & Formula Teaching Lab</h2><p className="text-slate-400">Curriculum progression and per-node mastery metadata.</p>
  <div className="flex flex-wrap gap-2 my-3">{EDUCATION_LEVELS.map(l=><button key={l} onClick={()=>{setLevel(l);setQuestion(examples[l][0])}} className={level===l?"px-3 py-2 rounded bg-blue-600":"px-3 py-2 rounded bg-slate-800"}>{l.replace("_"," ")}</button>)}</div>
  <div className="grid md:grid-cols-3 gap-3"><label>Node<input className="block bg-slate-900 p-2 rounded w-full" value={node} onChange={e=>setNode(e.target.value)}/></label><label>Question<input className="block bg-slate-900 p-2 rounded w-full" value={question} onChange={e=>setQuestion(e.target.value)}/></label><label>Score<input type="number" min="0" max="1" step=".1" className="block bg-slate-900 p-2 rounded w-full" value={score} onChange={e=>setScore(+e.target.value)}/></label></div>
  <div className="mt-4 p-4 rounded bg-slate-900"><div className="text-xs text-slate-400">OUTPUT</div><div className="text-lg mt-1">{answer(question)}</div></div>
  <button className="mt-3 px-4 py-2 rounded bg-emerald-600" onClick={()=>{client.record(node,"manual-query",score);setVersion(version+1)}}>Record learned</button>
  <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div>Level<br/><b>{state.level}</b></div><div>Attempts<br/><b>{state.attempts+version}</b></div><div>Correct<br/><b>{state.correct}</b></div></div>
  <p className="text-xs text-slate-500 mt-4">A “per neuron node” is a software teaching abstraction, not a claim that an individual biological neuron learns a school curriculum.</p>
 </section>
}