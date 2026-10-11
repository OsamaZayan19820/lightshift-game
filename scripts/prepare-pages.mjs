import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();
const dist=join(root,'dist');
rmSync(dist,{recursive:true,force:true});
mkdirSync(dist,{recursive:true});
for(const file of ['index.html','styles.css','game.js','engine.mjs','manifest.webmanifest','sw.js','.nojekyll']){
  if(!existsSync(join(root,file)))throw new Error(`Missing app asset: ${file}`);
  copyFileSync(join(root,file),join(dist,file));
}
cpSync(join(root,'icons'),join(dist,'icons'),{recursive:true});
console.log('GitHub Pages bundle ready: dist/ (static game files only)');
