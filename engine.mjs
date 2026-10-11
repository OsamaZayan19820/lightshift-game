// LIGHTSHIFT deterministic puzzle engine. MIT License.
export const N=1,E=2,S=4,W=8;
export const SIZE=5;
const SOURCE=12;
const HOUSE_SETS=[
  [2],[2,22],[0,4],[0,20],[4,20,24],
  [0,2,4],[0,4,20,24],[1,3,21,23],[0,2,4,20,22],[0,2,4,20,22,24]
];
const NEIGHBORS=[[-5,N,S],[1,E,W],[5,S,N],[-1,W,E]];
function rand(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function rotate(mask){return ((mask<<1)&15)|(mask>>3);}
function adjacency(i){const r=Math.floor(i/SIZE),c=i%SIZE;return NEIGHBORS.filter(([d])=>{
  if(d===-5)return r>0;if(d===5)return r<SIZE-1;
  if(d===1)return c<SIZE-1;return c>0;
}).map(([delta,a,b])=>({j:i+delta,a,b}));}
function shuffle(arr,rng){for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
export function connectivity(masks,source=SOURCE){
  const energized=new Set([source]);const q=[source];
  for(let p=0;p<q.length;p++){
    const i=q[p];for(const {j,a,b} of adjacency(i)){
      if(!energized.has(j)&&(masks[i]&a)&&(masks[j]&b)){
        energized.add(j);q.push(j);
      }
    }
  }
  return energized;
}
export function isWin(masks,houses){const lit=connectivity(masks);return houses.every(h=>lit.has(h));}
export function makeLevel(level){
  if(!Number.isInteger(level)||level<1||level>HOUSE_SETS.length)throw Error('Level must be 1..10');
  const rng=rand(0xA11CE+level*9973);
  const houses=[...HOUSE_SETS[level-1]];
  const solved=Array(SIZE*SIZE).fill(0),connected=new Set([SOURCE]);
  for(const house of shuffle([...houses],rng)){
    if(connected.has(house))continue;
    const q=[house],parent=Array(SIZE*SIZE).fill(-2);parent[house]=-1;
    let found=-1;
    for(let head=0;head<q.length;head++){
      const i=q[head];if(connected.has(i)){found=i;break;}
      for(const {j} of shuffle(adjacency(i),rng))if(parent[j]===-2){parent[j]=i;q.push(j);}
    }
    if(found<0)throw Error('Failed to generate path');
    for(let cur=found;parent[cur]!==-1;cur=parent[cur]){
      const next=parent[cur];
      const edge=adjacency(cur).find(e=>e.j===next);
      solved[cur]|=edge.a;solved[next]|=edge.b;
      connected.add(cur);connected.add(next);
    }
    connected.add(house);
  }
  if(!isWin(solved,houses))throw Error('Invalid solved network');
  const initial=[...solved];let changed=0;
  for(let i=0;i<initial.length;i++){
    if(i===SOURCE||solved[i]===0)continue;
    // Rotate only real path segments; preserve at least one known solution.
    const times=1+Math.floor(rng()*3);
    for(let t=0;t<times;t++)initial[i]=rotate(initial[i]);
    if(initial[i]!==solved[i])changed++;
  }
  // Guard against exceptionally easy accidental solved layouts.
  if(isWin(initial,houses)||changed<2){
    for(let i=0;i<initial.length;i++)if(i!==SOURCE&&solved[i]!==0)initial[i]=rotate(solved[i]);
  }
  if(isWin(initial,houses))throw Error('Unexpected solved initial level');
  return {level,houses,source:SOURCE,solved,initial,active:solved.map((m,i)=>m!==0||i===SOURCE),size:SIZE};
}
export function stateAfterRotation(masks,index){const result=[...masks];result[index]=rotate(result[index]);return result;}
