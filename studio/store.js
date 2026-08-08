(function () {
  const KEY = 'teachCurioStudio:v1';
  const EMPTY = Object.freeze({ schemaVersion: 1, projects: [], sourceMaterials: [], lessons: [], lessonStructures: [], lessonDrafts: [], learningEnhancements: [], promptRuns: [], quizzes: [], quizQuestions: [], quizOptions: [], quizVersions: [], quizAttempts: [], attemptAnswers: [], attemptQuestionStates: [], gradingResults: [], manualReviews: [], topicPerformances: [], questionStatistics: [], studentMasteries: [], weakTopics: [], revisionRecommendations: [], progressEvents: [], adaptiveSelectionLogs: [], assessmentAuditLogs: [], visualAssets: [], visualAssetVersions: [], visualAssetReferences: [], visualGenerationRequests: [], visualPromptVersions: [], visualGenerationJobs: [], visualGenerationOutputs: [], visualReviews: [], visualStyleProfiles: [], characterConsistencyProfiles: [], visualPlanItems: [], visualProvenanceRecords: [], educationalVisuals: [], educationalVisualVersions: [], educationalVisualItems: [], educationalVisualLinks: [], educationalVisualReviews: [], visualRenderConfigurations: [], visualThemes: [], visualOverlays: [], visualLanguageVariants: [], mapLayers: [], mapMarkers: [], mapPaths: [], timelineTracks: [], visualActivities: [], visualActivityAttempts: [], visualExportJobs: [], visualLayoutVersions: [], visualObjectGroups: [], visualAuthoringHistory: [], visualWorksheets: [], visualWorksheetItems: [], visualPrintPlans: [], visualPackages: [], visualPublishingChecklists: [], visualThumbnailCache: [], analysisJobs: [] });

  const CURIO_EMPTY = { curioBrainRuns: [], curioBrainSnapshots: [], curioDecisions: [], curioDecisionEvidence: [], curioTeachingPlans: [], curioTeachingSteps: [], curioCoverageMatrices: [], curioReadinessAssessments: [], curioTasks: [], curioRules: [], curioRulePacks: [], curioRuleVersions: [], curioCreatorResponses: [], curioLearningProfiles: [], curioConflicts: [], curioProviderConfigurations: [], curioLearningSessions: [], curioSessionStepStates: [], curioRuntimeEvents: [], curioRuntimeLogs: [], curioRuntimeSuggestions: [], curioBrainDecisions: [], curioBrainContextSnapshots: [], curioLearningNeeds: [], curioTeachingStrategies: [], curioResourceSelections: [], curioPrerequisiteChecks: [], curioMisconceptionEvidence: [], curioRemediationPlans: [], curioNextLessonRecommendations: [], curioCrossSubjectConnections: [], curioCuriositySuggestions: [], curioDecisionExplanations: [], curioDecisionOverrides: [], curioAdvancedRulePacks: [], curioAdvancedRuleVersions: [], motivationLearningEvents: [], motivationSupportEvents: [], motivationHabitSuggestions: [], motivationMilestones: [], motivationCelebrations: [], motivationSafetyEvents: [], unifiedVoiceSessions: [], unifiedVoiceTurns: [], unifiedVoiceEvents: [], unifiedVoiceRecoveries: [], unifiedVoiceContextSnapshots: [], studentLearningProfiles: [], adaptiveDecisions: [], adaptiveMasteryEvidence: [], adaptiveRevisionPlans: [], studentKnowledgeProfiles: [], conceptMemories: [], knowledgeGraphs: [], knowledgeGraphNodes: [], knowledgeRelationships: [], knowledgeGraphViews: [], knowledgeConfidenceRecords: [], knowledgeMisconceptionLinks: [], knowledgeGraphEvents: [], learningPathGoals: [], learningPaths: [], learningPathSteps: [], learningPathProgressEvents: [], learningPathRecommendations: [], curioReasoningSessions: [], curioReasoningGoals: [], curioReasoningStrategies: [], curioReasoningSteps: [], curioHintLevels: [], curioResponseEvaluations: [], curioEvidenceLinks: [], curioReasoningConclusions: [], curioReasoningTemplates: [], curioReasoningTemplateVersions: [], curioReasoningHistory: [], curioReasoningOverrides: [], curioWhatIfAnalyses: [], curioErrorAnalyses: [], revisionSchedules: [], longTermRevisionPlans: [], memoryEvents: [], studyGoals: [], learningTimeline: [], knowledgeDecayRecords: [], memoryReminders: [] };
  Object.assign(CURIO_EMPTY, { curiosityCards: [], curiosityCardVersions: [], curiosityChains: [], curiosityChainSteps: [], curiosityProgress: [], curiosityDailySelections: [], curiosityInteractions: [], curiosityInterests: [], curiosityRewards: [], curiosityWhyTrees: [], curiosityWhyNodes: [], curiosityChallenges: [], curiositySafetyEvents: [], discoveryMemorySnapshots: [], discoveryInterestTrends: [], discoveryStyleObservations: [], discoveryRecommendations: [], discoveryRecommendationReviews: [], discoveryTimelineEvents: [], discoveryDashboardViews: [], creatorIntelligenceAnalyses: [], creatorAnalysisFindings: [], creatorRecommendations: [], creatorRecommendationDecisions: [], projectReadinessScores: [], creatorClaimReviewItems: [], creatorConflictFindings: [], creatorAnalysisRulePacks: [], creatorAnalysisRuleVersions: [], creatorAnalysisHistory: [], creatorAnalysisTasks: [], creatorAnalysisCaches: [], visualStudioPlans: [], visualStudioRecommendations: [], visualStudioScenes: [], visualStudioPromptVersions: [], visualStudioDiagramPlans: [], visualStudioDiagramNodes: [], visualStudioDiagramLinks: [], visualStudioReviews: [], visualStudioExportQueue: [], visualStudioUsageHistory: [], videoLessonProjects: [], videoProjectVersions: [], videoOutlines: [], videoLessonScenes: [], videoSceneVersions: [], videoNarrations: [], videoSubtitleEntries: [], videoVoicePlans: [], videoMotionPlans: [], videoAssetRequirements: [], videoAssetLinks: [], videoTimelineTracks: [], videoReviewFindings: [], videoProductionReadiness: [], videoProductionPackages: [], videoProviderJobs: [], videoCostAuthorizations: [], videoApprovalRecords: [], videoBuilderTemplates: [], videoManualImports: [], offlinePackages: [], offlinePackageItems: [], offlineCacheEntries: [], offlineSyncQueue: [], offlineSyncHistory: [], offlineConflicts: [], offlineStorageReports: [], offlineProviderChecks: [], creatorReviewScans: [], creatorReviewFindings: [], creatorPublishChecklists: [], creatorReviewDecisions: [], creatorReviewPreviews: [], creatorReleaseSummaries: [], creatorReviewCaches: [], productionEnvironments: [], productionBuildValidations: [], productionBuildFindings: [], productionPerformanceReports: [], productionSecurityReviews: [], productionReleaseChecklists: [], productionReadinessReports: [], releaseManagerReleases: [], releaseManagerNotes: [], deploymentPlans: [], deviceTestMatrix: [], browserTestMatrix: [], backupPlans: [], disasterRecoveryPlans: [], disasterRecoverySteps: [], operationalHealthReports: [], deploymentReadinessChecklists: [] });
  Object.assign(CURIO_EMPTY, { buildArtifactPlans: [], localArchivePlans: [], restoreVerificationReports: [], serviceWorkerPlans: [], crossBrowserAutomationRecords: [], deploymentApprovalWorkflows: [], deploymentApprovalStages: [], rollbackPlans: [], monitoringArchitecturePlans: [], incidentResponsePlans: [], incidentResponseStages: [], finalProductionReadinessReports: [] });
  Object.assign(CURIO_EMPTY, { creatorDocumentationVersions: [], creatorHandoffGuides: [], operationalRunbooks: [], browserCertifications: [], deviceCertifications: [], futureRoadmaps: [], finalProjectSummaries: [], finalHandoffReadinessReports: [], finalCompletionReports: [] });
  function cloneEmpty() { return JSON.parse(JSON.stringify({ ...EMPTY, ...CURIO_EMPTY })); }
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value?.schemaVersion === 1 && Array.isArray(value.projects)) {
        return { ...cloneEmpty(), ...value };
      }
    } catch {}
    return cloneEmpty();
  }
  function write(snapshot) {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent('teach-curio:changed', { detail: snapshot }));
    return snapshot;
  }
  function id(prefix) {
    return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
  }
  function createProject(input) {
    const snapshot = read();
    const now = new Date().toISOString();
    const project = {
      id: id('project'),
      title: String(input.title || '').trim() || 'Untitled lesson',
      subject: String(input.subject || '').trim(),
      description: String(input.description || '').trim(),
      chapterHint: String(input.chapterHint || '').trim(),
      creatorNotes: String(input.creatorNotes || '').trim(),
      status: 'draft',
      sourceMaterialIds: [],
      createdBy: input.createdBy || 'legacy-owner',
      createdAt: now,
      updatedAt: now
    };
    snapshot.projects.unshift(project);
    write(snapshot);
    return project;
  }
  function getProject(projectId) {
    return read().projects.find(project => project.id === projectId && !project.deletedAt) || null;
  }
  function updateProject(projectId, changes) {
    const snapshot = read();
    const project = snapshot.projects.find(item => item.id === projectId && !item.deletedAt);
    if (!project) throw new Error('Project not found.');
    Object.assign(project, changes, { id: project.id, updatedAt: new Date().toISOString() });
    write(snapshot);
    return project;
  }
  function addSource(projectId, input) {
    const snapshot = read();
    const project = snapshot.projects.find(item => item.id === projectId && !item.deletedAt);
    if (!project) throw new Error('Project not found.');
    const now = new Date().toISOString();
    const source = {
      id: input.id || id('source'), projectId, title: input.title || input.originalName || 'Untitled material',
      originalName: input.originalName || '', kind: input.kind || 'text', mimeType: input.mimeType || '',
      fileSize: Number(input.fileSize || 0), textContent: input.textContent || '', sourceName: input.sourceName || '',
      creatorNotes: input.creatorNotes || '', languageHint: input.languageHint || '', subjectHint: input.subjectHint || '',
      chapterHint: input.chapterHint || '', primary: Boolean(input.primary), includeInAnalysis: input.includeInAnalysis !== false,
      order: snapshot.sourceMaterials.filter(item => item.projectId === projectId).length,
      uploadStatus: input.uploadStatus || 'stored', processingStatus: 'not_started',
      createdAt: now, updatedAt: now, originalMetadata: input.originalMetadata || {}
    };
    if (source.primary) snapshot.sourceMaterials.forEach(item => { if (item.projectId === projectId) item.primary = false; });
    snapshot.sourceMaterials.push(source);
    project.sourceMaterialIds.push(source.id);
    project.status = 'material_uploaded'; project.updatedAt = now;
    write(snapshot);
    return source;
  }
  function updateSource(sourceId, changes) {
    const snapshot = read();
    const source = snapshot.sourceMaterials.find(item => item.id === sourceId);
    if (!source) throw new Error('Source material not found.');
    if (changes.primary) snapshot.sourceMaterials.forEach(item => { if (item.projectId === source.projectId) item.primary = false; });
    const immutable = { id: source.id, projectId: source.projectId, originalName: source.originalName, originalMetadata: source.originalMetadata };
    Object.assign(source, changes, immutable, { updatedAt: new Date().toISOString() });
    const project = snapshot.projects.find(item => item.id === source.projectId);
    if (project) project.updatedAt = source.updatedAt;
    write(snapshot);
    return source;
  }
  function removeSource(sourceId) {
    const snapshot = read();
    const source = snapshot.sourceMaterials.find(item => item.id === sourceId);
    if (!source) return null;
    snapshot.sourceMaterials = snapshot.sourceMaterials.filter(item => item.id !== sourceId);
    const project = snapshot.projects.find(item => item.id === source.projectId);
    if (project) {
      project.sourceMaterialIds = project.sourceMaterialIds.filter(id => id !== sourceId);
      project.updatedAt = new Date().toISOString();
    }
    snapshot.sourceMaterials.filter(item => item.projectId === source.projectId).sort((a,b) => a.order-b.order).forEach((item,index) => item.order=index);
    write(snapshot);
    return source;
  }
  function reorderSource(sourceId, direction) {
    const snapshot = read();
    const source = snapshot.sourceMaterials.find(item => item.id === sourceId);
    if (!source) return;
    const siblings = snapshot.sourceMaterials.filter(item => item.projectId === source.projectId).sort((a,b) => a.order-b.order);
    const from = siblings.findIndex(item => item.id === sourceId);
    const to = Math.max(0, Math.min(siblings.length - 1, from + direction));
    if (from === to) return;
    [siblings[from], siblings[to]] = [siblings[to], siblings[from]];
    siblings.forEach((item,index) => item.order=index);
    const project = snapshot.projects.find(item => item.id === source.projectId);
    if (project) project.updatedAt = new Date().toISOString();
    write(snapshot);
  }
  function getProjectSources(projectId) {
    return read().sourceMaterials.filter(item => item.projectId === projectId).sort((a,b) => a.order-b.order);
  }
  function stats(snapshot = read()) {
    const active = snapshot.projects.filter(project => !project.deletedAt);
    const by = status => active.filter(project => project.status === status).length;
    return {
      drafts: active.filter(project => ['draft', 'material_uploaded', 'structure_ready'].includes(project.status)).length,
      verification: by('needs_verification'),
      published: by('published'),
      incomplete: active.filter(project => ['analysing', 'generating'].includes(project.status)).length,
      recentEdited: [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null,
      recentPublished: [...active].filter(p => p.status === 'published').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null
    };
  }
  window.TeachCurioStore = { read, write, createProject, getProject, updateProject, addSource, updateSource, removeSource, reorderSource, getProjectSources, stats };
})();
