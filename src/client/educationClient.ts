export type EducationLevel="kindergarten"|"elementary"|"middle_school"|"high_school"|"college"|"university";
export type EducationDomain="mathematics"|"algebra"|"calculus";
export interface Lesson{lesson_id:string;domain:EducationDomain;level:EducationLevel;title:string;concepts:string[];examples:string[];difficulty:number}
export interface NodeLearningState{node_id:string;level:EducationLevel;mastery:Record<string,number>;attempts:number;correct:number;learned_lessons:string[]}
export const EDUCATION_LEVELS:EducationLevel[]=["kindergarten","elementary","middle_school","high_school","college","university"];
export class EducationTeachingClient{
 private lessons:Lesson[]=[]; private nodes=new Map<string,NodeLearningState>();
 addLessons(lessons:Lesson[]){this.lessons.push(...lessons)}
 ensureNode(node_id:string,level:EducationLevel="kindergarten"){if(!this.nodes.has(node_id))this.nodes.set(node_id,{node_id,level,mastery:{},attempts:0,correct:0,learned_lessons:[]});const n=this.nodes.get(node_id)!;n.level=level;return n}
 record(node_id:string,lesson_id:string,score:number){const n=this.ensureNode(node_id);n.attempts++;if(score>=.8)n.correct++;n.mastery[lesson_id]=Math.max(n.mastery[lesson_id]??0,Math.max(0,Math.min(1,score)));if(!n.learned_lessons.includes(lesson_id))n.learned_lessons.push(lesson_id);return n}
 getNode(node_id:string){return this.nodes.get(node_id)}
 listLessons(level:EducationLevel){const rank=EDUCATION_LEVELS.indexOf(level);return this.lessons.filter(l=>EDUCATION_LEVELS.indexOf(l.level)<=rank)}
 reset(){this.lessons=[];this.nodes.clear()}
}
export const defaultEducationClient=new EducationTeachingClient();
