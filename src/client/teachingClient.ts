import {CL1ClusterClient} from "./clusterClient";

export type PongTrainingEvent={trial:number;targetPosition:number;motorAction:"UP"|"DOWN"|"HOLD";reward:number;latencyMs:number;source:"virtual"};
export interface PongTrainingState{trial:number;score:number;hits:number;misses:number;longestRally:number;learningRate:number;policy:Array<"UP"|"DOWN"|"HOLD">}

export class PongTeachingClient{
 private state:PongTrainingState={trial:0,score:0,hits:0,misses:0,longestRally:0,learningRate:.05,policy:[]};
 private history:PongTrainingEvent[]=[];
 constructor(private cluster:CL1ClusterClient){}
 getState(){return structuredClone(this.state)}
 getHistory(){return this.history.slice()}
 observe(targetPosition:number,motorAction:"UP"|"DOWN"|"HOLD",reward:number,latencyMs:number):PongTrainingEvent{
   this.state.trial++;
   if(reward>0)this.state.hits++; else if(reward<0)this.state.misses++;
   this.state.score+=reward; this.state.longestRally=Math.max(this.state.longestRally,this.state.hits-this.state.misses);
   this.state.policy.push(motorAction); this.state.policy=this.state.policy.slice(-100);
   const event={trial:this.state.trial,targetPosition,motorAction,reward,latencyMs,source:"virtual" as const};
   this.history.push(event); this.history=this.history.slice(-1000); return event;
 }
 async pauseTraining(slot:number){return this.cluster.pauseDevice(slot)}
 async resumeTraining(slot:number){return this.cluster.resumeDevice(slot)}
 reset(){this.state={trial:0,score:0,hits:0,misses:0,longestRally:0,learningRate:.05,policy:[]};this.history=[]}
}