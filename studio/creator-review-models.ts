export type ReviewState='ready'|'needs_review'|'missing'|'incomplete'|'blocked';
export type ContentHealth='excellent'|'good'|'needs_improvement'|'incomplete';
export type ReviewCategory='content'|'reference'|'diagram'|'quiz'|'revision'|'prerequisite'|'duplicate'|'metadata'|'copyright'|'accessibility';
export interface CreatorReviewFinding{id:string;projectId:string;category:ReviewCategory;severity:'info'|'warning'|'error'|'blocker';state:ReviewState;title:string;reason:string;affectedIds:string[];creatorReviewRequired:boolean}
export interface PublishChecklist{lessonComplete:boolean;imagesReviewed:boolean;sourcesChecked:boolean;quizVerified:boolean;revisionVerified:boolean;accessibilityChecked:boolean;copyrightReviewed:boolean;updatedBy:string;updatedAt:string}
export interface ReviewPreview{projectId:string;device:'desktop'|'tablet'|'mobile';label:'Preview — Not Published';actualLocalContent:boolean;published:boolean}
