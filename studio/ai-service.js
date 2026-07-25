(function () {
  class StudioAiUnavailableError extends Error {
    constructor(capability) {
      super(`${capability} is unavailable because no AI provider is connected.`);
      this.name = 'StudioAiUnavailableError';
      this.retryable = true;
    }
  }
  class MockStudioAiProvider {
    constructor() { this.id = 'mock'; this.connected = false; }
    async run(capability) { throw new StudioAiUnavailableError(capability); }
    analyseMaterial(input) { return this.run('analyseMaterial', input); }
    extractLessonStructure(input) { return this.run('extractLessonStructure', input); }
    generateLessonDraft(input) { return this.run('generateLessonDraft', input); }
    generateImportantPoints(input) { return this.run('generateImportantPoints', input); }
    generateQuickSummary(input) { return this.run('generateQuickSummary', input); }
    generateMemoryTricks(input) { return this.run('generateMemoryTricks', input); }
    generateRealLifeExamples(input) { return this.run('generateRealLifeExamples', input); }
    generateSSCConnection(input) { return this.run('generateSSCConnection', input); }
    generateCommonMistakes(input) { return this.run('generateCommonMistakes', input); }
    generateFunFacts(input) { return this.run('generateFunFacts', input); }
    regenerateFunFact(input) { return this.run('regenerateFunFact', input); }
    generateRevisionNotes(input) { return this.run('generateRevisionNotes', input); }
    regenerateRevisionBlock(input) { return this.run('regenerateRevisionBlock', input); }
    generateLessonSection(input) { return this.run('generateLessonSection', input); }
    generateLanguageVariant(input) { return this.run('generateLanguageVariant', input); }
    generateVisualSuggestions(input) { return this.run('generateVisualSuggestions', input); }
    generateTimeline(input) { return this.run('generateTimeline', input); }
    generateMapSuggestions(input) { return this.run('generateMapSuggestions', input); }
    generateStoryboard(input) { return this.run('generateStoryboard', input); }
    generateVoiceScript(input) { return this.run('generateVoiceScript', input); }
    generateQuiz(input) { return this.run('generateQuiz', input); }
    generateSmartSuggestions(input) { return this.run('generateSmartSuggestions', input); }
    verifyConsistency(input) { return this.run('verifyConsistency', input); }
  }
  window.TeachCurioAI = {
    provider: new MockStudioAiProvider(),
    setProvider(provider) {
      if (!provider || typeof provider.analyseMaterial !== 'function') throw new Error('Invalid Studio AI provider.');
      this.provider = provider;
    },
    async execute(capability, prompt) {
      if (!prompt || prompt.schemaVersion !== 1 || !prompt.promptId) throw new Error('A valid provider-neutral prompt is required.');
      const method = this.provider?.[capability];
      if (typeof method !== 'function') throw new StudioAiUnavailableError(capability);
      const providerRequest = typeof this.provider.toProviderRequest === 'function' ? this.provider.toProviderRequest(capability, prompt) : prompt;
      return method.call(this.provider, providerRequest);
    },
    validateStructureOutput(value) {
      const types = new Set(['subject','chapter','topic','subtopic','concept','activity','quizPlaceholder']);
      const allowed = { root:['subject'], subject:['chapter','topic'], chapter:['topic','concept'], topic:['subtopic','concept','activity','quizPlaceholder'], subtopic:['concept','activity','quizPlaceholder'], concept:['activity','quizPlaceholder'], activity:[], quizPlaceholder:[] };
      if (!value || typeof value !== 'object' || !Array.isArray(value.nodes)) throw new Error('AI response did not contain a structure node list.');
      const ids = new Set();
      value.nodes.forEach((node, index) => {
        if (!node || typeof node.id !== 'string' || ids.has(node.id)) throw new Error(`Invalid or duplicate node ID at item ${index + 1}.`);
        if (!types.has(node.nodeType) || typeof node.title !== 'string' || !node.title.trim()) throw new Error(`Invalid structure node at item ${index + 1}.`);
        ids.add(node.id);
      });
      const byId = new Map(value.nodes.map(node => [node.id, node]));
      value.nodes.forEach((node, index) => {
        const parent = node.parentId ? byId.get(node.parentId) : null;
        if (node.parentId && !parent) throw new Error(`Missing parent reference at item ${index + 1}.`);
        if (!(allowed[parent?.nodeType || 'root'] || []).includes(node.nodeType)) throw new Error(`Invalid hierarchy at item ${index + 1}.`);
      });
      return value;
    },
    validateLessonDraftOutput(value, approvedConceptIds) {
      if (!value || typeof value !== 'object' || !Array.isArray(value.sections) || !value.sections.length) throw new Error('AI response did not contain lesson sections.');
      const allowed = new Set(approvedConceptIds);
      const seen = new Set();
      value.sections.forEach((section, index) => {
        if (!section || typeof section.structureNodeId !== 'string' || !allowed.has(section.structureNodeId) || seen.has(section.structureNodeId)) throw new Error(`Invalid lesson section reference at item ${index + 1}.`);
        if (typeof section.english !== 'string' || !section.english.trim() || typeof section.hinglish !== 'string' || !section.hinglish.trim()) throw new Error(`Missing English or Hinglish explanation at item ${index + 1}.`);
        const definition = section.definition || {};
        ['definition','meaning','keyIdea','explanation'].forEach(field => {
          if (definition[field] && (typeof definition[field].english !== 'string' || typeof definition[field].hinglish !== 'string')) throw new Error(`Invalid ${field} block at item ${index + 1}.`);
        });
        seen.add(section.structureNodeId);
      });
      if (seen.size !== allowed.size) throw new Error('AI response did not include every approved Concept.');
      return value;
    },
    validateLearningBlockOutput(value, type) {
      if (!value || typeof value !== 'object') throw new Error('AI response did not contain a learning block.');
      const multiple = type !== 'quick_summary';
      const normalise = (content, language) => {
        const values = Array.isArray(content) ? content : typeof content === 'string' ? [content] : [];
        if (!values.length || values.some(item => typeof item !== 'string' || !item.trim())) throw new Error(`Missing ${language} ${multiple ? 'Important Points' : 'Quick Summary'}.`);
        if (!multiple && values.length !== 1) throw new Error(`${language} Quick Summary must be one natural summary.`);
        return values.map(item => item.trim());
      };
      return { english: normalise(value.english, 'English'), hinglish: normalise(value.hinglish, 'Hinglish'), needsVerification: Boolean(value.needsVerification) };
    },
    validateStructuredLearningOutput(value, type, approvedNodeIds) {
      if (!value || typeof value !== 'object') throw new Error('AI response did not contain a structured learning section.');
      const key = type === 'fun_facts' ? 'facts' : 'blocks', values = value[key];
      if (type === 'fun_facts' && value.noSuitableSupportedFacts === true && Array.isArray(values) && values.length === 0) return { items: [], noSuitableSupportedFacts: true, warnings: value.warnings || [] };
      if (!Array.isArray(values) || !values.length) throw new Error(`${type === 'fun_facts' ? 'Fun Facts' : 'Revision Notes'} response is empty.`);
      const ids = new Set(), allowed = new Set(approvedNodeIds || []);
      const items = values.map((item, index) => {
        if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error(`Invalid or duplicate item ID at item ${index + 1}.`);
        if (typeof item.title !== 'string' || !item.title.trim() || typeof item.english !== 'string' || !item.english.trim() || typeof item.hinglish !== 'string' || !item.hinglish.trim()) throw new Error(`Missing title or language variant at item ${index + 1}.`);
        if (item.relatedStructureNodeId && !allowed.has(item.relatedStructureNodeId)) throw new Error(`Unapproved structure reference at item ${index + 1}.`);
        if (item.sourceReferences && (!Array.isArray(item.sourceReferences) || item.sourceReferences.some(ref => !ref || typeof ref.sourceId !== 'string'))) throw new Error(`Invalid source references at item ${index + 1}.`);
        ids.add(item.id);
        return { id:item.id,title:item.title.trim(),english:item.english.trim(),hinglish:item.hinglish.trim(),itemType:String(item.itemType || (type === 'fun_facts' ? 'fun_fact' : 'core_concept')),relatedStructureNodeId:item.relatedStructureNodeId,sourceReferences:item.sourceReferences || [],needsVerification:Boolean(item.needsVerification),verificationReason:String(item.verificationReason || '') };
      });
      return { items, noSuitableSupportedFacts:false, warnings:Array.isArray(value.warnings) ? value.warnings : [] };
    },
    validateQuizOutput(value) {
      if (!value || !Array.isArray(value.questions) || !value.questions.length) throw new Error('AI response did not contain quiz questions.');
      const ids = new Set();
      value.questions.forEach((question,index)=>{
        if (!question || typeof question.id !== 'string' || !question.id.trim() || ids.has(question.id)) throw new Error(`Invalid or duplicate question ID at item ${index+1}.`);
        if (typeof question.prompt !== 'string' || !question.prompt.trim() || typeof question.type !== 'string') throw new Error(`Invalid question at item ${index+1}.`);
        if (!Array.isArray(question.options)) question.options=[];
        ids.add(question.id);
      });
      return value;
    },
    StudioAiUnavailableError
  };
})();
