export type VerificationState = 'pending' | 'verified' | 'manual_testing_required';
export type ApprovalStage = 'creator_review' | 'validation' | 'approval' | 'archive_ready' | 'publish_ready';
export interface BuildArtifactPlan { id:string; buildId:string; version:string; buildDate:string; buildType:string; validationStatus:string; archiveReadiness:string; fileCreated:false; deploymentEnabled:false }
export interface ArchivePlan { id:string; included:string[]; estimatedBytes:number; lastVerification:string|null; archiveReadiness:string; zipCreated:false; backupCreated:false }
export interface RestoreVerification { id:string; status:string; checks:Record<string,boolean>; missingResources:string[]; restoreExecuted:false }
export interface LocalPlanningTruth { localOnly:true; cloudConnected:false; publishingEnabled:false; deploymentExecuted:false }
