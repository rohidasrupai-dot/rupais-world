(function () {
  const MAX_BYTES = 25 * 1024 * 1024;
  const accepted = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
    'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio'
  };
  function classify(file) {
    if (accepted[file.type]) return accepted[file.type];
    const ext = file.name.split('.').pop().toLowerCase();
    return ({ pdf:'pdf', docx:'docx', jpg:'image', jpeg:'image', png:'image', webp:'image', gif:'image', mp3:'audio', wav:'audio', ogg:'audio', m4a:'audio' })[ext] || null;
  }
  function validate(file, existing = []) {
    const kind = classify(file);
    if (!kind) return { ok:false, error:`${file.name}: unsupported file type.` };
    if (file.size > MAX_BYTES) return { ok:false, error:`${file.name}: file is larger than 25 MB.` };
    const duplicate = existing.some(item => item.originalName === file.name && item.fileSize === file.size && item.originalMetadata?.lastModified === file.lastModified);
    if (duplicate) return { ok:false, error:`${file.name}: this file is already in the project.` };
    return { ok:true, kind };
  }
  window.TeachCurioFileValidation = { validate, MAX_BYTES };
})();

