(async function () {
  if (!window.__studioSession) return;
  const api = window.RupaiTemplateLibrary, pageId = new URLSearchParams(location.search).get('page');
  let page = api.page(pageId), activeRichKey = 'mainTitle';
  if (!page) { location.replace('template-library.html'); return; }
  const $ = selector => document.querySelector(selector), esc = value => { const node = document.createElement('div'); node.textContent = value ?? ''; return node.innerHTML; }, urls = [];
  const isCuriosity = page.codedTemplateId === 'curiosity-polaroid-v1';
  const isEarthCollage = page.codedTemplateId === 'earth-collage-v1';
  const isRichTemplate = isCuriosity || isEarthCollage;
  $('#pagePath').textContent = `${page.subject}  ›  ${page.chapterName}`; $('#pageTitle').value = page.title;
  const referenceBlob = await api.getPreview(page.previewAssetId); let referenceUrl = '';
  if (referenceBlob) { referenceUrl = URL.createObjectURL(referenceBlob); urls.push(referenceUrl); $('#referencePreview').src = referenceUrl; }
  const schema = page.templateSnapshot?.slotSchema || [], defaults = Object.fromEntries(schema.map(slot => [slot.key, slot.default]));
  const changed = key => (page.content?.[key] ?? '') !== defaults[key];
  const isOriginalImage = value => !value || value === 'reference' || /^\.\.\/assets\/earth-storybook-/.test(value);
  const safeRich = value => String(value || '');

  function earthMarkup() {
    const textSlots = schema.filter(slot => slot.type === 'text').map(slot => `<div class="reference-slot ${slot.key} ${changed(slot.key) ? 'changed' : ''}" data-text-slot="${slot.key}">${esc(page.content?.[slot.key] || '')}</div>`).join('');
    const imageSlots = schema.filter(slot => slot.type === 'image').map(slot => `<img class="reference-replacement ${slot.key}" data-image-slot="${slot.key}" alt="${esc(slot.label)}" ${isOriginalImage(page.images?.[slot.key]) ? 'hidden' : ''}>`).join('');
    return `<article class="reference-edit-page"><img class="reference-artwork" src="${referenceUrl}" alt="Original How Our Earth Began design">${textSlots}${imageSlots}</article>`;
  }
  function curiosityMarkup() {
    const rich = key => safeRich(page.content?.[key]);
    return `<article class="curiosity-edit-page"><img class="reference-artwork" src="${referenceUrl}" alt="Protected Curiosity Garden template artwork"><div class="invisible-edit-zone mainTitle" contenteditable="true" data-rich-slot="mainTitle" aria-label="Main Title">${rich('mainTitle')}</div><div class="invisible-edit-zone mainContent" contenteditable="true" data-rich-slot="mainContent" aria-label="Main Text">${rich('mainContent')}</div><div class="invisible-edit-zone curiosityContent" contenteditable="true" data-rich-slot="curiosityContent" aria-label="Curiosity Box Content">${rich('curiosityContent')}</div><img class="polaroid-photo-replacement" data-image-slot="polaroidImage" alt="Polaroid photo" ${isOriginalImage(page.images?.polaroidImage) ? 'hidden' : ''}></article>`;
  }
  function earthCollageMarkup() {
    const zone = key => `<div class="invisible-edit-zone ${key} ${changed(key) ? 'changed' : ''}" contenteditable="true" data-rich-slot="${key}" aria-label="${esc(schema.find(slot => slot.key === key)?.label || key)}">${key === 'chapterLabel' && !changed(key) ? '' : safeRich(page.content?.[key])}</div>`;
    const image = key => `<img class="collage-photo-replacement ${key}" data-image-slot="${key}" alt="${esc(schema.find(slot => slot.key === key)?.label || key)}" ${isOriginalImage(page.images?.[key]) ? 'hidden' : ''}>`;
    return `<article class="earth-collage-edit-page"><img class="reference-artwork" src="${referenceUrl}" alt="Protected Earth Story multi-photo template artwork">${['chapterLabel','mainTitle','introText','mainText','conclusionText','highlightText','curiosityContent','bottomNote'].map(zone).join('')}${['photoLeft','photoTop','photoBottomRight','photoCircle'].map(image).join('')}</article>`;
  }
  async function assetUrl(value) {
    if (!value || value === 'reference') return referenceUrl;
    if (value.startsWith('asset:')) { const blob = await api.getAsset(value.slice(6)); if (blob) { const url = URL.createObjectURL(blob); urls.push(url); return url; } }
    return value;
  }
  async function renderCanvas() {
    $('#codedCanvas').innerHTML = isEarthCollage ? earthCollageMarkup() : isCuriosity ? curiosityMarkup() : earthMarkup();
    const wrap = $('#codedCanvas article'); if (wrap) wrap.style.containerType = 'inline-size';
    for (const image of document.querySelectorAll('[data-image-slot]:not([hidden])')) image.src = await assetUrl(page.images?.[image.dataset.imageSlot]);
    if (isRichTemplate) selectZone(activeRichKey, false);
  }
  function richToolbar() {
    return `<div class="rich-toolbar" aria-label="Text formatting"><select data-format="fontName" title="Font"><option value="Nunito">Nunito</option><option value="Georgia">Georgia</option><option value="Kalam">Kalam</option><option value="Arial">Arial</option></select><select data-format="fontSize" title="Font size"><option value="2">Small</option><option value="3" selected>Normal</option><option value="4">Large</option><option value="5">Extra Large</option><option value="6">Heading</option></select><input type="color" data-format="foreColor" value="#243326" title="Text colour"><button type="button" data-command="bold"><b>B</b></button><button type="button" data-command="italic"><i>I</i></button><button type="button" data-command="underline"><u>U</u></button><button type="button" data-command="justifyLeft">≡</button><button type="button" data-command="justifyCenter">≡</button><button type="button" data-command="justifyRight">≡</button><button type="button" data-command="insertUnorderedList">• List</button><button type="button" data-command="insertOrderedList">1. List</button><button type="button" data-command="romanList">I. List</button></div>`;
  }
  async function renderControls() {
    const images = schema.filter(slot => slot.type === 'image');
    if (isRichTemplate) {
      const richSlots = schema.filter(slot => slot.type === 'richtext');
      $('#contentForm').innerHTML = `${richToolbar()}<p class="rich-help">Choose an area, then type directly on the page. Formatting applies to the selected text.</p><div class="zone-picker">${richSlots.map(slot => `<button type="button" data-zone="${slot.key}">${esc(slot.label)}</button>`).join('')}</div>${images.map(slot => `<div class="slot-control image-slot-control"><img data-control-image="${slot.key}" alt="${esc(slot.label)}"><div><strong>${esc(slot.label)}</strong><span class="using-original">${isOriginalImage(page.images?.[slot.key]) ? 'Using original artwork' : 'Page-specific replacement'}</span><br><label class="replace-image">Replace Image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-input="${slot.key}"></label></div></div>`).join('')}`;
    } else {
      const text = schema.filter(slot => slot.type === 'text');
      $('#contentForm').innerHTML = [...text.map(slot => `<div class="slot-control"><label>${esc(slot.label)}<textarea data-text-input="${slot.key}" placeholder="Add ${esc(slot.label)}">${esc(page.content?.[slot.key] || '')}</textarea></label></div>`), ...images.map(slot => `<div class="slot-control image-slot-control"><img data-control-image="${slot.key}" alt="${esc(slot.label)}"><div><strong>${esc(slot.label)}</strong><span class="using-original">${isOriginalImage(page.images?.[slot.key]) ? 'Using original artwork' : 'Page-specific replacement'}</span><br><label class="replace-image">Replace Image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-input="${slot.key}"></label></div></div>`)].join('');
    }
    for (const image of document.querySelectorAll('[data-control-image]')) image.src = isOriginalImage(page.images?.[image.dataset.controlImage]) ? referenceUrl : await assetUrl(page.images?.[image.dataset.controlImage]);
  }
  let timer;
  function queueSave() { clearTimeout(timer); $('#saveState').textContent = 'Saving…'; timer = setTimeout(() => { api.updatePage(pageId, { title:$('#pageTitle').value, content:page.content }); $('#saveState').textContent = 'Saved'; }, 450); }
  function selectZone(key, focus = true) { activeRichKey = key; document.querySelectorAll('[data-zone]').forEach(button => button.classList.toggle('active', button.dataset.zone === key)); if (focus) document.querySelector(`[data-rich-slot="${key}"]`)?.focus(); }
  function applyFormat(command, value) { const zone = document.querySelector(`[data-rich-slot="${activeRichKey}"]`); if (!zone) return; zone.focus(); if (command === 'romanList') { document.execCommand('insertOrderedList'); const list = zone.querySelector('ol'); if (list) list.style.listStyleType = 'upper-roman'; } else document.execCommand(command, false, value || null); page.content[activeRichKey] = zone.innerHTML; queueSave(); }

  $('#pageTitle').addEventListener('input', queueSave);
  $('#codedCanvas').addEventListener('focusin', event => { const zone = event.target.closest('[data-rich-slot]'); if (zone) selectZone(zone.dataset.richSlot, false); });
  $('#codedCanvas').addEventListener('input', event => { const zone = event.target.closest('[data-rich-slot]'); if (!zone) return; page.content[zone.dataset.richSlot] = zone.innerHTML; if (zone.dataset.richSlot === 'chapterLabel') zone.classList.toggle('changed', zone.innerText.trim() !== defaults.chapterLabel); queueSave(); });
  $('#contentForm').addEventListener('input', event => { const input = event.target.closest('[data-text-input]'); if (!input) return; const key = input.dataset.textInput; page.content[key] = input.value; const layer = document.querySelector(`[data-text-slot="${CSS.escape(key)}"]`); layer.textContent = input.value; layer.classList.toggle('changed', changed(key)); queueSave(); });
  $('#contentForm').addEventListener('click', event => { const zone = event.target.closest('[data-zone]'); if (zone) selectZone(zone.dataset.zone); const command = event.target.closest('[data-command]'); if (command) applyFormat(command.dataset.command); });
  $('#contentForm').addEventListener('change', async event => {
    const format = event.target.closest('[data-format]'); if (format) { applyFormat(format.dataset.format, format.value); return; }
    const input = event.target.closest('[data-image-input]'); if (!input?.files[0]) return; $('#saveState').textContent = 'Saving image…'; page = await api.replacePageImage(pageId, input.dataset.imageInput, input.files[0]); await renderCanvas(); await renderControls(); $('#saveState').textContent = 'Saved';
  });
  $('#showCoded').addEventListener('click', () => { $('#codedCanvas').hidden = false; $('#referencePreview').hidden = true; $('#showCoded').classList.add('active'); $('#showReference').classList.remove('active'); });
  $('#showReference').addEventListener('click', () => { $('#codedCanvas').hidden = true; $('#referencePreview').hidden = false; $('#showCoded').classList.remove('active'); $('#showReference').classList.add('active'); });
  await renderCanvas(); await renderControls(); if (isRichTemplate) selectZone('mainTitle', false);
  window.addEventListener('beforeunload', () => urls.forEach(URL.revokeObjectURL));
})();
