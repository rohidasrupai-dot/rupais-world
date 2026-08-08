export type ReleaseState='draft'|'ready_for_release'|'archived';
export type MatrixState='tested'|'pending';
export interface ManagedRelease{id:string;version:string;buildNumber:number;state:ReleaseState;notes:string;publishingExecuted:false;deploymentExecuted:false}
export interface DeploymentStep{name:'creator'|'validation'|'build'|'review'|'approval'|'publish_placeholder';state:'planned'|'requires_evidence'|'placeholder';canExecute:boolean}
export interface TestMatrixRow{id:string;target:string;state:MatrixState;notes:string;checks?:Record<string,boolean>}
export interface BackupPlan{estimatedBytes:number;included:string[];archiveCreated:false;cloudBackup:false}
