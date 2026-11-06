export const labels={unresolved:'Sẽ giải quyết · Chưa giải quyết',in_progress:'Đang giải quyết',resolved:'Đã giải quyết'};
export function normalize(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();}
export function filterItems(items,{query='',group='all',status='all',scope='all'}={}){
 const q=normalize(query.trim());return items.filter(p=>(group==='all'||p.group===group)&&(status==='all'||p.status===status)&&(scope==='all'||p.scope===scope)&&(!q||normalize([p.id,p.title,p.desc,p.bottleneck].join(' ')).includes(q)));
}
export function counts(items){return {total:items.length,unresolved:items.filter(p=>p.status==='unresolved').length,in_progress:items.filter(p=>p.status==='in_progress').length,resolved:items.filter(p=>p.status==='resolved').length};}
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id),size=20;let page=1,items=[],groups={},filtered=[];
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 function render(){
  filtered=filterItems(items,{query:$('query').value,group:$('group').value,status:$('status').value,scope:$('scope').value});
  const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages);$('challenge-list').replaceChildren();
  $('results-status').textContent=`${filtered.length} / ${items.length} bài toán phù hợp`;
  if(!filtered.length)$('challenge-list').append(node('p','Chưa có bài toán phù hợp với bộ lọc này. Hiện toàn bộ danh mục ở trạng thái chưa giải quyết.','empty-state'));
  for(const p of filtered.slice((page-1)*size,page*size)){
   const card=node('article',null,'challenge-card');card.id=p.id;
   const meta=node('div',null,'card-meta'),link=node('a',p.id,'card-id');link.href='?id='+encodeURIComponent(p.id);link.setAttribute('aria-label','Liên kết bài toán '+p.id);meta.append(link,node('span',labels[p.status],'state'));
   card.append(meta,node('h3',p.title),node('p',groups[p.group]+' · '+(p.scope==='core'?'Luồng nền tảng':'Mở rộng có điều kiện')),node('h4','Bản chất kỹ thuật'),node('p',p.desc));
   const detail=node('details');detail.append(node('summary','Vì sao là nút thắt cổ chai?'),node('p',p.bottleneck));card.append(detail);$('challenge-list').append(card);
  }
  $('page-status').textContent=filtered.length?`Trang ${page} / ${pages}`:'Không có kết quả';$('previous').disabled=page===1||!filtered.length;$('next').disabled=page===pages||!filtered.length;
 }
 $('filters').addEventListener('submit',e=>e.preventDefault());
 for(const id of ['query','group','status','scope'])$(id).addEventListener('input',()=>{page=1;render();});
 $('filters').addEventListener('reset',()=>{setTimeout(()=>{page=1;render();},0);});
 for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{page+=delta;render();$('results-status').scrollIntoView({block:'center'});});
 fetch('challenges.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{
  if(data.schema!=='nhdl-challenges/1.0.0'||!Array.isArray(data.items))throw Error('Schema không hợp lệ');items=data.items;groups=data.groups;
  for(const [key,title] of Object.entries(groups)){const o=node('option',`${key} · ${title}`);o.value=key;$('group').append(o);}
  const stats=counts(items);for(const [id,key] of [['count-total','total'],['count-planned','unresolved'],['count-active','in_progress'],['count-resolved','resolved']])$(id).textContent=stats[key];
  const id=new URLSearchParams(location.search).get('id');
  if(id&&items.some(p=>p.id===id)){
   $('group').value=items.find(p=>p.id===id).group;
   const groupItems=filterItems(items,{group:$('group').value});page=Math.floor(groupItems.findIndex(p=>p.id===id)/size)+1;
  }
  render();if(id&&document.getElementById(id)){document.getElementById(id).querySelector('details').open=true;document.getElementById(id).scrollIntoView({block:'center'});}
 }).catch(()=>{$('results-status').textContent='Không tải được danh mục. Hãy tải lại trang hoặc mở liên kết JSON.';});
}
