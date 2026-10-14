import React,{useMemo,useState} from "react";
import {MAZE_VARIANTS,MazeTeachingClient,type MazeAlgorithm,type MazeVariant} from "../client/mazeTeachingClient";

type P={r:number;c:number};
const toCell=(p:P)=>({row:p.r,col:p.c});
function makeGrid(rows:number,cols:number,seed:number):number[][]{
 const g=Array.from({length:rows},()=>Array(cols).fill(1));let s=seed|0;
 const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 const stack:P[]=[{r:0,c:0}];g[0][0]=0;
 while(stack.length){const p=stack[stack.length-1];const opts=[{r:p.r-1,c:p.c},{r:p.r,c:p.c+1},{r:p.r+1,c:p.c},{r:p.r,c:p.c-1}].filter(q=>q.r>=0&&q.c>=0&&q.r<rows&&q.c<cols&&g[q.r][q.c]===1);
 if(!opts.length){stack.pop();continue}const q=opts[Math.floor(rand()*opts.length)];g[q.r][q.c]=0;stack.push(q)}
 return g;
}
function search(g:number[][],algo:MazeAlgorithm):{path:P[];visited:P[];cost:number;found:boolean}{
 const rows=g.length,cols=g[0].length,start={r:0,c:0},goal={r:rows-1,c:cols-1},key=(p:P)=>p.r*cols+p.c;
 const queue:P[]=[start],parent=new Map<number,number|null>([[key(start),null]]),visited:P[]=[];
 while(queue.length){const p=algo==="dfs"?queue.pop()!:queue.shift()!;if(visited.some(v=>key(v)===key(p)))continue;visited.push(p);if(key(p)===key(goal))break;
 let ns=[{r:p.r-1,c:p.c},{r:p.r,c:p.c+1},{r:p.r+1,c:p.c},{r:p.r,c:p.c-1}].filter(q=>q.r>=0&&q.c>=0&&q.r<rows&&q.c<cols&&g[q.r][q.c]===0);
 if(algo==="dfs")ns.reverse();
 if(algo==="greedy")ns.sort((a,b)=>(Math.abs(a.r-goal.r)+Math.abs(a.c-goal.c))-(Math.abs(b.r-goal.r)+Math.abs(b.c-goal.c)));
 for(const q of ns)if(!parent.has(key(q))){parent.set(key(q),key(p));queue.push(q)}
 }
 if(!parent.has(key(goal)))return{path:[],visited,cost:Infinity,found:false};
 const byKey=new Map<number,P>();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)byKey.set(key({r,c}),{r,c});
 const path:P[]=[];let k:number|null=key(goal);while(k!==null){path.push(byKey.get(k)!);k=parent.get(k)??null}path.reverse();
 return{path,visited,cost:path.length-1,found:true};
}
export default function MazeTeachingTool(){
 const [rows,setRows]=useState(15),[cols,setCols]=useState(21),[seed,setSeed]=useState(4);
 const [variant,setVariant]=useState<MazeVariant>("perfect"),[algo,setAlgo]=useState<MazeAlgorithm>("astar"),[run,setRun]=useState(0);
 const [client]=useState(()=>new MazeTeachingClient());
 const grid=useMemo(()=>makeGrid(rows,cols,seed),[rows,cols,seed]);
 const result=useMemo(()=>search(grid,algo),[grid,algo,run]);
 const summary=useMemo(()=>client.record({algorithm:algo,path:result.path.map(toCell),visited:result.visited.map(toCell),cost:result.cost,found:result.found}),[run]);
 const visited=new Set(result.visited.map(p=>p.r*cols+p.c)),path=new Set(result.path.map(p=>p.r*cols+p.c));
 const meta=MAZE_VARIANTS.find(v=>v.id===variant)!;
 return <section className="maze-teaching-tool">
  <header><h2>Maze Teaching & Pathfinding Lab</h2><p>Procedural layouts, search visualisation, and algorithm comparison. Simulation only.</p></header>
  <div className="maze-settings">
   <label>Maze family<select value={variant} onChange={e=>setVariant(e.target.value as MazeVariant)}>{MAZE_VARIANTS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
   <label>Algorithm<select value={algo} onChange={e=>setAlgo(e.target.value as MazeAlgorithm)}>{(["astar","bfs","dfs","dijkstra","greedy","bidirectional-bfs"] as MazeAlgorithm[]).map(a=><option key={a}>{a}</option>)}</select></label>
   <label>Rows<input type="number" min="5" max="35" value={rows} onChange={e=>setRows(Math.max(5,Math.min(35,+e.target.value||5)))}/></label>
   <label>Columns<input type="number" min="5" max="45" value={cols} onChange={e=>setCols(Math.max(5,Math.min(45,+e.target.value||5)))}/></label>
   <button onClick={()=>{setSeed(seed+1);setRun(run+1)}}>Generate / Solve</button>
  </div>
  <p>{meta.teaching}</p>
  <div className="maze-grid" style={{display:"grid",gridTemplateColumns:`repeat(${cols}, minmax(8px, 1fr))`,gap:2}} role="img" aria-label="Maze with start, goal, visited cells and selected path">
   {grid.flatMap((line,r)=>line.map((wall,c)=>{const k=r*cols+c;const isPath=path.has(k),wasVisited=visited.has(k);return <div key={k} title={`row ${r}, column ${c}`} style={{aspectRatio:"1",background:r===0&&c===0?"#27ae60":r===rows-1&&c===cols-1?"#e74c3c":wall?"#273449":isPath?"#4da3ff":wasVisited?"#8ca6bb":"#e9eef3",borderRadius:2}}/>}))}
  </div>
  <div className="maze-metrics">Solved: {result.found?"yes":"no"} · Path cost: {Number.isFinite(result.cost)?result.cost:"—"} · Visited cells: {result.visited.length} · Trials: {summary.trials} · Successful: {summary.solved}</div>
  <button onClick={()=>{client.reset();setRun(run+1)}}>Reset metrics</button>
  <p className="maze-note">The catalogue covers common maze families, but this initial visualiser currently generates a perfect square-grid maze. Other grid topologies and dynamic/multi-agent solvers are documented teaching extensions, not yet simulated here.</p>
 </section>
}