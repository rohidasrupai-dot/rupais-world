export type MotivationContext='mistake'|'quiz_failed'|'partially_correct'|'returning'|'difficult_lesson_completed'|'basic_question'|'correct_answer'|'curiosity'|'persistence'|'revision_completed';
export type MotivationAudience='beginner'|'developing'|'advanced'|'curious';
export interface MotivationSupport{ id:string;studentId:string;context:MotivationContext;audience:MotivationAudience;message:string;habitSuggestion:string|null;optional:true;evidenceIds:string[];inferredEmotion:false;providerUsed:false;createdAt:string }
export interface LearningStreak{ current:number;longest:number;activeDays:string[];pressureFree:true;timezone:'local' }
export interface MotivationMilestone{ id:string;studentId:string;type:'three_lessons'|'seven_lessons'|'thirty_lessons'|'chapter_completed'|'subject_completed'|'first_correct_answer'|'difficult_quiz_passed'|'revision_completed';evidenceIds:string[];celebratedAt:string;animation:'gentle_confetti'|'none' }
