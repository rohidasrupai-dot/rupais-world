export type DiscoveryRecommendationType = 'continue_learning'|'review_again'|'explore_related_topic'|'try_visual_lesson'|'practice_quiz'|'watch_animation'|'read_story_version';
export interface ObservableInterest { label:string; score:number; trend:'new'|'growing'|'steady'; evidenceCount:number; explanation:string; }
export interface LearningFormatObservation { format:'story'|'visual'|'map'|'revision'|'quiz'|'text'|'animation'; count:number; firstChoiceCount:number; confidence:'insufficient'|'emerging'|'observed'; explanation:string; }
export interface DiscoveryRecommendation { id:string; studentId:string; type:DiscoveryRecommendationType; title:string; reason:string; evidenceIds:string[]; optional:true; providerUsed:false; status:'suggested'|'creator_approved'|'dismissed'; }
