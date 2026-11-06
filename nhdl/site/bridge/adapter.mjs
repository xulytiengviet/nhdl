export const ALPHABET = Object.freeze({version:'tritlab-space-az/1.0.0',symbols:' ABCDEFGHIJKLMNOPQRSTUVWXYZ',source:'https://xulytiengviet.github.io/trit/cvnss.html',index:'SPACE=0,A=1..Z=26',tritOrder:'most-significant-first'});
const SCHEMA='nhdl-vietnamese/1.0.0';
export function triad(id){if(!Number.isInteger(id)||id<0||id>26)throw Error('ID phải thuộc 0…26');return [Math.floor(id/9)-1,Math.floor(id%9/3)-1,id%3-1];}
function frame(text){return Array.from(text,(ch)=>{const upper=ch.toUpperCase(),id=ALPHABET.symbols.indexOf(upper);if(upper.length===1&&id>=0)return {kind:'symbol',id,lower:ch!==upper,trits:triad(id)};return {kind:'unicode',codepoint:ch.codePointAt(0)};});}
export function decodeFrames(packet){
 if(packet.schema!==SCHEMA||packet.alphabet?.version!==ALPHABET.version||packet.alphabet.symbols!==ALPHABET.symbols)throw Error('Schema hoặc phiên bản bảng ký hiệu không tương thích');
 if(!Array.isArray(packet.frames))throw Error('Thiếu khung dữ liệu');
 return packet.frames.map(f=>{
  if(f.kind==='symbol'){
   const t=triad(f.id);if(typeof f.lower!=='boolean'||JSON.stringify(t)!==JSON.stringify(f.trits))throw Error('ID/trit/case không nhất quán');
   const ch=ALPHABET.symbols[f.id];if(f.lower&&ch===' ')throw Error('Case không hợp lệ');return f.lower?ch.toLowerCase():ch;
  }
  if(f.kind==='unicode'&&Number.isInteger(f.codepoint)&&f.codepoint>=0&&f.codepoint<=0x10ffff&&!(f.codepoint>=0xd800&&f.codepoint<=0xdfff))return String.fromCodePoint(f.codepoint);
  throw Error('Khung Unicode không hợp lệ');
 }).join('');
}
export function encodeVietnamese(source,mode='cqn',oracle=globalThis.CVNSSConverter){
 if(typeof source!=='string'||source.length>20000)throw Error('Văn bản phải là chuỗi tối đa 20.000 đơn vị UTF-16');
 if(/\p{Surrogate}/u.test(source))throw Error('Văn bản chứa surrogate không hợp lệ');
 if(!oracle||oracle.VERSION!=='5.0.0-audit-safe')throw Error('Cần oracle 5.0.0-audit-safe');
 const normalized=source.normalize('NFC'), converted=oracle.convert(normalized,mode);
 const words=Array.from(converted.cvss.matchAll(/[\p{L}]+/gu),m=>{
  const info=oracle.inspectWord(m[0],'cvss');
  return {code:m[0],start:m.index,end:m.index+m[0].length,offsetUnit:'UTF-16',candidates:[...info.candidates],canonical:info.selected,ambiguous:info.ambiguous,critical:info.critical,status:info.ambiguous?'NEEDS_REVIEW':'CANONICAL_ONLY',selection:null};
 });
 return {schema:SCHEMA,alphabet:{...ALPHABET},oracle:{version:oracle.VERSION},sourceMode:mode,sourceText:source,normalizedText:normalized,normalization:'NFC; original retained',...converted,frames:frame(converted.cvss),words,policy:'Retain all oracle candidates; canonical is not proof of original meaning',verification:{transport:'round-trip',language:'not-lossless'}};
}
export function selectCandidate(packet,index,value){const copy=JSON.parse(JSON.stringify(packet));const w=copy.words[index];if(!w||!w.candidates.includes(value))throw Error('Ứng viên không thuộc danh sách');w.selection={value,method:'user'};w.status='USER_SELECTED';return copy;}
