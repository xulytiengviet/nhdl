'use strict';
const $=id=>document.getElementById(id);
function update(){const vals=['a','b','ci'].map(id=>$(id).value==='X'?'X':Number($(id).value));const r=NHDL.add(...vals);$('result').innerHTML=`<div class="outputs"><div>SUM / S<strong>${NHDL.symbol(r.s)}</strong>${NHDL.bits(r.s)} · ${r.s}</div><div>CARRY / Co<strong>${NHDL.symbol(r.carry)}</strong>${NHDL.bits(r.carry)} · ${r.carry}</div></div><p>${r.s==='X'?'Đầu vào lỗi → S=X, Co=X':`${vals.join(' + ')} = ${r.s} + 3 × (${r.carry}) = ${vals.reduce((a,b)=>a+b,0)}`}</p>`;}
['a','b','ci'].forEach(id=>$(id).addEventListener('change',update));update();
function update27(){const id=Number($('id27').value),t=NHDL.triad(id);$('id-value').textContent=id;$('triad').innerHTML=t.map(NHDL.symbol).join(' · ')+`<small>${t.map(NHDL.bits).join(' ')} / giá trị cân bằng ${id-13} / trit cao → thấp</small>`;}$('id27').addEventListener('input',update27);update27();
let rows='';for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const r=NHDL.add(a,b,c);rows+='<tr>'+[a,b,c,r.s,r.carry].map(x=>'<td>'+NHDL.symbol(x)+'</td>').join('')+'</tr>';}$('truth').innerHTML=rows;
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('code').textContent);$('copy-status').textContent='Đã sao chép đoạn VHDL.';}catch{$('copy-status').textContent='Trình duyệt chặn clipboard. Hãy chọn đoạn mã để sao chép.';}});
