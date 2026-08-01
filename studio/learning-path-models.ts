export type LearningPathLevel='beginner'|'intermediate'|'advanced';
export type LearningPathGoal='ssc_preparation'|'school_learning'|'general_knowledge'|'curiosity_mode'|'fast_revision';
export type LearningPathProgress='not_started'|'partial'|'completed'|'skipped'|'needs_revision';
export interface LearningPathStep{id:string;pathId:string;nodeId:string;kind:'learn'|'revision';state:LearningPathProgress;locked:boolean;prerequisiteNodeIds:string[];reason:string;order:number}
export interface LearningPath{id:string;studentId:string;targetNodeId:string;goal:LearningPathGoal;level:LearningPathLevel;variant:string;steps:LearningPathStep[];providerUsed:false}
