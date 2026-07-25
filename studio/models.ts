export type UserRole = "creator" | "admin" | "student";

export type StudioProjectStatus =
  | "material_uploaded"
  | "analysing"
  | "structure_ready"
  | "generating"
  | "draft"
  | "needs_review"
  | "needs_verification"
  | "user_approved"
  | "published"
  | "archived";

export type VerificationStatus =
  | "from_my_notes"
  | "curio_simplified"
  | "curio_suggested"
  | "needs_verification"
  | "user_approved"
  | "published";

export type StructureNodeType = "subject" | "chapter" | "topic" | "subtopic" | "concept" | "activity" | "quizPlaceholder";
export type StructureOrigin = "from_my_notes" | "curio_simplified" | "curio_suggested" | "creator_added";

export interface SourceReference {
  sourceId: string;
  excerpt?: string;
  locator?: string;
}

export interface StructureNode {
  id: string;
  parentId?: string;
  projectId: string;
  nodeType: StructureNodeType;
  title: string;
  originalTitle?: string;
  description?: string;
  creatorNotes?: string;
  sortOrder: number;
  depth: number;
  status: "draft" | "accepted" | "rejected" | "needs_verification";
  confidence?: number;
  sourceReferences: SourceReference[];
  origin: StructureOrigin;
  verificationStatus: VerificationStatus | "rejected";
  includeInNextPhase: boolean;
  sscRelevance?: string;
  difficulty?: "easy" | "medium" | "hard";
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedMetadata {
  id: string;
  projectId: string;
  type: string;
  value: string;
  relatedNodeId?: string;
  sourceReferences: SourceReference[];
  confidence?: number;
  verificationStatus: VerificationStatus | "rejected";
  creatorNotes?: string;
}

export interface AnalysisWarning {
  id: string;
  projectId: string;
  kind: "warning" | "conflict" | "missing_information" | "invalid_response";
  message: string;
  blocking: boolean;
  sourceIds: string[];
  status: "open" | "resolved" | "ignored" | "later";
}

export interface StructureVersion {
  id: string;
  projectId: string;
  version: number;
  kind: "ai_proposal" | "draft" | "approved" | "restored";
  nodes: StructureNode[];
  metadata: ExtractedMetadata[];
  createdAt: string;
  createdBy: string;
}

export interface LessonStructure {
  id: string;
  projectId: string;
  nodes: StructureNode[];
  metadata: ExtractedMetadata[];
  warnings: AnalysisWarning[];
  suggestions: AnalysisWarning[];
  versions: StructureVersion[];
  approvalStatus: "draft" | "approved";
  approvedVersionId?: string;
  updatedAt: string;
}

export type WritingStatus = "draft" | "curio_suggested" | "creator_added" | "from_my_notes" | "needs_verification" | "user_edited" | "user_approved" | "rejected" | "published";

export interface LessonParagraph {
  id: string;
  structureNodeId: string;
  variants: LanguageVariant[];
  sourceReferences: SourceReference[];
  origin: "curio_suggested" | "creator" | "creator_added" | "from_my_notes";
  status: WritingStatus;
  creatorEdited: boolean;
  updatedAt: string;
}

export interface DefinitionBlock {
  id: string;
  structureNodeId: string;
  definition: LanguageVariant[];
  meaning: LanguageVariant[];
  keyIdea: LanguageVariant[];
  explanation: LanguageVariant[];
  sourceReferences: SourceReference[];
  status: WritingStatus;
}

export interface LessonDraftSection {
  id: string;
  lessonDraftId: string;
  structureNodeId: string;
  title: string;
  sectionType?: "explanation" | "definition";
  languageMode?: "english" | "hinglish" | "dual";
  origin?: "curio_suggested" | "creator_added" | "from_my_notes";
  includeInLesson?: boolean;
  paragraph: LessonParagraph;
  definition?: DefinitionBlock;
  creatorNotes?: string;
  status: WritingStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface WritingVersion {
  id: string;
  lessonDraftId: string;
  version: number;
  kind: "ai_draft" | "manual_draft" | "creator_edit" | "regenerated_section" | "approved" | "rejected" | "restored";
  sections: LessonDraftSection[];
  createdAt: string;
  createdBy: string;
}

export interface LessonDraft {
  id: string;
  projectId: string;
  approvedStructureVersionId: string;
  sections: LessonDraftSection[];
  versions: WritingVersion[];
  languagePreference: "english" | "hinglish" | "dual";
  writingStyle: "clear_beginner_friendly";
  status: "draft" | "needs_review" | "approved" | "rejected";
  approvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptLanguage = "english" | "hinglish" | "dual";
export type PromptObjective = "generate_lesson" | "generate_explanation" | "rewrite_explanation" | "improve_clarity" | "regenerate_concept" | "generate_important_points" | "generate_quick_summary" | "generate_memory_tricks" | "generate_real_life_examples" | "generate_ssc_connection" | "generate_common_mistakes" | "generate_fun_facts" | "regenerate_fun_fact" | "generate_revision_notes" | "regenerate_revision_block" | "generate_quiz" | string;

export interface PromptTemplate {
  id: string;
  subject: string;
  version: number;
  extends: "base";
  role?: string;
  writingStyle?: string;
  restrictions: string[];
  formattingRules: string[];
}

export interface StudioPrompt {
  schemaVersion: 1;
  promptId: string;
  templateId: string;
  templateVersion: number;
  role: string;
  objective: PromptObjective;
  audience: string;
  difficulty: string;
  language: PromptLanguage;
  outputMode: string;
  writingStyle: string;
  approvedStructure: { versionId: string; nodes: StructureNode[]; concepts: StructureNode[] };
  approvedMetadata: ExtractedMetadata[];
  approvedLessonDraft?: { draftId: string; approvedVersionId: string; sections: LessonDraftSection[] };
  definitions: string[];
  creatorNotes: string;
  sourceReferences: string[];
  restrictions: string[];
  formattingRules: string[];
  verificationRules: Record<string, string | boolean>;
  generationSettings: { maximumLength: number; paragraphStyle: string; headingStyle: string; bulletPreference: string; tone: string };
  futureExtensions: Record<string, unknown>;
  createdAt: string;
}

export interface PromptRun {
  id: string;
  projectId: string;
  prompt: StudioPrompt;
  capability: "generateLessonDraft" | "generateImportantPoints" | "generateQuickSummary" | "generateMemoryTricks" | "generateRealLifeExamples" | "generateSSCConnection" | "generateCommonMistakes" | "generateFunFacts" | "regenerateFunFact" | "generateRevisionNotes" | "regenerateRevisionBlock" | "generateQuiz";
  status: "previewed" | "sent" | "failed" | "completed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export type LearningBlockType = "important_points" | "quick_summary" | "memory_tricks" | "real_life_examples" | "ssc_connection" | "common_mistakes" | "fun_facts" | "revision_notes";

export interface StructuredLearningItem {
  id: string;
  itemType: string;
  title: string;
  english: string;
  hinglish: string;
  languageMode?: PromptLanguage;
  relatedStructureNodeId?: string;
  sourceReferences: SourceReference[];
  origin: "curio_suggested" | "creator_added" | "from_my_notes";
  verificationStatus: WritingStatus | "from_my_notes" | "creator_added";
  creatorNotes: string;
  sortOrder: number;
  creatorEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningBlockVersion {
  id: string;
  version: number;
  kind: "ai_generation" | "creator_edit" | "approved" | "restored";
  english: string[];
  hinglish: string[];
  creatorNotes: string;
  items?: StructuredLearningItem[];
  createdAt: string;
  createdBy: string;
}

export type QuizQuestionType = "mcq" | "multiple_correct" | "true_false" | "fill_blank" | "match_following" | "arrange_order" | "image_based" | "map_based" | "timeline" | "assertion_reason" | "very_short" | "long_answer";
export type QuizMode = "practice" | "exam" | "revision" | "challenge";
export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export interface Quiz {
  id: string;
  projectId: string;
  lessonDraftId: string;
  lessonDraftVersionId: string;
  title: string;
  mode: QuizMode;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  status: "draft" | "needs_review" | "user_approved";
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  projectId: string;
  lessonDraftId: string;
  type: QuizQuestionType;
  prompt: string;
  correctText?: string;
  explanation: string;
  wrongAnswerExplanation: string;
  hint: string;
  memoryTrick: string;
  referenceSectionId?: string;
  imageUrl?: string;
  mapConfig?: Record<string, unknown>;
  timelineConfig?: Record<string, unknown>;
  answerConfig?: Record<string, unknown>;
  difficulty: "easy" | "medium" | "hard";
  bloomLevel: BloomLevel;
  marks: number;
  negativeMarks: number;
  timeLimitSeconds: number;
  difficultyWeight: number;
  tags: string[];
  origin: "curio_suggested" | "creator_added" | "hybrid";
  status: "draft" | "needs_verification" | "user_approved" | "rejected";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface QuizOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  sortOrder: number;
}

export interface QuizVersion {
  id: string;
  quizId: string;
  version: number;
  kind: "created" | "question_edit" | "question_deleted" | "reordered" | "ai_generation" | "restored";
  quiz: Quiz;
  questions: QuizQuestion[];
  options: QuizOption[];
  createdAt: string;
  createdBy: string;
}

export interface LearningBlock {
  id: string;
  projectId: string;
  lessonDraftId: string;
  lessonDraftVersionId: string;
  type: LearningBlockType;
  english: string[];
  hinglish: string[];
  creatorNotes: string;
  relatedStructureNodeIds?: string[];
  sourceReferences?: SourceReference[];
  status: WritingStatus;
  versions: LearningBlockVersion[];
  approvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningEnhancement {
  id: string;
  projectId: string;
  lessonDraftId: string;
  blocks: LearningBlock[];
  languagePreference: PromptLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface SourceMaterial {
  id: string;
  projectId: string;
  kind: "text" | "pdf" | "docx" | "image" | "audio" | "map" | "diagram" | "existing_note";
  title: string;
  originalName: string;
  mimeType?: string;
  fileSize?: number;
  textContent?: string;
  sourceName?: string;
  creatorNotes?: string;
  languageHint?: string;
  subjectHint?: string;
  chapterHint?: string;
  primary: boolean;
  includeInAnalysis: boolean;
  order: number;
  uploadStatus: "stored" | "metadata_only" | "failed";
  processingStatus: AnalysisProcessingStatus;
  createdAt: string;
  updatedAt: string;
  originalMetadata: Record<string, string | number | boolean | undefined>;
}

export type AnalysisProcessingStatus =
  | "queued"
  | "reading"
  | "understanding"
  | "organising"
  | "finding_topics"
  | "extracting_information"
  | "building_lesson_structure"
  | "complete"
  | "failed"
  | "provider_unavailable"
  | "cancelled"
  | "not_started";

export interface LanguageVariant {
  id: string;
  blockId: string;
  language: "english" | "hinglish";
  content: string;
}

export interface ContentBlock {
  id: string;
  sectionId: string;
  type: string;
  order: number;
  variants: LanguageVariant[];
  sourceMaterialIds: string[];
  originalTextReference?: string;
  verificationStatus: VerificationStatus;
  creatorApproved: boolean;
  version: number;
  updatedAt: string;
}

export interface LessonSection {
  id: string;
  lessonId: string;
  type: string;
  title: string;
  enabled: boolean;
  order: number;
  status: StudioProjectStatus;
  blocks: ContentBlock[];
}

export interface LessonVersion {
  id: string;
  lessonId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  note?: string;
  sections: LessonSection[];
}

export interface Lesson {
  id: string;
  projectId: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  status: StudioProjectStatus;
  currentVersionId?: string;
  versions: LessonVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudioProject {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  chapterHint?: string;
  creatorNotes?: string;
  status: StudioProjectStatus;
  sourceMaterialIds: string[];
  lessonId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type QuizAttemptStatus = 'not_started'|'in_progress'|'paused'|'submitted'|'auto_graded'|'awaiting_manual_review'|'fully_reviewed'|'abandoned';
export interface QuizAttempt {
  id: string; studentId: string; quizId: string; quizVersionId: string; lessonId: string; projectId: string;
  quizMode: QuizMode; status: QuizAttemptStatus; currentQuestionPosition: number; marksObtained: number;
  maximumMarks: number; negativeMarks: number; accuracy: number; timeSpentSeconds: number;
  completionPercentage: number; attemptNumber: number; submissionState: 'local_draft'|'confirmed';
  reviewState: 'not_required'|'pending'|'final'; questionSnapshot: QuizQuestion[]; optionSnapshot: QuizOption[];
  startTime: string; endTime?: string|null; timerEndsAt?: string|null; finalSubmissionAt?: string;
  createdAt: string; updatedAt: string;
}
export interface AttemptAnswer { id:string; attemptId:string; questionId:string; response:string|string[]; createdAt:string; updatedAt:string; }
export interface GradingResult { id:string; attemptId:string; questionId:string; status:string; marksAwarded:number; maximumMarks:number; correct:boolean; partialCredit:boolean; gradedBy:string; gradedAt:string; }
export interface ManualReview { id:string; attemptId:string; questionId:string; studentResponse:string|string[]; maximumMarks:number; creatorAwardedMarks?:number|null; creatorFeedback:string; status:'awaiting_review'|'in_review'|'reviewed'|'returned_for_recheck'; createdAt:string; updatedAt:string; }
export interface TopicPerformance { id:string; attemptId:string; studentId:string; kind:string; name:string; attempted:number; correct:number; accuracy:number; averageMarks:number; averageTimeSeconds:number; createdAt:string; }
export interface AssessmentInsight { id:string; studentId:string; projectId?:string; attemptId?:string; type?:string; level?:string; status?:string; evidence?:unknown; createdAt?:string; updatedAt?:string; }
export type VisualAssetType = 'illustration'|'diagram'|'infographic'|'historical_art'|'modern_photograph'|'scientific_illustration'|'character_image'|'object_image'|'landmark'|'monument'|'animal'|'plant'|'person'|'artifact'|'screenshot'|'symbol'|'icon'|'miscellaneous';
export interface VisualAsset { id:string; originProjectId:string; lessonId:string; subject:string; chapter:string; assetType:VisualAssetType; title:string; description:string; caption:string; altText:string; source:string; copyrightStatus:string; creatorNotes:string; keywords:string[]; tags:string[]; currentVersion:number; currentBlobId:string; fingerprint:string; mimeType:string; fileName:string; fileSize:number; reviewStatus:string; origin:'manual_upload'|'ai_generated'; uploadDate:string; createdAt:string; updatedAt:string; }
export interface VisualAssetVersion { id:string; assetId:string; version:number; blobId:string; fingerprint:string; fileName:string; fileSize:number; mimeType:string; kind:'uploaded'|'replaced'|'restored'; createdAt:string; createdBy:string; }
export interface VisualAssetReference { id:string; assetId:string; projectId:string; lessonId:string; placementType:'lesson'|'section'|'paragraph'|'important_point'|'memory_trick'|'quiz'|'revision'|'common_mistake'|'ssc_connection'; targetId:string; role:'hero'|'supporting'|'comparison'|'before'|'after'|'step'|'gallery'; sortOrder:number; createdAt:string; updatedAt:string; deletedAt?:string; }
export interface VisualGenerationRequest { id:string; projectId:string; lessonId:string; sourceReferences:unknown[]; visualType:string; educationalPurpose:string; promptFields:Record<string,string>; compiledPrompt:string; negativePrompt:string; styleProfileId?:string|null; characterProfileIds:string[]; outputSettings:Record<string,unknown>; accuracyLevel:string; jobStatus:string; workflowStage:string; priority:string; reviewStatus:string; approvalStatus:string; generationCount:number; parentRequestId?:string|null; createdAt:string; updatedAt:string; }
export interface VisualPromptVersion { id:string; requestId:string; version:number; structuredPrompt:Record<string,string>; compiledPrompt:string; negativePrompt:string; changedBy:string; changeSummary:string; parentVersionId?:string|null; status:string; createdAt:string; }
export interface VisualGenerationOutput { id:string; requestId:string; promptVersionId:string; blobId:string; sourceType:string; sourceName:string; license:string; commercialUseStatus:string; status:string; assetId?:string; createdAt:string; updatedAt:string; }
export interface EducationalVisual { id:string; projectId:string; lessonId:string; category:'map'|'timeline'|'diagram'|'flowchart'|'mind_map'|'comparison_chart'|'process_visual'; visualType:string; title:string; description:string; altText:string; subject:string; chapter:string; historicalPeriod:string; region:string; source:string; scale:string; orientation:string; labels:string[]; legend:string; tags:string[]; placementType:string; targetId:string; reviewStatus:string; approvalStatus:string; version:number; assetId?:string; createdAt:string; updatedAt:string; }
export interface EducationalVisualItem { id:string; visualId:string; kind:string; title:string; date:string; approximateDate:boolean; start:string; end:string; description:string; references:string[]; parentId?:string|null; leftValue:string; rightValue:string; sortOrder:number; }
export interface VisualObjectLayout { x:number; y:number; width:number; height:number; rotation:number; locked:boolean; hidden:boolean; zIndex:number; groupId?:string|null; lockPosition?:boolean; }
export interface VisualObjectGroup { id:string; visualId:string; name:string; itemIds:string[]; collapsed:boolean; locked:boolean; hidden:boolean; createdAt:string; updatedAt:string; }
export interface VisualWorksheet { id:string; visualId:string; lessonId:string; projectId:string; title:string; instructions:string; language:string; quizId?:string|null; version:number; status:string; createdBy:string; createdAt:string; updatedAt:string; }
export interface VisualWorksheetItem { id:string; worksheetId:string; visualId:string; type:string; prompt:string; answer:string; hint:string; marks:number; quizQuestionId?:string|null; objectIds:string[]; sortOrder:number; }
export interface VisualPrintPlan { id:string; visualId:string; projectId:string; preset:string; pageWidth:number; pageHeight:number; pageCount:number; breakMode:string; manualBreaks:number[]; keepTogetherIds:string[]; repeatHeaders:boolean; repeatLegends:boolean; }
export interface VisualPackage { id:string; projectId:string; type:string; version:number; theme:string; language:string; visualVersions:{id:string;version:number}[]; lessonVersion?:number|null; manifest:Record<string,unknown>; createdBy:string; createdAt:string; }
export interface EducationalVisualLink { id:string; visualId:string; fromId:string; toId:string; label:string; kind:string; }
export interface VisualRenderConfiguration { id:string; visualId:string; mode:string; themeId:string; layout:string; canvasWidth:number; canvasHeight:number; orientation:string; zoom:number; panX:number; panY:number; gridVisible:boolean; snapToGrid:boolean; safeMargins:boolean; languageMode:string; printPreset:string; exportSettings:Record<string,unknown>; updatedAt:string; }
export interface VisualOverlay { id:string; visualId:string; overlayType:string; content:{english:string;hinglish?:string}; x:number;y:number;width:number;height:number;alignment:string;fontRole:string;sizeRole:string;visible:boolean;accessibilityLabel:string;connectedElementId?:string|null;version:number; }
export interface MapMarker { id:string; visualId:string; layerId?:string|null; name:string; latitude?:number|null; longitude?:number|null; x:number;y:number;positionType:'geographic'|'schematic';markerType:string;description:string;source:string;accuracyStatus:string;visible:boolean; }
export interface VisualActivityAttempt { id:string; activityId:string; visualId:string; studentId:string; studentResponse:string; correctResponse:string; marks:number; maximumMarks:number; timeSpentSeconds:number; completionState:string; reviewState:string; createdAt:string; }

export interface StudioSnapshot {
  schemaVersion: 1;
  projects: StudioProject[];
  sourceMaterials: SourceMaterial[];
  lessons: Lesson[];
  lessonStructures: LessonStructure[];
  lessonDrafts: LessonDraft[];
  learningEnhancements: LearningEnhancement[];
  promptRuns: PromptRun[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  quizOptions: QuizOption[];
  quizVersions: QuizVersion[];
  quizAttempts: QuizAttempt[];
  attemptAnswers: AttemptAnswer[];
  attemptQuestionStates: unknown[];
  gradingResults: GradingResult[];
  manualReviews: ManualReview[];
  topicPerformances: TopicPerformance[];
  questionStatistics: unknown[];
  studentMasteries: AssessmentInsight[];
  weakTopics: AssessmentInsight[];
  revisionRecommendations: AssessmentInsight[];
  progressEvents: AssessmentInsight[];
  adaptiveSelectionLogs: unknown[];
  assessmentAuditLogs: unknown[];
  visualAssets: VisualAsset[];
  visualAssetVersions: VisualAssetVersion[];
  visualAssetReferences: VisualAssetReference[];
  visualGenerationRequests: VisualGenerationRequest[];
  visualPromptVersions: VisualPromptVersion[];
  visualGenerationJobs: unknown[];
  visualGenerationOutputs: VisualGenerationOutput[];
  visualReviews: unknown[];
  visualStyleProfiles: unknown[];
  characterConsistencyProfiles: unknown[];
  visualPlanItems: unknown[];
  visualProvenanceRecords: unknown[];
  educationalVisuals: EducationalVisual[];
  educationalVisualVersions: unknown[];
  educationalVisualItems: EducationalVisualItem[];
  educationalVisualLinks: EducationalVisualLink[];
  educationalVisualReviews: unknown[];
  visualRenderConfigurations: VisualRenderConfiguration[];
  visualThemes: unknown[];
  visualOverlays: VisualOverlay[];
  visualLanguageVariants: unknown[];
  mapLayers: unknown[];
  mapMarkers: MapMarker[];
  mapPaths: unknown[];
  timelineTracks: unknown[];
  visualActivities: unknown[];
  visualActivityAttempts: VisualActivityAttempt[];
  visualExportJobs: unknown[];
  visualLayoutVersions: unknown[];
  visualObjectGroups: VisualObjectGroup[];
  visualAuthoringHistory: unknown[];
  visualWorksheets: VisualWorksheet[];
  visualWorksheetItems: VisualWorksheetItem[];
  visualPrintPlans: VisualPrintPlan[];
  visualPackages: VisualPackage[];
  visualPublishingChecklists: unknown[];
  visualThumbnailCache: unknown[];
  curioBrainRuns: unknown[];
  curioBrainSnapshots: unknown[];
  curioDecisions: unknown[];
  curioDecisionEvidence: unknown[];
  curioTeachingPlans: unknown[];
  curioTeachingSteps: unknown[];
  curioCoverageMatrices: unknown[];
  curioReadinessAssessments: unknown[];
  curioTasks: unknown[];
  curioRules: unknown[];
  curioRulePacks: unknown[];
  curioRuleVersions: unknown[];
  curioCreatorResponses: unknown[];
  curioLearningProfiles: unknown[];
  curioConflicts: unknown[];
  curioProviderConfigurations: unknown[];
  curioLearningSessions: unknown[];
  curioSessionStepStates: unknown[];
  curioRuntimeEvents: unknown[];
  curioRuntimeLogs: unknown[];
  curioRuntimeSuggestions: unknown[];
  studentLearningProfiles: unknown[];
  adaptiveDecisions: unknown[];
  adaptiveMasteryEvidence: unknown[];
  adaptiveRevisionPlans: unknown[];
  studentKnowledgeProfiles: unknown[];
  conceptMemories: unknown[];
  knowledgeGraphs: unknown[];
  knowledgeRelationships: unknown[];
  revisionSchedules: unknown[];
  longTermRevisionPlans: unknown[];
  memoryEvents: unknown[];
  studyGoals: unknown[];
  learningTimeline: unknown[];
  knowledgeDecayRecords: unknown[];
  memoryReminders: unknown[];
  analysisJobs: Array<{
    id: string;
    projectId: string;
    stage: AnalysisProcessingStatus;
    sourceIds: string[];
    error?: string;
    updatedAt: string;
  }>;
}
