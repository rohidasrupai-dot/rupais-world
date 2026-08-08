export type EnvironmentName='development'|'testing'|'production';
export type ReadinessState='ready'|'needs_review'|'blocked'|'not_configured'|'cannot_determine';
export interface EnvironmentRecord{id:string;name:EnvironmentName;active:boolean;deploymentConfigured:boolean;hostingConfirmed:boolean;message:string}
export interface BuildResource{path:string;type:'html'|'css'|'javascript'|'image'|'asset';exists:boolean;bytes:number;references?:string[]}
export interface ReadinessCategory{name:'architecture'|'performance'|'security'|'offline'|'accessibility'|'content'|'publishing';score:number;state:ReadinessState;reasons:string[]}
export interface ProductionReadinessReport{overallPercentage:number;productionHosted:false;deploymentClaimed:false;categories:ReadinessCategory[]}
