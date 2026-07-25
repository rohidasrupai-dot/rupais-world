export type AccountStatus = 'pending_verification'|'active'|'suspended'|'deactivated'|'deletion_pending'|'deleted';
export type AccountRole = 'student'|'creator'|'teacher'|'parent'|'admin'|'super_admin'|'guest';
export type AuthPermission =
  |'lesson.read'|'lesson.create'|'lesson.edit'|'lesson.approve'|'lesson.publish'
  |'quiz.take'|'quiz.review'|'progress.read.own'|'progress.read.linked'
  |'profile.edit.own'|'studio.access'|'users.manage'|'roles.manage'|'system.configure';

export interface UserAccount {
  id:string; providerId:string; email:string; emailVerified:boolean; emailVerificationStatus:string;
  status:AccountStatus; primaryRole:AccountRole; createdAt:string; updatedAt:string;
  lastSignInAt:string|null; lastActiveAt:string|null; termsAcceptanceVersion:string|null;
  privacyAcceptanceVersion:string|null; deletionRequestedAt:string|null; deactivatedAt:string|null;
}
export interface UserProfile {
  id:string; userId:string; displayName:string; profileImageReference?:string|null;
  preferredLanguage:string; timeZone:string; countryRegion:string; ageGroup:'child'|'teen'|'adult'|'unknown';
  educationLevel:string; learningGoal:string; accessibilityPreferences:Record<string,boolean>;
  themePreference:string; onboardingStatus:string; profileCompletionStatus:string;
  createdAt:string; updatedAt:string;
}
export interface UserRoleAssignment { id:string; userId:string; role:AccountRole; status:'active'|'revoked'; assignedBy:string; createdAt:string; revokedAt?:string; }
export interface AuthSession { id:string; userId:string; provider:string; status:'active'|'expired'|'revoked'; createdAt:string; lastActivityAt:string; expiresAt:string; endedAt:string|null; deviceLabel:string; }
export interface AccountInvitation { id:string; email:string; intendedRole:AccountRole; invitedBy:string; createdAt:string; expiresAt:string; acceptedAt:string|null; revokedAt:string|null; status:string; }
export interface AccountRelationship { id:string; requesterId:string; targetId:string; type:string; status:'pending'|'active'|'rejected'|'revoked'|'expired'; permissions:AuthPermission[]; createdAt:string; approvedAt:string|null; revokedAt:string|null; }
export interface ConsentRecord { id:string; userId:string; type:string; version:string; granted:boolean; createdAt:string; }
export interface AccountDeletionRequest { id:string; userId:string; status:string; requestedAt:string; cancellationAvailable:boolean; scope:'local_device_only'|'server'; }
export interface AccountMigration { id:string; userId:string; action:string; status:string; counts:Record<string,number>; changed?:number; createdAt:string; completedAt?:string; }
export interface SecurityAuditEvent { id:string; actorId:string|null; targetId:string|null; action:string; result:string; metadata:Record<string,string>; createdAt:string; }
export interface AuthProviderConfiguration { mode:string; provider:string; configured:boolean; }
export interface AuthProvider {
  signUp(input:unknown):Promise<unknown>; signIn(input:unknown):Promise<unknown>; signOut(allDevices?:boolean):void;
  restoreSession():unknown; refreshSession():unknown; requestPasswordReset(input?:unknown):unknown;
  verifyEmail(input?:unknown):unknown; resendVerification(input?:unknown):unknown;
  readCurrentUser():unknown; readAuthenticationState():unknown; changePassword(current:string,next:string):Promise<boolean>;
}
