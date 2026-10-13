import React,{useMemo,useState} from "react";
import {PongTeachingClient} from "../client";
export default function VirtualPongTeaching(){
 const [client]=useState(()=>new PongTeachingClient({} as never));
 const [target,setTarget]=useState(50); const [action,setAction]=useState<"UP"|"DOWN"|"HOLD">("HOLD");
 const [reward,setReward]=useState(1); const state=client.getState();
 const event=useMemo(()=>client.observe.bind(client),[client]);
 return <section className="pong-teaching">
  <header><b>VIRTUAL PONG TEACHING</b><span> · supervised feedback interface</span></header>
  <div className="pong-court"><div className="ball" style={{top:`${target}%`}}/><div className="paddle"/></div>
  <div className="pong-controls">
   <label>Target <input type="range" min="0" max="100" value={target} onChange={e=>setTarget(+e.target.value)}/></label>
   {(["UP","HOLD","DOWN"] as const).map(a=><button key={a} onClick={()=>{setAction(a);event(target,a,reward,20)}}>{a}</button>)}
   <button onClick={()=>client.reset()}>RESET TRAINING</button>
  </div>
  <div className="pong-metrics">Trial {state.trial} · Score {state.score} · Hits {state.hits} · Misses {state.misses} · Longest rally {state.longestRally}</div>
 </section>
}