// LIGHTSHIFT deterministic, inspectable puzzle generator. MIT License.
// Difficulty targets measure work for a *known* solution, not an unproven global minimum.
export const N=1,E=2,S=4,W=8;
export const LEVELS=10;
export const CONFIGS=[
  {size:3,effort:7,misaligned:4,houses:1},
  {size:4,effort:15,misaligned:8,houses:2},
  {size:4,effort:22,misaligned:10,houses:3},
  {size:5,effort:27,misaligned:14,houses:4},
  {size:5,effort:32,misaligned:17,houses:4},
  {size:5,effort:38,misaligned:19,houses:5},
  {size:6,effort:44,misaligned:24,houses:6},
  {size:6,effort:49,misaligned:26,houses:7},
  {size:6,effort:54,misaligned:28,houses:8},
  {size:6,effort:64,misaligned:31,houses:9},
];
const DIRS=[[-1,0,N,S],[0,1,E,W],[1,0,S,N],[0,-1,W,E]];
function rand(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function rotate(mask){return ((mask<<1)&15)|(mask>>3);}
function neighbor(i,size,dir){const r=Math.floor(i/size)+dir[0],c=i%size+dir[1];return r>=0&&r<size&&c>=0&&c<size?r*size+c:-1;}
export function neighbors(i,size){return DIRS.map(([dy,dx,out,back])=>{const j=neighbor(i,size,[dy,dx]);return {j,out,back};}).filter(e=>e.j>=0);}
export function connectivity(masks,source,size){const lit=new Set([source]),queue=[source];for(let at=0;at<queue.length;at++)for(const {j,out,back} of neighbors(queue[at],size))if(!lit.has(j)&&(masks[queue[at]]&out)&&(masks[j]&back)){lit.add(j);queue.push(j);}return lit;}
export function noOpenEnds(masks,size){for(let i=0;i<masks.length;i++)for(const dir of DIRS)if(masks[i]&dir[2]){const j=neighbor(i,size,dir);if(j<0||!(masks[j]&dir[3]))return false;}return true;}
export function isWin(masks,p){return masks.length===p.size*p.size&&noOpenEnds(masks,p.size)&&connectivity(masks,p.source,p.size).size===p.size*p.size;}
export function rotationDistance(from,to){let m=from;for(let turns=0;turns<4;turns++,m=rotate(m))if(m===to)return turns;throw Error('Impossible rotation');}
export function referenceEffort(initial,solved,source){let turns=0,misaligned=0;for(let i=0;i<initial.length;i++){if(i===source)continue;const t=rotationDistance(initial[i],solved[i]);turns+=t;if(t>0)misaligned++;}return {turns,misaligned};}
function makeCandidate(config,level,attempt){const {size,houses:count}=config;const rng=rand((0xA11CE^Math.imul(level,9973)^Math.imul(attempt+1,2246822519))>>>0);const source=Math.floor(size/2)*size+Math.floor(size/2),total=size*size;
  const solved=Array(total).fill(0),seen=new Set([source]),frontier=[];
  const put=i=>{for(const e of neighbors(i,size))if(!seen.has(e.j))frontier.push({i,...e});};put(source);
  while(seen.size<total){if(!frontier.length)throw Error('Tree construction failed');const k=Math.floor(rng()*frontier.length),edge=frontier[k];frontier[k]=frontier[frontier.length-1];frontier.pop();if(seen.has(edge.j))continue;
    seen.add(edge.j);solved[edge.i]|=edge.out;solved[edge.j]|=edge.back;put(edge.j);
  }
  // Visual landmarks are just a subset of the required powered grid.
  const endpoints=Array.from({length:total},(_,i)=>i).filter(i=>i!==source&&(solved[i]===N||solved[i]===E||solved[i]===S||solved[i]===W));
  const others=Array.from({length:total},(_,i)=>i).filter(i=>i!==source&&!endpoints.includes(i));
  for(const arr of [endpoints,others])for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  const houses=[...endpoints,...others].slice(0,count).sort((a,b)=>a-b);
  const initial=solved.map((m,i)=>i===source?m:Array.from({length:Math.floor(rng()*4)}).reduce(rotate,m));
  const effort=referenceEffort(initial,solved,source);
  return {level,size,source,houses,solved,initial,effort,active:Array(total).fill(true),objective:'whole-grid-no-leaks'};
}
export function makeLevel(level){if(!Number.isInteger(level)||level<1||level>LEVELS)throw Error('Level must be 1..10');const config=CONFIGS[level-1];let best=null;
  for(let attempt=0;attempt<512;attempt++){
    const p=makeCandidate(config,level,attempt);
    if(!isWin(p.solved,p)||isWin(p.initial,p))continue;
    if(p.effort.turns>=config.effort&&p.effort.misaligned>=config.misaligned&&(!best||p.effort.turns<best.effort.turns||p.effort.turns===best.effort.turns&&p.effort.misaligned>best.effort.misaligned))best=p;
    if(best&&best.effort.turns===config.effort)return best;
  }
  if(best&&best.effort.turns<config.effort+5)return best;throw Error(`Cannot meet audited effort threshold for level ${level}. Best: ${JSON.stringify(best?.effort)}`);
}
export function stateAfterRotation(masks,index){const result=[...masks];result[index]=rotate(result[index]);return result;}
export function unlockedAfterWin(previous,completed){return Math.max(1,Math.min(LEVELS,Math.max(previous,completed+1)));}
export function clampLevel(requested,unlocked){const value=Number(requested);return Number.isInteger(value)?Math.min(Math.max(value,1),Math.max(1,Math.min(LEVELS,unlocked))):1;}
