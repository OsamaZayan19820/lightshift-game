import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLevel,LEVELS,CONFIGS,connectivity,isWin,rotate,stateAfterRotation,noOpenEnds,referenceEffort,unlockedAfterWin,clampLevel} from '../engine.mjs';

test('all 10 levels: different boards, strict wins, proven reference solutions and deterministic starts',()=>{
  for(let level=1;level<=LEVELS;level++){
    const p=makeLevel(level);
    assert.equal(p.initial.length,p.size*p.size);
    assert.equal(p.solved.length,p.size*p.size);
    assert.equal(isWin(p.solved,p),true,`level ${level} valid solved layout`);
    assert.equal(noOpenEnds(p.solved,p.size),true);
    assert.equal(connectivity(p.solved,p.source,p.size).size,p.size*p.size);
    assert.equal(isWin(p.initial,p),false,`level ${level} does not start won`);
    assert.deepEqual(makeLevel(level).initial,p.initial,'stable seeded puzzle');
    assert.deepEqual(referenceEffort(p.initial,p.solved,p.source),p.effort);
    assert(p.effort.turns>=CONFIGS[level-1].effort,`level ${level} reference effort`);
    assert(p.effort.misaligned>=CONFIGS[level-1].misaligned,`level ${level} scrambled tiles`);
    let work=[...p.initial];
    for(let index=0;index<work.length;index++)if(index!==p.source){let guard=0;while(work[index]!==p.solved[index]&&guard++<4)work=stateAfterRotation(work,index);assert.equal(work[index],p.solved[index]);}
    assert.equal(isWin(work,p),true,`level ${level} reproducible solution`);
  }
});
test('difficulty reference workload strictly grows across levels',()=>{
  let previous=0;
  for(let level=1;level<=LEVELS;level++){const effort=makeLevel(level).effort.turns;assert(effort>previous,`${level}: ${effort} must exceed previous ${previous}`);previous=effort;}
});
test('rotation has full cycle and preserves pipes',()=>{
 for(let mask=0;mask<16;mask++){let x=mask;for(let i=0;i<4;i++)x=rotate(x);assert.equal(x,mask);}
});
test('no open wire ends: one disconnected segment can invalidate a fully lit graph',()=>{
 const p=makeLevel(2);const work=[...p.solved];
 // Rotating any leaf creates at least one open end; must not result in victory.
 const leaf=p.solved.findIndex((mask,i)=>i!==p.source&&[1,2,4,8].includes(mask));
 work[leaf]=rotate(work[leaf]);assert.equal(noOpenEnds(work,p.size),false);assert.equal(isWin(work,p),false);
});
test('level access is sequential, cannot jump directly to 10',()=>{
 assert.equal(clampLevel(10,1),1);
 assert.equal(unlockedAfterWin(1,1),2);
 assert.equal(unlockedAfterWin(2,2),3);
 assert.equal(unlockedAfterWin(7,3),7);
 assert.equal(clampLevel(10,7),7);
 assert.equal(unlockedAfterWin(10,10),10);
 assert.equal(clampLevel('garbage',5),1);
});
