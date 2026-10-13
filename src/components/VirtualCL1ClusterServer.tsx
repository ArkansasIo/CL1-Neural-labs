import React,{useEffect,useState} from "react";
type Device={slot:number;device_id:string;connected:boolean;recording:boolean;mode:string;estop:boolean};
export default function VirtualCL1ClusterServer(){
 const [devices,setDevices]=useState<Device[]>([]); const [tables,setTables]=useState<string[]>([]);
 const refresh=async()=>{const [a,b]=await Promise.all([fetch("/api/cluster"),fetch("/api/database/tables")]);const c=await a.json(),t=await b.json();setDevices(c.devices);setTables(t.tables)};
 useEffect(()=>{refresh();const id=setInterval(refresh,2000);return()=>clearInterval(id)},[]);
 return <section><header><b>VIRTUAL CL1 CLUSTER SERVER</b><span> · REST + SQL persistence</span></header>
 <div>{devices.length} nodes · {devices.filter(d=>d.connected).length} connected · {devices.filter(d=>d.recording).length} recording</div>
 <div>{devices.map(d=><article key={d.slot}><b>{d.device_id}</b><span>{d.connected?"CONNECTED":"OFFLINE"}</span><span>{d.recording?"RECORDING":"IDLE"}</span><span>{d.estop?"E-STOP":"SAFE"}</span></article>)}</div>
 <aside><b>DATABASE TABLES</b>{tables.map(t=><code key={t}>{t}</code>)}</aside></section>;
}