import test from 'node:test';
import assert from 'node:assert/strict';
import {compile} from '../site/bridge/frontend.mjs';
import {examples} from '../site/bridge/examples.mjs';
test('clocked profile: explicit transition, reset priority, hold',()=>{
 const r=compile(examples.counter); assert.equal(r.ok,true);
 assert.equal(r.kind,'clocked'); assert.match(r.vhdl,/rising_edge\(clk\)/);
 assert.deepEqual(r.vectors.map(v=>v.expected),[0,0,1,-1,0,0,0,1]);
 assert.equal(r.verification.status,'NOT_RUN');
});
test('reject optional intrinsic calls and intrinsic name collisions',()=>{
 for(const s of ['haml_sob f(a: trit): trit { trov_ved sti?.(a); }','haml_sob sti(a: trit): trit { trov_ved sti(a); }'])assert.equal(compile(s).ok,false);
});
test('reject malformed state contracts and additional state arguments',()=>{
 assert.equal(compile(examples.counter.replace('reset=O','reset=P')).ok,false);
 assert.equal(compile(examples.counter.replace('q: trit','q: trit, d: trit')).ok,false);
});
