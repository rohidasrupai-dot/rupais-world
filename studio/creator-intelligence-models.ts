export type CreatorAnalysisType='completeness'|'structure'|'objective_coverage'|'sources'|'claims'|'duplicates'|'conflicts'|'visuals'|'quiz'|'revision'|'language'|'accessibility'|'clarity'|'difficulty';
export type FindingSeverity='info'|'low'|'medium'|'high'|'critical'|'unknown';
export type RecommendationStatus='new'|'viewed'|'accepted'|'dismissed'|'deferred'|'resolved'|'incorrect'|'not_applicable';
export interface CreatorAnalysisFinding{id:string;analysisId:string;type:CreatorAnalysisType;title:string;detail:string;severity:FindingSeverity;confidence:'high'|'medium'|'low'|'cannot_determine';affectedContentIds:string[];evidence:string[];suggestedAction:string;reviewState:string;ruleVersion:number}
export interface ProjectReadinessScore{analysisId:string;projectId:string;overall:number|null;state:string;categories:Record<string,{score:number|null;reason:string;available:boolean;weight:number}>;notQualityCertification:true}
