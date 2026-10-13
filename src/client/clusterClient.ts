export type ClusterSize=1|2|4|8|16|32|64|128;
export type DeviceMode="simulator"|"data_replay"|"sdk_simulator"|"physical_adapter";
export interface DeviceStatus{slot:number;device_id:string;online:boolean;connected:boolean;recording:boolean;mode:string;estop:boolean}
export interface ClusterTopology{cluster_size:number;supported_sizes:number[];devices:{slot:number;device_id:string;channels:number}[]}
export interface ClusterStatus{topology:ClusterTopology;devices:DeviceStatus[]}
export interface DatabaseTableResponse{table:string;rows:Record<string,unknown>[]}
export interface ClusterClientOptions{baseUrl?:string;fetchImpl?:typeof fetch;pollMs?:number}

export class CL1ClusterClient{
 private baseUrl:string; private fetchImpl:typeof fetch; private pollTimer:number|undefined;
 constructor(options:ClusterClientOptions={}){
   this.baseUrl=(options.baseUrl??"").replace(/\/$/,""); this.fetchImpl=options.fetchImpl??fetch.bind(globalThis);
 }
 private async request<T>(path:string,init?:RequestInit):Promise<T>{
   const r=await this.fetchImpl(this.baseUrl+path,{headers:{"Accept":"application/json","Content-Type":"application/json"},...init});
   if(!r.ok) throw new Error(`CL1 server ${r.status}: ${await r.text()}`);
   return r.json() as Promise<T>;
 }
 getCluster(){return this.request<ClusterStatus>("/api/cluster")}
 connectAll(){return this.request<ClusterStatus>("/api/cluster/connect",{method:"POST"})}
 pauseDevice(slot:number){return this.request<ClusterStatus>(`/api/cluster/pause/${slot}`,{method:"POST"})}
 resumeDevice(slot:number){return this.request<ClusterStatus>(`/api/cluster/resume/${slot}`,{method:"POST"})}
 getTables(){return this.request<{tables:string[]}>("/api/database/tables")}
 getTable(name:string){return this.request<DatabaseTableResponse>(`/api/database/${encodeURIComponent(name)}`)}
 startPolling(callback:(status:ClusterStatus)=>void,intervalMs=2000){
   this.stopPolling(); const tick=async()=>{try{callback(await this.getCluster())}catch{}};
   void tick(); this.pollTimer=window.setInterval(()=>void tick(),intervalMs);
 }
 stopPolling(){if(this.pollTimer!==undefined){window.clearInterval(this.pollTimer);this.pollTimer=undefined}}
}

export const cl1ClusterClient=new CL1ClusterClient();