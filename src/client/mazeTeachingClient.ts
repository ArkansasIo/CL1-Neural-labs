export type Cell={row:number;col:number};
export type MazeAlgorithm="bfs"|"dfs"|"dijkstra"|"astar"|"greedy"|"bidirectional-bfs";
export type MazeVariant="perfect"|"braided"|"rooms"|"recursive-division"|"weave"|"hex"|"triangular"|"weighted"|"dynamic"|"multi-goal"|"multi-agent"|"3d"|"time-expanded"|"unknown-map"|"labyrinth";
export interface MazeSolveResult{algorithm:MazeAlgorithm;path:Cell[];visited:Cell[];cost:number;found:boolean}
export const MAZE_VARIANTS:{id:MazeVariant;name:string;teaching:string}[]=[
{id:"perfect",name:"Perfect maze",teaching:"A single simple route between any connected cells."},
{id:"braided",name:"Braided maze",teaching:"Loops reduce dead ends."},
{id:"rooms",name:"Rooms and corridors",teaching:"Rooms connect through narrow passages."},
{id:"recursive-division",name:"Recursive division",teaching:"Divide space with walls and openings."},
{id:"weave",name:"Weave maze",teaching:"Passages cross using layered topology."},
{id:"hex",name:"Hexagonal grid",teaching:"Six-neighbour adjacency."},
{id:"triangular",name:"Triangular grid",teaching:"Adjacency depends on triangle orientation."},
{id:"weighted",name:"Weighted terrain",teaching:"Optimise total cost, not just steps."},
{id:"dynamic",name:"Dynamic maze",teaching:"Replan when obstacles move."},
{id:"multi-goal",name:"Multi-goal maze",teaching:"Visit waypoints in a required order."},
{id:"multi-agent",name:"Multi-agent maze",teaching:"Avoid collisions and coordinate reservations."},
{id:"3d",name:"3D voxel maze",teaching:"Search a three-dimensional graph."},
{id:"time-expanded",name:"Time-expanded maze",teaching:"Treat time as part of the state."},
{id:"unknown-map",name:"Unknown map",teaching:"Explore and map while moving."},
{id:"labyrinth",name:"Cyclic labyrinth",teaching:"Handle loops and repeated states."}];
export class MazeTeachingClient{
 private trials:{algorithm:MazeAlgorithm;found:boolean;visited:number;pathLength:number;cost:number}[]=[];
 record(result:MazeSolveResult){this.trials.push({algorithm:result.algorithm,found:result.found,visited:result.visited.length,pathLength:result.path.length,cost:result.cost});return this.summary()}
 summary(){return this.trials.reduce((s,t)=>{s.trials++;if(t.found)s.solved++;s.totalVisited+=t.visited;s.totalPathLength+=t.pathLength;return s},{trials:0,solved:0,totalVisited:0,totalPathLength:0})}
 getHistory(){return this.trials.slice()}
 reset(){this.trials=[]}
}