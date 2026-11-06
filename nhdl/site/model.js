/* NHDL reference model. GPL-3.0-or-later. */
(function(root){
'use strict';
const valid=x=>Number.isInteger(x)&&x>=-1&&x<=1;
function add(a,b,c){if(![a,b,c].every(valid))return {s:'X',carry:'X'};const t=a+b+c,carry=t>1?1:t< -1?-1:0;return {s:t-3*carry,carry};}
function triad(id){if(!Number.isInteger(id)||id<0||id>26)throw new RangeError('ID must be 0..26');let n=id-13;const out=[];for(let i=0;i<3;i++){const d=((n+1)%3+3)%3-1;out.unshift(d);n=(n-d)/3;}return out;}
const symbol=x=>({'-1':'N','0':'O','1':'P',X:'X'}[x]);
const bits=x=>({'-1':'10','0':'00','1':'01',X:'11'}[x]);
const api={valid,add,triad,symbol,bits};
if(typeof module!=='undefined')module.exports=api;else root.NHDL=api;
})(globalThis);
