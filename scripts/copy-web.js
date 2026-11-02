const fs=require('fs');fs.mkdirSync('www',{recursive:true});
for(const f of ['index.html','app.js','lessons.js','problems.js','config.js','monetize.js','manifest.json','sw.js','rocco.jpg','icon-64.png','icon-180.png','icon-192.png','icon-512.png'])fs.copyFileSync(f,'www/'+f);
console.log('Copied web assets to www/');
