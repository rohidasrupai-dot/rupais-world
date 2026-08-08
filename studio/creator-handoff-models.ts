export type CertificationStatus = 'verified' | 'pending' | 'manual_verification';
export interface CertificationRecord { id:string; target:string; status:CertificationStatus; evidence:string; updatedAt:string }
export interface FinalReadinessCategory { name:string; score:number; evidence:string }
export interface LocalHandoffTruth { localFirst:true; cloudConnected:false; hosted:false; deployed:false; publishingEnabled:false }
