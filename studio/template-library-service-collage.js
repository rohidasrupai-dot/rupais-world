(function () {
  const store = window.TeachCurioStore;
  const files = window.TeachCurioFileStorage;
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = prefix => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
  const EARTH_TEMPLATE_ID = 'earth-beginnings-v1';
  const CURIOSITY_TEMPLATE_ID = 'curiosity-polaroid-v1';
  const EARTH_COLLAGE_TEMPLATE_ID = 'earth-collage-v1';
  const EARTH_SLOT_SCHEMA = [
    { key:'chapterLabel', label:'Chapter Label', type:'text', default:'CHAPTER 01' },
    { key:'mainTitle', label:'Main Title', type:'text', default:'How Our Earth Began' },
    { key:'introText', label:'Intro Text', type:'text', default:'Long ago, before Earth looked the way it does today, our planet had a completely different beginning.' },
    { key:'mainText', label:'Main Text', type:'text', default:'It all began with tiny particles of dust and gas floating in space. Slowly, gravity started pulling these particles closer together...' },
    { key:'highlightText', label:'Highlight Text', type:'text', default:'These particles collided again and again, forming larger bodies.' },
    { key:'youngEarthText', label:'Young Earth Text', type:'text', default:'Young Earth was extremely hot. Its surface was filled with molten rock and violent volcanoes.' },
    { key:'conclusionText', label:'Final Young Earth Text', type:'text', default:'Eventually, one of those bodies became our young Earth.' },
    { key:'curiosityTitle', label:'Curiosity Box Title', type:'text', default:'Curiosity Box' },
    { key:'curiosityContent', label:'Curiosity Box Content', type:'text', default:'Earth is about 4.54 billion years old! That’s more than 454 crore years!' },
    { key:'bottomNote', label:'Bottom Note', type:'text', default:'This is just the beginning of an incredible journey...' },
    { key:'galaxyImage', label:'Galaxy Image', type:'image', default:'reference' },
    { key:'cosmicDustImage', label:'Cosmic Dust Image', type:'image', default:'reference' },
    { key:'youngEarthImage', label:'Young Earth Image', type:'image', default:'reference' },
    { key:'volcanoImage', label:'Volcano Image', type:'image', default:'reference' }
  ];
  const CURIOSITY_SLOT_SCHEMA = [
    { key:'mainTitle', label:'Main Title', type:'richtext', default:'' },
    { key:'mainContent', label:'Main Text', type:'richtext', default:'' },
    { key:'curiosityContent', label:'Curiosity Box Content', type:'richtext', default:'' },
    { key:'polaroidImage', label:'Polaroid Photo', type:'image', default:'reference' }
  ];
  const EARTH_COLLAGE_SLOT_SCHEMA = [
    { key:'chapterLabel', label:'Chapter Label', type:'richtext', default:'CHAPTER 01' },
    { key:'mainTitle', label:'Main Heading / Title', type:'richtext', default:'' },
    { key:'introText', label:'Lesson Text · Upper Left', type:'richtext', default:'' },
    { key:'mainText', label:'Lesson Text · Centre', type:'richtext', default:'' },
    { key:'conclusionText', label:'Lesson Text · Lower Centre', type:'richtext', default:'' },
    { key:'highlightText', label:'Highlight / Key Point', type:'richtext', default:'' },
    { key:'curiosityContent', label:'Curiosity Box Content', type:'richtext', default:'' },
    { key:'bottomNote', label:'Bottom Short Note', type:'richtext', default:'' },
    { key:'photoLeft', label:'Left Rectangular Photo', type:'image', default:'reference' },
    { key:'photoTop', label:'Top Rectangular Photo', type:'image', default:'reference' },
    { key:'photoBottomRight', label:'Bottom-right Rectangular Photo', type:'image', default:'reference' },
    { key:'photoCircle', label:'Circular Photo', type:'image', default:'reference' }
  ];

  function ensureCuriosityPolaroidTemplate() {
    const snapshot = store.read(); snapshot.pageTemplates ||= [];
    let template = snapshot.pageTemplates.find(item => item.id === 'curiosity-polaroid-master-v1');
    if (!template) {
      const now = new Date().toISOString();
      template = {
        id:'curiosity-polaroid-master-v1', name:'Curiosity Garden · Polaroid Page', category:'Paragraph',
        style:'Botanical Storybook', type:'Light', dimension:'2D', size:'1230 × 1536',
        slots:CURIOSITY_SLOT_SCHEMA.map(slot => slot.label), slotSchema:clone(CURIOSITY_SLOT_SCHEMA),
        notes:'Protected uploaded artwork with invisible rich-text and Polaroid photo zones.',
        favorite:false, status:'saved', createdAt:now, updatedAt:now, createdBy:'creator',
        previewAssetId:'static:../assets/curiosity-polaroid-master-v1.png',
        referencePreviewAssetId:'static:../assets/curiosity-polaroid-master-v1.png', previewMimeType:'image/png',
        previewName:'curiosity-polaroid-master-v1.png', codedTemplateId:CURIOSITY_TEMPLATE_ID,
        codedTemplateVersion:1, visualMode:'invisible-zones'
      };
      snapshot.pageTemplates.unshift(template); store.write(snapshot);
    }
    return clone(template);
  }
  function ensureEarthCollageTemplate() {
    const snapshot = store.read(); snapshot.pageTemplates ||= [];
    let template = snapshot.pageTemplates.find(item => item.id === 'earth-collage-master-v1');
    if (!template) {
      const now = new Date().toISOString();
      template = {
        id:'earth-collage-master-v1', name:'Earth Story · Multi-Photo Lesson Page', category:'Paragraph',
        style:'Cosmic Botanical Storybook', type:'Light', dimension:'2D', size:'1536 × 1221',
        slots:EARTH_COLLAGE_SLOT_SCHEMA.map(slot => slot.label), slotSchema:clone(EARTH_COLLAGE_SLOT_SCHEMA),
        notes:'Protected uploaded artwork with invisible rich-text zones and four independent photo replacements.',
        favorite:false, status:'saved', createdAt:now, updatedAt:now, createdBy:'creator',
        previewAssetId:'static:../assets/earth-collage-master-v1.png',
        referencePreviewAssetId:'static:../assets/earth-collage-master-v1.png', previewMimeType:'image/png',
        previewName:'earth-collage-master-v1.png', codedTemplateId:EARTH_COLLAGE_TEMPLATE_ID,
        codedTemplateVersion:1, visualMode:'invisible-zones'
      };
      snapshot.pageTemplates.unshift(template); store.write(snapshot);
    }
    return clone(template);
  }

  function activateEarthCodedTemplate() {
    const snapshot = store.read(); let masters = snapshot.pageTemplates.filter(item => !item.deletedAt);
    if (!masters.length) {
      const recoverable = (snapshot.templatePageInstances || []).find(page => page.templateSnapshot?.id && page.previewAssetId && !page.deletedAt);
      if (recoverable) {
        const restored = clone(recoverable.templateSnapshot); restored.deletedAt = null; restored.previewAssetId ||= recoverable.previewAssetId;
        restored.referencePreviewAssetId ||= restored.previewAssetId; snapshot.pageTemplates.push(restored); masters = [restored]; store.write(snapshot);
      }
    }
    const target = masters.find(item => item.codedTemplateId === EARTH_TEMPLATE_ID)
      || masters.find(item => /how\s+our\s+earth\s+began/i.test(item.name || ''));
    if (!target || (target.codedTemplateId === EARTH_TEMPLATE_ID && target.codedTemplateVersion >= 2)) return target ? clone(target) : null;
    const previousSchema = clone(target.slotSchema || []), previousDefaults = Object.fromEntries(previousSchema.map(slot => [slot.key, slot.default]));
    target.codedTemplateId = EARTH_TEMPLATE_ID; target.codedTemplateVersion = 2; target.visualMode = 'reference-overlay';
    target.slotSchema = clone(EARTH_SLOT_SCHEMA); target.slots = EARTH_SLOT_SCHEMA.map(slot => slot.label);
    target.referencePreviewAssetId = target.previewAssetId; target.updatedAt = new Date().toISOString();
    (snapshot.templatePageInstances || []).filter(page => page.templateId === target.id && !page.deletedAt).forEach(page => {
      page.codedTemplateId = EARTH_TEMPLATE_ID; page.codedTemplateVersion = 2; page.visualMode = 'reference-overlay'; page.templateSnapshot = clone(target);
      const existingContent = page.content || {}, existingImages = page.images || {};
      page.content = Object.fromEntries(EARTH_SLOT_SCHEMA.filter(slot => slot.type === 'text').map(slot => [slot.key, existingContent[slot.key] === previousDefaults[slot.key] || existingContent[slot.key] == null ? slot.default : existingContent[slot.key]]));
      page.images = Object.fromEntries(EARTH_SLOT_SCHEMA.filter(slot => slot.type === 'image').map(slot => [slot.key, !existingImages[slot.key] || existingImages[slot.key] === previousDefaults[slot.key] || /^\.\.\/assets\/earth-storybook-/.test(existingImages[slot.key]) ? 'reference' : existingImages[slot.key]]));
      page.updatedAt = new Date().toISOString();
    });
    store.write(snapshot); return clone(target);
  }

  function list() {
    return store.read().pageTemplates.filter(item => !item.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async function create(input, previewFile) {
    if (!previewFile) throw new Error('Choose a preview image for this template.');
    const snapshot = store.read();
    const now = new Date().toISOString();
    const template = {
      id: id('template'), name: String(input.name || '').trim(), category: input.category,
      style: String(input.style || '').trim() || 'Custom', type: input.type, dimension: input.dimension,
      size: String(input.size || '').trim() || 'Original', slots: (input.slots || []).filter(Boolean),
      notes: String(input.notes || '').trim(), favorite: false, status: 'saved', createdAt: now,
      updatedAt: now, createdBy: input.createdBy || 'legacy-owner', previewAssetId: id('template_asset'),
      previewMimeType: previewFile.type, previewName: previewFile.name
    };
    await files.save(template.previewAssetId, previewFile);
    snapshot.pageTemplates.unshift(template);
    try { store.write(snapshot); } catch (error) { await files.remove(template.previewAssetId); throw error; }
    return clone(template);
  }
  function toggleFavorite(templateId) {
    const snapshot = store.read();
    const template = snapshot.pageTemplates.find(item => item.id === templateId && !item.deletedAt);
    if (!template) throw new Error('Template not found.');
    template.favorite = !template.favorite; template.updatedAt = new Date().toISOString(); store.write(snapshot);
    return clone(template);
  }
  function placementOptions() {
    const snapshot = store.read();
    const projects = snapshot.projects.filter(item => !item.deletedAt && item.status !== 'archived');
    const subjects = [...new Set([...(window.RupaiSubjectCatalog || []).map(item => item.name), ...projects.map(item => item.subject || 'Unsorted')])];
    return {
      subjects,
      chapters: projects.map(project => ({ id: project.id, subject: project.subject || 'Unsorted', name: project.title })),
      pages: (snapshot.templatePageInstances || []).filter(item => !item.deletedAt).map(page => ({ id: page.id, subject: page.subject, chapterName: page.chapterName, name: page.title }))
    };
  }
  function createChapterCopy(templateId, placement, createdBy) {
    const snapshot = store.read();
    const master = snapshot.pageTemplates.find(item => item.id === templateId && !item.deletedAt);
    if (!master) throw new Error('Template not found.');
    const subject = String(placement.subject || '').trim(), chapterName = String(placement.chapterName || '').trim();
    if (!subject || !chapterName) throw new Error('Confirm both Subject and Chapter.');
    const now = new Date().toISOString();
    snapshot.templatePageInstances ||= [];
    const chapterId = snapshot.projects.find(item => !item.deletedAt && (item.subject || 'Unsorted') === subject && item.title.toLowerCase() === chapterName.toLowerCase())?.id || `chapter_${[subject,chapterName].join('_').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}`;
    const siblings = snapshot.templatePageInstances.filter(item => item.subject === subject && item.chapterName.toLowerCase() === chapterName.toLowerCase() && !item.deletedAt);
    const existing = placement.mode === 'existing' && placement.pageId
      ? snapshot.templatePageInstances.find(item => item.id === placement.pageId && item.subject === subject && item.chapterName.toLowerCase() === chapterName.toLowerCase() && !item.deletedAt)
      : null;
    if (placement.mode === 'existing' && !existing) throw new Error('Choose an existing page for this subject and chapter.');
    const schema = master.slotSchema || [];
    const instance = {
      id: id('template_page'), subject, chapterId, chapterName,
      templateId: master.id, templateSnapshot: clone(master), previewAssetId: master.previewAssetId,
      title: String(placement.title || `Page ${String(siblings.length + 1).padStart(2, '0')}`).trim(),
      codedTemplateId: master.codedTemplateId || null, codedTemplateVersion: master.codedTemplateVersion || 0,
      content: schema.length ? Object.fromEntries(schema.filter(slot => slot.type === 'text' || slot.type === 'richtext').map(slot => [slot.key, slot.default || ''])) : Object.fromEntries((master.slots || []).map(slot => [slot, ''])),
      images: Object.fromEntries(schema.filter(slot => slot.type === 'image').map(slot => [slot.key, slot.default || ''])), status: 'draft', editable: true,
      createdBy: createdBy || 'legacy-owner', createdAt: now, updatedAt: now
    };
    if (existing) {
      instance.id = existing.id; instance.title = existing.title; instance.createdAt = existing.createdAt;
      instance.content = { ...instance.content, ...(existing.content || {}) }; instance.images = { ...instance.images, ...(existing.images || {}) };
      snapshot.templatePageInstances[snapshot.templatePageInstances.indexOf(existing)] = instance;
    } else snapshot.templatePageInstances.push(instance);
    store.write(snapshot); return clone(instance);
  }
  function page(pageId) { return clone((store.read().templatePageInstances || []).find(item => item.id === pageId && !item.deletedAt) || null); }
  function updatePage(pageId, changes) {
    const snapshot = store.read(), page = (snapshot.templatePageInstances || []).find(item => item.id === pageId && !item.deletedAt);
    if (!page) throw new Error('Chapter page not found.');
    if (changes.title !== undefined) page.title = String(changes.title).trim() || page.title;
    if (changes.content) page.content = { ...page.content, ...clone(changes.content) };
    if (changes.images) page.images = { ...page.images, ...clone(changes.images) };
    page.updatedAt = new Date().toISOString(); store.write(snapshot); return clone(page);
  }
  async function replacePageImage(pageId, slotKey, file) {
    const snapshot = store.read(), page = (snapshot.templatePageInstances || []).find(item => item.id === pageId && !item.deletedAt);
    if (!page) throw new Error('Chapter page not found.');
    const slot = page.templateSnapshot?.slotSchema?.find(item => item.key === slotKey && item.type === 'image');
    if (!slot) throw new Error('Image slot not found.');
    const assetId = id('page_image'); await files.save(assetId, file); page.images ||= {}; page.images[slotKey] = `asset:${assetId}`;
    page.updatedAt = new Date().toISOString(); store.write(snapshot); return clone(page);
  }
  async function getAsset(assetId) {
    if (String(assetId || '').startsWith('static:')) return fetch(String(assetId).slice(7)).then(response => { if (!response.ok) throw new Error('Template artwork could not be loaded.'); return response.blob(); });
    return files.get(assetId);
  }
  activateEarthCodedTemplate(); ensureCuriosityPolaroidTemplate(); ensureEarthCollageTemplate();
  window.RupaiTemplateLibrary = { list, create, toggleFavorite, placementOptions, createChapterCopy, page, updatePage, replacePageImage, getPreview:getAsset, getAsset };
})();
