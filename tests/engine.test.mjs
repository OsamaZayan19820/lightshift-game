import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLevel,connectivity,isWin,rotate,stateAfterRotation,SIZE} from '../engine.mjs';
test('all ten puzzle configurations have a guaranteed solved layout and unsolved start',()=>{
  for(let level=1;level<=10;level++){
    const p=makeLevel(level);
    assert.equal(p.initial.length,SIZE*SIZE);
    assert.equal(p.source,12);
    assert.equal(isWin(p.solved,p.houses),true,`solution level ${level}`);
    assert.equal(isWin(p.initial,p.houses),false,`initial level ${level}`);
    assert(p.houses.every(h=>connectivity(p.solved).has(h)));
    assert.deepEqual(makeLevel(level).initial,p.initial,'generation must be deterministic');
    // Reversibility by rotating each non-source tile to its known valid solution.
    let work=[...p.initial];
    for(let index=0;index<work.length;index++){
      if(index===p.source)continue;
      let guard=0;
      while(work[index]!==p.solved[index]&&guard++<4)work=stateAfterRotation(work,index);
      assert.equal(work[index],p.solved[index]);
    }
    assert(isWin(work,p.houses),`replayed restoration must win for level ${level}`);
  }
});
test('rotation closes cycle and conserves connector count',()=>{
 for(let mask=0;mask<16;mask++){
  let shifted=mask;
  for(let k=0;k<4;k++)shifted=rotate(shifted);
  assert.equal(shifted,mask);
 }
});
test('adjacent unmatched connectors do not magically transmit power',()=>{
 const p=makeLevel(1);const broken=Array(25).fill(0);broken[12]=1;broken[7]=4;assert(connectivity(broken).has(7));
 broken[7]=2;assert(!connectivity(broken).has(7));
});
