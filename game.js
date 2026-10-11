import {makeLevel,connectivity,isWin,rotate,N,E,S,W} from './engine.mjs';
const $=id=>document.getElementById(id);
const SAFE_KEY='lightshift.v02.';
const read=(name,fallback)=>{try{return JSON.parse(localStorage.getItem(SAFE_KEY+name))??fallback;}catch{return fallback;}};
const store=(name,val)=>{try{localStorage.setItem(SAFE_KEY+name,JSON.stringify(val));}catch{}};
const STRINGS={
 ar:{eyebrow:'لغز واحد. مدينة تستيقظ.',title:'أعِد النور إلى المدينة',subtitle:'المس طريقًا لتدويره. أوصل الطاقة إلى كل المنازل.',level:'المستوى',moves:'الحركات',homes:'منازل مضيئة',power:'محطة الطاقة',best:'أفضل نتيجة',status:'ابدأ بإضاءة المنزل: اضغط على مسار ليدور 90°.',undo:'تراجع',hint:'تلميح',restart:'إعادة',levels:'اختر المستوى للتجربة',foot:'نسخة تجريبية · بدون إعلانات أو تسجيل أو جمع بيانات',winTitle:'أضاءت المدينة!',winDesc:'أوصلت الطاقة إلى جميع المنازل!',next:'المستوى التالي ←',replay:'أعد المحاولة',complete:'أنهيت جميع المستويات!',hintStatus:'المربع المضيء يحتاج تدويرًا. هذا تلميح لمسار حل معروف.',moveStatus:'استمر! المنازل تضيء عند اكتمال اتصالها بالمحطة.',soundOn:'إيقاف الصوت',soundOff:'تشغيل الصوت',attempts:'حركة',appLabel:'لوحة LIGHTSHIFT',tile:'قطعة',homeName:'منزل',sourceName:'محطة الطاقة',guide:'كيف ألعب؟',guideA:'اضغط على الطريق لتدويره ربع دورة. أوصل مسارًا مستمرًا من ⚡ إلى جميع المنازل ⌂.',guideB:'الأزرق المتوهج يعني أن الكهرباء وصلت. استخدم تلميحًا إذا تعثرت، أو زر التراجع لإلغاء الحركة الأخيرة.',progress:'التقدم يُحفظ على هذا الجهاز.'},
 en:{eyebrow:'One puzzle. A city awakens.',title:'Bring the city back to light',subtitle:'Tap a path to rotate it. Connect power to every home.',level:'LEVEL',moves:'MOVES',homes:'LIT HOMES',power:'Power station',best:'Personal best',status:'Connect the home: tap a path to rotate it 90°.',undo:'Undo',hint:'Hint',restart:'Restart',levels:'Choose a level to test',foot:'Prototype · No ads, accounts or personal data collection',winTitle:'The city is glowing!',winDesc:'You connected every home to the power station!',next:'Next level →',replay:'Replay level',complete:'All levels completed!',hintStatus:'The highlighted tile differs from a known solution.',moveStatus:'Keep going! Homes light up when their paths reach the station.',soundOn:'Mute sound',soundOff:'Enable sound',attempts:'moves',appLabel:'LIGHTSHIFT board',tile:'Tile',homeName:'home',sourceName:'power station',guide:'How to play',guideA:'Tap a road to rotate it 90 degrees. Connect a continuous path from ⚡ to every home ⌂.',guideB:'A glowing blue road carries power. Use Hint if stuck, or Undo to reverse the last move.',progress:'Progress is saved on this device.'}
};
let lang=read('language','ar'),level=Math.min(10,Math.max(1,read('level',1))),audioOn=read('audio',false);
let p,current,history=[],moves=0,hintIndex=-1,won=false,audioCtx=null;
function t(k){return STRINGS[lang][k];}
function sayTone(){if(!audioOn)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(440,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(660,audioCtx.currentTime+.11);g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.13);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.14);}catch{}}
function bestKey(){return `best.${level}`;}
function progressKey(){return `progress.${level}`;}
function saveProgress(){if(!won)store(progressKey(),{masks:current,moves,history});}
function savedGameIsValid(saved){return saved&&Array.isArray(saved.masks)&&saved.masks.length===25&&saved.masks.every((mask,i)=>Number.isInteger(mask)&&mask>=0&&mask<=15&&(p.active[i]||mask===0)&&(i!==p.source||mask===p.initial[i]))&&Number.isInteger(saved.moves)&&saved.moves>=0&&saved.moves<=10000&&Array.isArray(saved.history)&&saved.history.length===saved.moves&&saved.history.every(entry=>entry&&Number.isInteger(entry.index)&&entry.index>=0&&entry.index<25&&entry.index!==p.source&&p.active[entry.index]&&Number.isInteger(entry.prev)&&entry.prev>=0&&entry.prev<=15)&&!isWin(saved.masks,p.houses);}
function idealReference(){let count=0;for(let i=0;i<current.length;i++){if(i===p.source||!p.active[i])continue;let v=p.initial[i];for(let j=0;j<4;j++){if(v===p.solved[i]){count+=j;break;}v=rotate(v);}}return count;}
function starCount(){const ideal=idealReference();return moves<=ideal+2?3:moves<=ideal+7?2:1;}
function load(n,reset=false){level=n;p=makeLevel(level);current=[...p.initial];history=[];moves=0;hintIndex=-1;won=false;const saved=reset?null:read(progressKey(),null);if(savedGameIsValid(saved)){current=[...saved.masks];history=saved.history.map(x=>({...x}));moves=saved.moves;}else{store(progressKey(),null);}$('winOverlay').hidden=true;store('level',level);render();}
function updateStrings(){const dir=lang==='ar'?'rtl':'ltr';document.documentElement.lang=lang;document.documentElement.dir=dir;document.title='LIGHTSHIFT — City of Light';
 for(const [id,k] of Object.entries({eyebrow:'eyebrow',headline:'title',subtitle:'subtitle',levelLabel:'level',movesLabel:'moves',homesLabel:'homes',powerLabel:'power',undoLabel:'undo',hintLabel:'hint',restartLabel:'restart',selectLabel:'levels',footNote:'foot',guideSummary:'guide',guideFirst:'guideA',guideSecond:'guideB',progressNote:'progress',winTitle:'winTitle',winDesc:'winDesc'}))$(id).textContent=t(k);
 $('lang').textContent=lang==='ar'?'EN':'عربي';$('sound').textContent=audioOn?'♫':'♪';$('sound').setAttribute('aria-label',audioOn?t('soundOn'):t('soundOff'));
 $('next').textContent=level<10?t('next'):t('complete');$('replay').textContent=t('replay');$('board').setAttribute('aria-label',t('appLabel'));
 $('levelSelect').replaceChildren(...Array.from({length:10},(_,i)=>{let x=document.createElement('option');x.value=String(i+1);x.textContent=lang==='ar'?`المستوى ${i+1}`:`Level ${i+1}`;return x;}));
}
function buildTile(i,lit){const tile=document.createElement('button');tile.type='button';tile.className='tile';const active=p.active[i],home=p.houses.includes(i),source=i===p.source,energized=lit.has(i);if(active)tile.classList.add('active');else tile.classList.add('empty');if(home)tile.classList.add('home');if(source)tile.classList.add('source');if(energized&&active)tile.classList.add('lit');if(hintIndex===i)tile.classList.add('hint');if(!active||source||won)tile.disabled=true;
 const row=Math.floor(i/5)+1,col=i%5+1;tile.setAttribute('aria-label',`${t('tile')} ${row}, ${col}${home?', '+t('homeName'):''}${source?', '+t('sourceName'):''}`);
 const wire=document.createElement('span');wire.className='wire';for(const [bit,name] of [[N,'n'],[E,'e'],[S,'s'],[W,'w']])if(current[i]&bit){const seg=document.createElement('span');seg.className=`segment ${name}`;wire.append(seg);}if(active){const node=document.createElement('span');node.className='node';wire.append(node);}tile.append(wire);
 if(source||home){const badge=document.createElement('span');badge.className='badgecell';badge.textContent=source?'⚡':(energized?'🏠':'⌂');tile.append(badge);}
 if(active&&!source&&!won)tile.addEventListener('click',()=>step(i));return tile;
}
function render(statusOverride){updateStrings();const lit=connectivity(current);const n=p.houses.filter(x=>lit.has(x)).length;const board=$('board');board.replaceChildren(...current.map((_,i)=>buildTile(i,lit)));
 $('levelNum').textContent=`${String(level).padStart(2,'0')} / 10`;$('movesNum').textContent=String(moves);$('homesNum').textContent=`${n} / ${p.houses.length}`;
 const best=read(bestKey(),null);$('bestScore').textContent=`${t('best')}: ${best??'—'}`;$('status').textContent=statusOverride??t('status');
 $('undo').disabled=history.length===0;$('next').textContent=level<10?t('next'):t('complete');$('levelSelect').value=String(level);
}
function checkVictory(){if(!isWin(current,p.houses))return false;won=true;const old=read(bestKey(),null);if(old===null||moves<old)store(bestKey(),moves);store(progressKey(),null);const stars=starCount();$('starsEarned').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('winMoves').textContent=`${moves} ${t('attempts')}`;render();$('winOverlay').hidden=false;$('next').focus();sayTone();return true;}
function step(i){if(won||i===p.source||!p.active[i])return;history.push({index:i,prev:current[i]});current[i]=rotate(current[i]);moves++;hintIndex=-1;sayTone();if(!checkVictory()){saveProgress();render(t('moveStatus'));}}
$('undo').addEventListener('click',()=>{if(!history.length)return;const item=history.pop();current[item.index]=item.prev;moves=Math.max(0,moves-1);hintIndex=-1;won=false;$('winOverlay').hidden=true;saveProgress();render();});
$('restart').addEventListener('click',()=>load(level,true));$('replay').addEventListener('click',()=>load(level,true));
$('hint').addEventListener('click',()=>{if(won)return;const candidates=[];for(let i=0;i<current.length;i++)if(i!==p.source&&p.active[i]&&current[i]!==p.solved[i])candidates.push(i);hintIndex=candidates[0]??-1;render(hintIndex>=0?t('hintStatus'):t('moveStatus'));});
$('next').addEventListener('click',()=>{if(level<10)load(level+1);else load(1);});
$('levelSelect').addEventListener('change',e=>load(Number(e.target.value)));
$('lang').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';store('language',lang);render();});
$('sound').addEventListener('click',()=>{audioOn=!audioOn;store('audio',audioOn);render();if(audioOn)sayTone();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('winOverlay').hidden){$('winOverlay').hidden=true;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){$('undo').click();e.preventDefault();}});
load(level);
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
