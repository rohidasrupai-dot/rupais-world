const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { webcrypto } = require('crypto');

class Storage {
  constructor() { this.data = {}; }
  getItem(key) { return this.data[key] ?? null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

const localStorage = new Storage();
const window = { localStorage, crypto: webcrypto, dispatchEvent() {}, addEventListener() {} };
const context = vm.createContext({
  window, localStorage, crypto: webcrypto, structuredClone, TextEncoder, TextDecoder,
  URL, URLSearchParams, console, setTimeout, clearTimeout, CustomEvent: function () {}
});

for (const file of ['studio/store.js', 'studio/ai-provider-service.js', 'studio/video-intelligence-service.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const Store = window.TeachCurioStore;
const AI = window.RupaiAI;
const Video = window.TeachCurioVideoIntelligence;
const actor = {
  userId: 'creator_video',
  permissions: ['video.request.create', 'video.request.edit', 'video.review']
};

function seed() {
  const state = Store.read();
  state.projects.push({ id: 'project_video', title: 'Water Cycle', subject: 'Science' });
  state.visualAssets.push({
    id: 'visual_video', originProjectId: 'project_video', title: 'Water Cycle Diagram',
    assetType: 'diagram', reviewStatus: 'approved'
  });
  state.educationalVisuals.push({
    id: 'map_video', projectId: 'project_video', title: 'Rainfall Map',
    category: 'map', reviewStatus: 'approved'
  });
  state.sourceMaterials.push({
    id: 'source_video', projectId: 'project_video', title: 'Teacher notes'
  });
  Store.write(state);
}

seed();
assert.equal(Video.providerStatus().message, 'AI video generation is not configured.');
assert.throws(
  () => Video.createRequest({ projectId: 'project_video', videoType: 'timeline', learningObjective: 'Explain rainfall.', estimatedDurationSeconds: 90 }, { userId: 'viewer', permissions: [] }),
  /Permission required/
);

const request = Video.createRequest({
  projectId: 'project_video',
  topic: 'Water Cycle',
  subtopic: 'Stages',
  videoType: 'educational_animation',
  learningObjective: 'Learners will explain the four stages of the water cycle.',
  audience: 'Class 6',
  estimatedDurationSeconds: 90,
  pacing: 'steady',
  narrationStyle: 'warm_teacher',
  visualStyle: 'Clear classroom animation',
  language: 'english_hinglish',
  subtitles: true,
  backgroundMusicPreference: 'none'
}, actor);

assert.equal(request.sceneCount, 0);
assert.equal(request.providerExecutionEnabled, false);
assert.equal(request.providerMessage, 'AI video generation is not configured.');
assert.throws(() => Video.updateRequest(request.id, { estimatedDurationSeconds: 4 }, actor), /between 15 seconds/);

const intro = Video.addScene(request.id, {
  title: 'Introduction',
  narration: 'Water keeps moving around Earth in a repeating cycle.',
  visualDescription: 'Show a labelled water cycle diagram.',
  learningObjective: 'Recognise the full cycle.',
  estimatedDurationSeconds: 30,
  transition: 'fade'
}, actor);
const evaporation = Video.addScene(request.id, {
  title: 'Evaporation',
  narration: 'Sunlight heats water and changes it into water vapour.',
  visualDescription: 'Animate arrows rising from a lake.',
  learningObjective: 'Explain evaporation.',
  estimatedDurationSeconds: 30,
  transition: 'cut'
}, actor);
const incomplete = Video.addScene(request.id, {
  title: 'Quick recap',
  narration: '',
  visualDescription: '',
  estimatedDurationSeconds: 30
}, actor);

let validation = Video.validate(request.id);
assert.equal(validation.blocking, 2);
assert.ok(validation.issues.some(issue => issue.code === 'missing_narration' && issue.sceneId === incomplete.id));
assert.ok(validation.issues.some(issue => issue.code === 'missing_visual' && issue.sceneId === incomplete.id));
assert.ok(validation.issues.some(issue => issue.code === 'missing_assets'));
assert.ok(validation.issues.some(issue => issue.message === 'AI video generation is not configured.'));

const assets = Video.assetCatalog('project_video');
assert.deepEqual([...new Set(assets.map(asset => asset.kind))].sort(), ['diagram', 'map', 'uploaded_file']);
const link = Video.linkAsset(intro.id, { assetId: 'visual_video' }, actor);
assert.equal(link.assetId, 'visual_video');
assert.equal(Video.linkAsset(intro.id, { assetId: 'visual_video' }, actor).id, link.id);

let order = Video.moveScene(incomplete.id, 'up', actor);
assert.deepEqual(order.map(scene => scene.id), [intro.id, incomplete.id, evaporation.id]);
order = Video.moveScene(incomplete.id, 'up', actor);
assert.deepEqual(order.map(scene => scene.id), [incomplete.id, intro.id, evaporation.id]);

Video.updateScene(incomplete.id, {
  narration: 'Evaporation, condensation, precipitation and collection repeat.',
  visualDescription: 'Show the four stages together with captions.'
}, actor);
validation = Video.validate(request.id);
assert.equal(validation.blocking, 0);
const review = Video.review(request.id, actor);
assert.equal(review.status, 'planning_complete');
assert.equal(Video.get(request.id).request.status, 'ready_for_provider');

const unavailable = Video.prepareProviderRequest(request.id, actor);
assert.equal(unavailable.state, 'provider_unavailable');
assert.equal(unavailable.message, 'AI video generation is not configured.');
assert.equal(unavailable.request, null);
assert.equal(unavailable.executed, false);

AI.configureProvider('openai', {
  configured: true,
  status: 'active',
  availability: 'available',
  supportedFeatures: ['video_generation'],
  credentialReference: 'server:test-video',
  serverEndpoint: '/api/test-video'
});
AI.registerModel({
  id: 'test-video-planner',
  name: 'Test Video Planner',
  providerId: 'openai',
  status: 'available',
  capabilities: ['video_generation']
});
const prepared = Video.prepareProviderRequest(request.id, actor);
assert.equal(prepared.state, 'prepared_not_executed');
assert.equal(prepared.executed, false);
assert.ok(prepared.request);
assert.ok(prepared.request.context.storyboard.length === 3);
assert.equal(prepared.request.context.planningFoundation, true);

assert.equal(Video.removeScene(intro.id, actor), true);
const afterRemoval = Video.get(request.id);
assert.equal(afterRemoval.links.length, 0);
assert.deepEqual(afterRemoval.scenes.map(scene => scene.order), [0, 1]);

const serialized = JSON.stringify(Store.read());
assert.equal(serialized.includes('videoGenerationOutputs'), false);
assert.equal(/sk-[A-Za-z0-9]{20,}/.test(serialized), false);
console.log('Video intelligence tests passed: permissions, planning metadata, honest provider status, scenes, reorder, asset references, validation, review, provider-independent preparation and no execution.');
