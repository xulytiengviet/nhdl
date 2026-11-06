#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {compile} from '../site/bridge/frontend.mjs';
const args=process.argv.slice(2),input=args[0],oi=args.indexOf('--out'),out=path.resolve(oi>=0?args[oi+1]:'nhdl-output');
if(!input){console.error('Dùng: node nhdl/tools/nhdlc.mjs input.bila --out thư_mục [--verify]');process.exit(2);}
const source=fs.readFileSync(input,'utf8'),result=compile(source);fs.mkdirSync(out,{recursive:true});
for(const name of ['generated.vhd','tb_generated.vhd','generated.vhd.map','verification.json','synthesized.vhd','diagnostics.json'])fs.rmSync(path.join(out,name),{force:true});
if(!result.ok){fs.writeFileSync(path.join(out,'diagnostics.json'),JSON.stringify(result,null,2));fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({status:'FAIL',stage:'compile',diagnostics:result.diagnostics},null,2));console.error(JSON.stringify(result.diagnostics));process.exit(1);}
for(const [name,content] of Object.entries({'generated.vhd':result.vhdl,'tb_generated.vhd':result.testbench,'generated.vhd.map':JSON.stringify(result.sourceMap,null,2)}))fs.writeFileSync(path.join(out,name),content);
const hash=s=>createHash('sha256').update(s).digest('hex');
const report={schema:'nhdl-verification/1.0.0',profile:result.profile,sourceSha256:hash(source),vhdlSha256:hash(result.vhdl),testbenchSha256:hash(result.testbench),vectors:result.vectors.length,status:'NOT_RUN',steps:[],limitation:'Tests check emitted RTL against profile evaluator; user intent requires independent review. No FPGA benchmark.'};
if(args.includes('--verify')){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nhdl-verify-'));const ghdl=process.env.GHDL||'ghdl';
 const rtl=fileURLToPath(new URL('../rtl/nhdl_ternary.vhd',import.meta.url));
 const stages=[['version',['--version']],['analyze',['-a','--std=08',rtl,path.join(out,'generated.vhd'),path.join(out,'tb_generated.vhd')]],['elaborate',['-e','--std=08','tb_generated']],['simulate',['-r','--std=08','tb_generated','--assert-level=error','--stop-time=100ns']],['synth',['--synth','--std=08','generated']]];
 try{report.status='PASS';for(const [name,argv] of stages){const p=spawnSync(ghdl,argv,{cwd:temp,encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024});let ok=p.status===0&&!p.error;if(name==='simulate')ok=ok&&p.stdout.includes('PASS generated exhaustive testbench');report.steps.push({name,ok,exitCode:p.status,log:(p.error?.message||'')+(p.stdout||'')+(p.stderr||'')});if(!ok){report.status='FAIL';break;}if(name==='synth')fs.writeFileSync(path.join(out,'synthesized.vhd'),p.stdout);}}
 finally{fs.rmSync(temp,{recursive:true,force:true});}
}
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,vectors:report.vectors,out}));if(report.status==='FAIL')process.exitCode=1;
