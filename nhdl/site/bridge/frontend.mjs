import {parse} from '../vendor/bilascript/parser.js';
import {buildSourceMap} from '../vendor/bilascript/source-map.js';
export const PROFILE='nhdl-bila-rtl/0.2.0';
const arity={sti:1,buf:1,inc:1,dec:1,tmin:2,tmax:2,tcmp:2,mux:4};
const wrap=n=>((n+1)%3+3)%3-1;
const literal=n=>n==='X'?'X':({[-1]:'N',0:'O',1:'P'})[n];
export function compile(source){
 const diagnostics=[];
 function fail(code,message,node){const e=new Error(message);e.diagnostic={code,severity:'error',message,line:node?.loc?.start?.line||1,column:node?.loc?.start?.column||1};throw e;}
 try{
  if(typeof source!=='string'||source.length>10000)fail('E_SIZE','Mã nguồn tối đa 10.000 đơn vị UTF-16');
  const ast=parse(source).ast,fn=ast.body[0];
  if(ast.body.length!==1||fn?.type!=='FunctionDeclaration'||fn.async||fn.generator)fail('E_PROFILE','Chỉ hỗ trợ một hàm tổ hợp đồng bộ',fn);
  if(fn.params.length<1||fn.params.length>3)fail('E_PORTS','Hàm cần từ 1 đến 3 cổng đầu vào',fn);
  const names=new Map();
  function checkType(t,n){if(!t||t.types?.length!==1||t.types[0].name!=='trit'||t.types[0].typeArguments?.length)fail('E_TYPE','Khai báo kiểu trit là bắt buộc',n);}
  fn.params.forEach((p,i)=>{if(p.type!=='Identifier'||names.has(p.name))fail('E_PARAM','Tham số phải là tên duy nhất, không có destructuring/default',p);checkType(p.typeAnnotation,p);names.set(p.name,'p'+i);});
  checkType(fn.returnType,fn);
  const ret=fn.body.body[0];
  if(fn.body.body.length!==1||ret?.type!=='ReturnStatement'||!ret.argument)fail('E_BODY','Thân hàm chỉ hỗ trợ một trov_ved biểu thức',fn);
  let nodes=0;
  function lower(n){
   if(++nodes>128)fail('E_COMPLEXITY','Biểu thức vượt giới hạn 128 nút',n);
   if(n.type==='Identifier'){if(names.has(n.name))return {v:names.get(n.name),eval:env=>env[n.name]};if(['N','O','P','X'].includes(n.name))return {v:n.name,eval:()=>({N:-1,O:0,P:1,X:'X'})[n.name]};fail('E_NAME','Tên chưa được khai báo: '+n.name,n);}
   if(n.type==='Literal'&&typeof n.value==='number'&&[0,1].includes(n.value))return {v:literal(n.value),eval:()=>n.value};
   if(n.type==='UnaryExpression'&&n.operator==='-'){const a=lower(n.argument);return {v:`sti(${a.v})`,eval:e=>{const x=a.eval(e);return x==='X'?'X':-x;}};}
   if(n.type==='BinaryExpression'&&['+','-','*'].includes(n.operator)){
    const a=lower(n.left),b=lower(n.right),op=n.operator;
    return {v:`(${a.v} ${op} ${b.v})`,eval:e=>{const x=a.eval(e),y=b.eval(e);return x==='X'||y==='X'?'X':op==='*'?x*y:wrap(op==='+'?x+y:x-y);}};
   }
   if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&!names.has(n.callee.name)&&Object.hasOwn(arity,n.callee.name)){
    const name=n.callee.name;if(n.arguments.length!==arity[name])fail('E_ARITY','Sai số đối số của '+name,n);
    const args=n.arguments.map(lower);
    return {v:`${name}(${args.map(a=>a.v).join(', ')})`,eval:e=>{const x=args.map(a=>a.eval(e));if(name==='mux')return x[0]==='X'?'X':x[x[0]+2];if(x.includes('X'))return 'X';switch(name){case 'buf':return x[0];case 'sti':return -x[0];case 'inc':return wrap(x[0]+1);case 'dec':return wrap(x[0]-1);case 'tmin':return Math.min(...x);case 'tmax':return Math.max(...x);case 'tcmp':return Math.sign(x[0]-x[1]);}}};
   }
   fail('E_UNSUPPORTED','Cấu trúc/giá trị chưa hỗ trợ trong profile RTL: '+n.type,n);
  }
  const expr=lower(ret.argument),ports=[...names.values()];
  const lines=['use work.nhdl_ternary.all;','entity generated is',`  port(${ports.join(', ')} : in FakeTrit; y : out FakeTrit);`,'end;','architecture rtl of generated is','begin',`  y <= ${expr.v};`,'end;'];
  const sourceMap=buildSourceMap([{generated:{line:1,column:0},original:fn.loc.start},{generated:{line:2,column:2},original:fn.params[0].loc.start},{generated:{line:6,column:2},original:ret.loc.start}],{file:'generated.vhd',source:'input.bila',sourceContent:source});
  const vectors=[];
  function enumerate(vals){if(vals.length<ports.length){for(const v of [-1,0,1,'X'])enumerate([...vals,v]);return;}const env=Object.fromEntries([...names.keys()].map((n,i)=>[n,vals[i]]));vectors.push({inputs:vals,expected:expr.eval(env)});}enumerate([]);
  const tb=['use work.nhdl_ternary.all;','entity tb_generated is end;','architecture test of tb_generated is',`signal ${ports.join(', ')}, y : FakeTrit := X;`,'begin',`dut: entity work.generated port map(${ports.join(', ')}, y);`,'process begin',...vectors.flatMap((r,i)=>[...r.inputs.map((v,j)=>`${ports[j]} <= ${literal(v)};`),'wait for 1 ns;',`assert y = ${literal(r.expected)} report "vector ${i}" severity failure;`]),'report "PASS generated exhaustive testbench";','std.env.stop; wait;','end process;','end;'].join('\n')+'\n';
  return {ok:true,profile:PROFILE,source,diagnostics,entity:'generated',ports:Object.fromEntries(names),vhdl:lines.join('\n')+'\n',sourceMap,testbench:tb,vectors,verification:{status:'NOT_RUN',required:['ghdl analyze','elaborate','exhaustive testbench','synthesis frontend']}};
 }catch(e){diagnostics.push(e.diagnostic||{code:'E_PARSE',severity:'error',message:'Lỗi cú pháp: '+e.message,line:e.token?.start?.line||1,column:e.token?.start?.column||1});return {ok:false,profile:PROFILE,diagnostics};}
}
export function assistantRequest(text){if(typeof text!=='string'||text.length>4000)throw Error('Yêu cầu tối đa 4.000 ký tự');return {schema:'nhdl-assistant-request/1.0.0',provider:'TinyLLM_Vietnamese',reference:'https://xulytiengviet.github.io/TinyLLM_Vietnamese/',inference:'NOT_CONNECTED',prompt:text,profile:PROFILE,instructions:'Trả một hàm haml_sob với 1..3 tham số kiểu trit và kiểu trả về trit; thân chỉ có trov_ved. Phép +,- là modulo cân bằng 3. Chỉ dùng N/O/P/X, +,-,*, sti,buf,inc,dec,tmin,tmax,tcmp,mux. Không xuất shell hoặc mã thực thi.',gate:'Compile → exhaustive GHDL testbench → synth; semantic correctness against user intent still needs independent review'};}
