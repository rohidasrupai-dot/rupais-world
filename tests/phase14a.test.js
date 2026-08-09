const fs=require('fs'),vm=require('vm'),assert=require('assert');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert.equal(manifest.name,"Rupai's World");assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./index.html');assert(manifest.icons.some(x=>x.sizes==='192x192'));assert(manifest.icons.some(x=>x.sizes==='512x512'));assert(manifest.icons.some(x=>x.purpose==='maskable'));
['assets/pwa-icon-192.png','assets/pwa-icon-512.png','assets/pwa-icon-maskable-512.png','offline.html','pwa-client.js','pwa-client.css','service-worker.js'].forEach(x=>assert(fs.existsSync(x),`Missing ${x}`));
const sw=fs.readFileSync('service-worker.js','utf8'),client=fs.readFileSync('pwa-client.js','utf8');
assert.match(sw,/CACHE_VERSION/);assert.match(sw,/caches\.open/);assert.match(sw,/request\.mode === 'navigate'/);assert.match(sw,/SKIP_WAITING/);assert(!/localStorage|indexedDB|headers\.set\(['"]authorization|password\s*[:=]/i.test(sw));
assert.match(client,/navigator\.onLine/);assert.match(client,/beforeinstallprompt/);assert.match(client,/controllerchange/);assert.match(client,/Update when ready/);
['index.html','subjects.html','student-reader.html','student-dashboard.html','student-learning-coach.html','student-memory-dashboard.html','student-progress-dashboard.html','student-study-planner.html','student-settings.html','revision.html'].forEach(file=>{const html=fs.readFileSync(file,'utf8');assert.match(html,/manifest\.webmanifest/);assert.match(html,/pwa-client\.css/);assert.match(html,/pwa-client\.js/)});
console.log('Phase 14A tests passed: manifest metadata/icons, offline shell, scoped service-worker caching, connectivity state, optional install prompt and user-controlled updates.');
