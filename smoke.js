// Mock-DOM smoke test (NOT real Electron): drives app.js actions and checks rendered HTML.
const vm=require('vm'),fs=require('fs');let html='',saved=null,hs={},fail=0;
const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}else console.log('ok  ',m)};
const el={value:'Python',focus(){},textContent:'',dataset:{}};
const doc={getElementById:id=>id==='app'?{set innerHTML(v){html=v},get innerHTML(){return html}}:el,querySelectorAll:()=>[],addEventListener:(t,f)=>hs[t]=f,activeElement:{id:'',tagName:'BODY'},documentElement:{style:{setProperty(){},removeProperty(){}}},createElement:()=>({click(){}})};
const mk=(o)=>({target:{tagName:'X',dataset:o,closest:()=>({dataset:o,tagName:'BUTTON'}),type:'text',value:o.v,checked:o.v}, preventDefault(){}});
function run(load,web){const ctx={location:{reload(){}},window:{api:{web,load:async()=>load,save:async s=>{saved=JSON.stringify(s)},win:async()=>{},dataPath:async()=>'x'}},document:doc,confirm:()=>true,setInterval(){},URL:{createObjectURL:()=>'x'},Blob:class{},console,Promise};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);return ctx}
const clk=(c,a,i)=>hs.click({target:{tagName:'BUTTON',closest:()=>({dataset:{a,i},tagName:'BUTTON'})},preventDefault(){}});
const chg=(f,v)=>hs.change({target:{dataset:{f},type:'text',value:v}});
(async()=>{
 for(const bad of [null,'garbage',{routine:'x',days:5,timer:7}]){const c=run(bad);await new Promise(r=>setTimeout(r,20));ok(html.includes('Study, Grow')&&!/undefined|NaN|\[object/.test(html),'boots with data '+JSON.stringify(bad))}
 const c=run(null);await new Promise(r=>setTimeout(r,20));
 for(const p of['focus','history','settings','today']){clk(c,'page',p);ok(!/undefined|NaN|\[object/.test(html),'page '+p+' renders clean')}
 const V=x=>vm.runInContext(x,c);
 clk(c,'start','english');vm.runInContext('Date.now=(o=>()=>o()+45*60000)(Date.now)',c);
 clk(c,'start','quran');ok(V('S.timer.id')==='english','second timer blocked');
 clk(c,'pause');const acc=V('S.timer.acc');ok(acc>=44*60000,'pause banks elapsed time');vm.runInContext('Date.now=(o=>()=>o()+600000)(Date.now)',c);ok(V('el(S.timer)')===acc,'paused time not counted');
 clk(c,'resume');clk(c,'finish');ok(V('D().mins.english')===45&&!V('D().done.english'),'45 min saved, task not auto-complete');
 ok(V('D().sess.english.length')===1,'session recorded');
 chg('min:english','120');ok(V('D().done.english')===true,'manual minutes >= target completes task');
 chg('top:0','Learn SQL');clk(c,'fs');ok(V('S.timer.id')==='f:0'&&V('D().focus[0].t')==='Learn SQL','focus session on priority');clk(c,'finish');ok(V('D().focus[0].mins')>=0,'focus minutes saved');
 chg('fdur:0','30');ok(V('D().focus[0].dur')===30,'focus target editable');
 clk(c,'tadd');clk(c,'tadd');chg('ttxt:1','second');
 hs.dragstart({target:{closest:()=>({dataset:{dl:'todos',di:'0'}})},dataTransfer:{setData(){}}});
 hs.drop({target:{closest:()=>({dataset:{drop:'todos',ri:'1'}})},preventDefault(){}});ok(V('D().todos[1].t')==='Python','drag reorder to-do');
 chg('rn:0:rtime','08:55');chg('rn:3:split','3');ok(V('S.routine[0].rtime')==='08:55'&&V('S.routine[3].split')===3,'reminder time + sessions editable');
 chg('col:cherry','#112233');ok(V('S.settings.colors.cherry')==='#112233','color saved');
 chg('rn:0:dur','9999');ok(V('S.routine[0].dur')===600,'duration validated');
 vm.runInContext('Date.now=(o=>()=>o()+86400000)(Date.now)',c);
 ok(JSON.parse(saved).days&&Object.keys(JSON.parse(saved).days).length>=1,'history saved');
  const w=run(null,true);await new Promise(r=>setTimeout(r,20));vm.runInContext("page='settings';render()",w);
 ok(/Enable notifications/.test(html)&&!/Always on top/.test(html),'web settings hide desktop-only toggles, show notifications');
 const j=JSON.stringify({routine:[{id:'x',name:'Imp',time:'08:00',dur:5,days:[0,1,2,3,4,5,6]}],days:{}});
 hs.change({target:{dataset:{f:'imp'},files:[{text:async()=>j}]}});await new Promise(r=>setTimeout(r,20));ok(JSON.parse(saved).routine[0].id==='x','import valid backup');
 saved=null;hs.change({target:{dataset:{f:'imp'},files:[{text:async()=>'nope'}]}});await new Promise(r=>setTimeout(r,20));ok(saved===null&&/not a valid/.test(html),'import rejects bad file');
 console.log(fail?'FAILURES: '+fail:'ALL SMOKE TESTS PASSED');process.exit(fail?1:0)})();
