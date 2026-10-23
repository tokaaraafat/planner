'use strict';
const pad=n=>String(n).padStart(2,'0');
const key=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const A=[0,1,2,3,4,5,6],QUOTES=['small steps, big dreams','progress, not perfection','better than yesterday','you can do this','rest recharges you','make it happen'];
const DEF=()=>({settings:{startup:false,onTop:false,quiet:false,compact:false,colors:{rose:'#D98B9B',cherry:'#A71935',burg:'#6E1730'}},
 routine:[
 {id:'wake',name:'Wake up',time:'09:00',dur:0,pri:'high',note:'Target wake-up time',remind:true,days:A},
 {id:'bed',name:'Make my bed',time:'09:05',dur:5,pri:'med',note:'',remind:false,days:A},
 {id:'skin',name:'Morning skincare',time:'09:10',dur:10,pri:'med',note:'',remind:true,days:A},
 {id:'quran',kind:1,split:2,name:"Qur'an",time:'11:00',dur:60,pri:'high',note:'2 sessions of ~30 min',remind:true,days:A},
 {id:'english',kind:1,split:2,name:'English learning',time:'14:00',dur:120,pri:'high',note:'',remind:true,days:A},
 {id:'outlier',kind:1,split:1,name:'Outlier work',time:'17:00',dur:60,pri:'high',note:'',remind:true,days:A}],
 care:['Drink water','Eat proper meals','Take short breaks','Stretch or move','Evening skincare'],
 days:{},timer:null});
let S,view=key(),cur=key(),page='today',msg='',drag=null;
const D=(k=view)=>S.days[k]||(S.days[k]={done:{},mins:{},log:{},sess:{},top:['','',''],todos:[],focus:[],care:{},notes:'',refl:{},mood:-1,energy:0,q:{from:'',to:''}});
const save=()=>window.api.save(S);
const wd=k=>new Date(k+'T12:00:00').getDay();
const rFor=k=>S.routine.filter(r=>r.days.includes(wd(k))).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
const pct=k=>{const d=S.days[k];if(!d)return 0;const v=rFor(k);return v.length?v.filter(r=>d.done[r.id]).length/v.length:0};
const mins=(k,id)=>(S.days[k]&&S.days[k].mins[id])||0;
const el=t=>t?t.acc+(t.at?Date.now()-t.at:0):0;
const fmt=ms=>{const s=Math.floor(ms/1000);return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`};
const nowHM=()=>{const n=new Date();return pad(n.getHours())+':'+pad(n.getMinutes())};
const status=(r,d)=>d.done[r.id]?'done':(S.timer&&S.timer.id===r.id)?'prog':(view===key()&&r.time&&r.time<=nowHM())?'due':'';
const taskById=(id,date)=>{if(id.startsWith('f:')){const f=D(date).focus[+id.slice(2)];return f?{id,name:f.t,dur:f.dur||0,f}:null}return S.routine.find(x=>x.id===id)||null};
const applyColors=()=>{const c=S.settings.colors||{};for(const k of['rose','cherry','burg'])if(/^#[0-9a-f]{6}$/i.test(c[k]))document.documentElement.style.setProperty('--'+k,c[k])};
const ART={cherry:`<svg class="ill" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="M32 8C30 26 20 36 18 44M32 8C36 26 44 36 46 44" stroke="#6E1730" stroke-width="2" fill="none"/><circle cx="18" cy="46" r="11" fill="#A71935"/><circle cx="46" cy="46" r="11" fill="#A71935"/><path d="M32 8 20 2 22 14ZM32 8 44 2 42 14Z" fill="#D98B9B"/><circle cx="32" cy="8" r="3" fill="#6E1730"/><circle cx="14" cy="42" r="3" fill="#fff" opacity=".5"/></svg>`,
bow:`<svg class="ill" viewBox="0 0 48 32" width="40" height="27" aria-hidden="true"><path d="M24 16 4 4v24ZM24 16 44 4v24Z" fill="#D98B9B"/><circle cx="24" cy="16" r="5" fill="#A71935"/></svg>`,
books:`<svg class="ill" viewBox="0 0 80 48" width="80" height="48" aria-hidden="true"><rect x="6" y="30" width="68" height="14" rx="2" fill="#6E1730"/><rect x="12" y="16" width="60" height="14" rx="2" fill="#A71935"/><rect x="4" y="4" width="62" height="12" rx="2" fill="#D98B9B"/></svg>`};
const hd=(l,i)=>`<span class="hd" draggable="true" data-dl="${l}" data-di="${i}" title="Drag to reorder" aria-hidden="true">⠿</span>`;
const streak=()=>{let n=0,d=new Date();if(pct(key(d))<.7)d.setDate(d.getDate()-1);while(pct(key(d))>=.7){n++;d.setDate(d.getDate()-1)}return n};
const tUI=r=>{const t=S.timer;
 if(t&&t.id===r.id)return `<span class="tm" data-tm="${r.id}">${fmt(el(t))}</span> <button data-a="${t.at?'pause':'resume'}">${t.at?'Pause':'Resume'}</button> <button data-a="finish">Finish</button> <button class="ghost" data-a="discard">Discard</button>`;
 return view===key()?`<button data-a="start" data-i="${r.id}">Start</button>`:''};
function ringHTML(p,txt){return `<div class="ring" style="--p:${Math.round(p*100)}"><b>${txt??Math.round(p*100)+'%'}</b></div>`}
function goals(d){const v=rFor(view);return `<section class="card"><h2>♥ Today's goals <span style="float:right">${ART.bow}</span></h2>`+v.map(r=>`<div class="row ${d.done[r.id]?'done':''} ${status(r,d)}">
 <input class="chk" type="checkbox" aria-label="${e(r.name)}" data-a="tog" data-i="${r.id}" ${d.done[r.id]?'checked':''}>
 <span class="grow"><b class="nm">${e(r.name)}</b> <span class="small muted">${r.time||''} ${r.dur?'· '+r.dur+' min':''}</span><br><input class="small" style="width:100%" placeholder="note" value="${e(r.note)}" data-f="rnote:${r.id}"></span>
 <select data-f="rpri:${r.id}" aria-label="priority">${['high','med','low'].map(p=>`<option ${r.pri===p?'selected':''}>${p}</option>`).join('')}</select></div>`).join('')
 +`<p class="script small">${QUOTES[new Date().getDate()%QUOTES.length]} ♥</p></section>`}
function top3(d){return `<section class="card"><h2>★ Top 3 priorities</h2>`+[0,1,2].map(i=>`<div class="row"><b>${i+1}</b><input class="grow" value="${e(d.top[i])}" placeholder="priority ${i+1}" data-f="top:${i}"></div>`).join('')
 +`<p><button data-a="fs">Start focus session on #1</button></p><h2 style="margin-top:12px">Today's main focus</h2>`+d.focus.map((f,i)=>`<div class="row ${f.done?'done':''} ${S.timer&&S.timer.id==='f:'+i?'prog':''}" data-drop="focus" data-ri="${i}">${hd('focus',i)}<input class="chk" type="checkbox" data-a="ftog" data-i="${i}" ${f.done?'checked':''}><input class="grow nm" value="${e(f.t)}" data-f="ftxt:${i}">
 <span class="small">${f.mins||0}/<input type="number" min="0" max="600" style="width:60px" value="${f.dur||0}" data-f="fdur:${i}" aria-label="target minutes">min</span>${tUI({id:'f:'+i})}<button class="ghost" data-a="fdel" data-i="${i}">✕</button></div>`).join('')
 +`<div class="row"><input class="grow" id="fnew" placeholder="e.g. Python, SQL, portfolio…"><button data-a="fadd">Add</button></div></section>`}
function sched(){return `<section class="card"><h2>Study schedule</h2><p class="small muted">Edit times in Settings. Sorted by time.</p>`+rFor(view).map(r=>`<div class="row"><b>${r.time||'—'}</b><span class="grow">${e(r.name)}</span><span class="small">${r.dur?r.dur+' min':''}</span></div>`).join('')+`</section>`}
function todos(d){return `<section class="card"><h2>To-do list</h2>`+d.todos.map((t,i)=>`<div class="row ${t.done?'done':''}" data-drop="todos" data-ri="${i}">${hd('todos',i)}<input class="chk" type="checkbox" data-a="ttog" data-i="${i}" ${t.done?'checked':''}>
 <input class="grow nm" value="${e(t.t)}" data-f="ttxt:${i}"><input type="time" value="${e(t.due)}" data-f="tdue:${i}" aria-label="due time"><select data-f="tpri:${i}">${['high','med','low'].map(p=>`<option ${t.pri===p?'selected':''}>${p}</option>`).join('')}</select>
 <button class="ghost" data-a="tup" data-i="${i}" title="move up">↑</button><button class="ghost" data-a="tdel" data-i="${i}">✕</button></div>`).join('')
 +`<div class="row"><input class="grow" id="tnew" placeholder="Quick add (press N)"><button data-a="tadd">Add</button></div><p class="small muted">One-time tasks stay in this day's history. Recurring tasks are in Settings.</p></section>`}
function learn(d){const L=S.routine.filter(r=>r.kind&&r.days.includes(wd(view)));const fm=d.focus.reduce((a,f)=>a+(f.mins||0),0);
 return `<section class="card"><h2>Learning tracker</h2>`+L.map(r=>{const m=mins(view,r.id),run=S.timer&&S.timer.id===r.id?el(S.timer)/60000:0,p=r.dur?Math.min(1,(m+run)/r.dur):0,ss=(d.sess&&d.sess[r.id])||[],n=r.split||1;
 return `<div class="row"><div class="grow"><b>${e(r.name)}</b> <span class="small">${m} / ${r.dur} min (${Math.round(p*100)}%)</span><div class="bar"><i style="width:${p*100}%"></i></div>
 <div class="small">Sessions ${ss.length}/${n} · about ${Math.round(r.dur/n)} min each ${ss.map(x=>`<span class="tag">${x} min</span>`).join(' ')}</div>
 <div class="small">${tUI(r)} Recorded min: <input type="number" min="0" max="900" style="width:70px" value="${m}" data-f="min:${r.id}"></div>
 ${r.id==='quran'?`<div class="small">Pages: from <input type="number" min="0" style="width:70px" value="${e(d.q.from)}" data-f="qf"> to <input type="number" min="0" style="width:70px" value="${e(d.q.to)}" data-f="qt"> (target about 2)</div>`:''}
 ${r.id==='english'?`<input style="width:100%" placeholder="Studied: vocabulary, grammar, listening, speaking, lesson…" value="${e(d.log.english)}" data-f="log:english">`:''}</div></div>`}).join('')
 +`<div class="row"><b>Main focus</b><span class="small">${d.focus.filter(f=>f.done).length}/${d.focus.length} done · ${fm} min</span></div><h2 style="margin-top:10px">Qur'an week</h2>`+weekDots()+`</section>`}
function weekDots(){let h='';for(let i=6;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);const k=key(x),q=S.routine.find(r=>r.id==='quran'),ok=S.days[k]&&q&&(S.days[k].done.quran||mins(k,'quran')>=q.dur);h+=`<span class="dot ${ok?'y':''}" title="${k}">${'SMTWTFS'[x.getDay()]}</span>`}return h}
function care(d){return `<section class="card"><h2>♥ Breaks &amp; self-care</h2>`+S.care.map((c,i)=>`<div class="row"><input class="chk" type="checkbox" data-a="ctog" data-i="${i}" ${d.care[c]?'checked':''}><span class="grow">${e(c)}</span></div>`).join('')+`<p class="small muted">Edit this list in Settings.</p></section>`}
function notes(d){return `<section class="card"><h2>Notes &amp; reminders</h2><textarea data-f="notes" aria-label="notes">${e(d.notes)}</textarea>
 <h2 style="margin-top:10px">Daily reflection <span class="small muted">(optional)</span></h2><details><summary>Open reflection</summary>
 ${[['did','What I accomplished'],['learned','What I learned'],['well','What went well'],['improve','What to improve tomorrow'],['plan','Tomorrow\'s priorities']].map(([k,l])=>`<label class="small">${l}<textarea data-f="refl:${k}">${e(d.refl[k])}</textarea></label>`).join('')}
 <div class="small">Mood: ${['😄','🙂','😐','😕','😞'].map((m,i)=>`<button class="${d.mood===i?'on':'ghost'}" data-a="mood" data-i="${i}">${m}</button>`).join('')}</div>
 <div class="small" style="margin-top:6px">Energy: ${[1,2,3,4,5].map(i=>`<button class="${d.energy===i?'on':'ghost'}" data-a="energy" data-i="${i}">${i}</button>`).join('')}</div></details></section>`}
function today(){const d=D(),p=pct(view),L=rFor(view);
 return `${view!==key()?`<div class="banner">Reviewing ${view} — edits are saved to that day. <button class="ghost" style="color:#fff" data-a="back">Back to today</button></div>`:''}
 <div class="grid">${goals(d)}${top3(d)}${learn(d)}${sched()}${todos(d)}${care(d)}${notes(d)}</div><div class="strip"><span class="script">better than yesterday ♥</span>${ART.books}</div>`}
function focusPage(){const d=D();const r=S.timer?taskById(S.timer.id,S.timer.date):rFor(view).find(x=>!d.done[x.id]&&x.dur>0);
 if(!r)return `<section class="card"><h2>Nothing with a timer left ♥</h2><p><button data-a="fs">Start focus on my #1 priority</button></p></section>`;
 const t=S.timer&&S.timer.id===r.id?el(S.timer):0,tgt=(r.dur||25)*60000;
 return `<section class="card big" style="text-align:center"><h2>${e(r.name)}</h2>${ringHTML(Math.min(1,t/tgt),`<span class="tm" data-tm="${r.id}">${fmt(t)}</span>`)}<p>${tUI(r)}</p><p class="small">Target ${r.dur||25} min</p></section>`}
function history(){const days=[],ks=[];for(let i=13;i>=0;i--){const x=new Date();x.setDate(x.getDate()-i);ks.push(key(x))}
 const mk=key().slice(0,7),mkeys=Object.keys(S.days).filter(k=>k.startsWith(mk));
 const avg=mkeys.length?Math.round(mkeys.reduce((s,k)=>s+pct(k),0)/mkeys.length*100):0;
 return `<div class="grid"><section class="card"><h2>Consistency</h2><p>Streak: <b>${streak()} day(s)</b> (a day counts at ≥70% of routine) · This month avg: <b>${avg}%</b></p>
 <div class="chart">${ks.slice(7).map(k=>`<div style="height:${Math.max(3,pct(k)*100)}%">${Math.round(pct(k)*100)}</div>`).join('')}</div><p class="small muted">Last 7 days</p></section>
 <section class="card"><h2>Review a day</h2><input type="date" value="${view}" data-f="goto"> <p class="small muted">Open any date to view or correct it.</p>`
 +ks.reverse().map(k=>{const missed=rFor(k).filter(r=>!(S.days[k]&&S.days[k].done[r.id])).length;return `<div class="row"><a href="#" data-a="goto" data-i="${k}">${k}</a><span class="grow"><div class="bar"><i style="width:${pct(k)*100}%"></i></div></span><span class="small">${Math.round(pct(k)*100)}% ${S.days[k]&&missed?'· '+missed+' left for another day':''}</span></div>`}).join('')
 +`</section></div>`}
function settings(){const s=S.settings,c=s.colors||{};
 return `<div class="grid"><section class="card"><h2>App</h2>${[['startup','Launch when I sign in to Windows'],['onTop','Always on top'],['quiet','Quiet mode (no notifications)'],['compact','Compact side window']].filter(x=>!window.api.web||x[0]==='quiet').map(([k,l])=>`<div class="row"><input class="chk" type="checkbox" data-a="set" data-i="${k}" ${s[k]?'checked':''}><span>${l}</span></div>`).join('')}
 <p><button data-a="export">Export backup (JSON)</button> <label class="small">Import backup <input type="file" accept=".json,application/json" data-f="imp"></label></p>${window.api.web?'<p><button data-a="notif">Enable notifications</button></p><p class="small muted">Phone reminders only fire while the app is open. See README.</p>':''}<p class="small muted" id="dp"></p></section>
 <section class="card"><h2>Colors</h2>${[['rose','Dusty rose'],['cherry','Cherry'],['burg','Burgundy']].map(([k,l])=>`<div class="row"><input type="color" value="${e(c[k]||'#000000')}" data-f="col:${k}" aria-label="${l}"><span>${l}</span></div>`).join('')}<button class="ghost" data-a="colreset">Reset colors</button></section>
 <section class="card" style="grid-column:1/-1"><h2>Routine (recurring)</h2>`+S.routine.map((r,i)=>`<div class="row" data-drop="routine" data-ri="${i}">${hd('routine',i)}<input value="${e(r.name)}" data-f="rn:${i}:name" aria-label="name"><input type="time" value="${e(r.time)}" data-f="rn:${i}:time" aria-label="time"><input type="number" min="0" max="600" style="width:70px" value="${r.dur}" data-f="rn:${i}:dur" aria-label="minutes">min
 ${r.kind?`<input type="number" min="1" max="8" style="width:55px" value="${r.split||1}" data-f="rn:${i}:split" aria-label="sessions">sessions`:''}
 <label class="small"><input type="checkbox" ${r.remind?'checked':''} data-f="rn:${i}:remind"> remind at</label><input type="time" value="${e(r.rtime||'')}" data-f="rn:${i}:rtime" title="Blank = task time" aria-label="reminder time">
 ${A.map(x=>`<label class="small"><input type="checkbox" ${r.days.includes(x)?'checked':''} data-f="rn:${i}:day${x}">${'SMTWTFS'[x]}</label>`).join('')}<button class="ghost" data-a="rdel" data-i="${i}">✕</button></div>`).join('')
 +`<div class="row"><button data-a="radd">Add recurring task</button></div></section>
 <section class="card"><h2>Self-care list</h2>`+S.care.map((c,i)=>`<div class="row" data-drop="care" data-ri="${i}">${hd('care',i)}<input class="grow" value="${e(c)}" data-f="cn:${i}"><button class="ghost" data-a="cdel" data-i="${i}">✕</button></div>`).join('')+`<div class="row"><input class="grow" id="cnew" placeholder="new item"><button data-a="cadd">Add</button></div></section></div>`}
function render(){const a=document.activeElement&&document.activeElement.id;const n=new Date(),p=pct(view);
 document.getElementById('app').innerHTML=`<header><div style="display:flex;gap:10px;align-items:center">${ART.cherry}<div><h1>Study, Grow &amp; Bloom</h1><div class="script">${QUOTES[n.getMinutes()%QUOTES.length]}</div></div></div>
 <div><b>${n.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</b> <span class="tm" id="clock"></span><br><span class="small">${view===key()?'':'viewing '+view}</span></div>${ringHTML(p)}</header>
 <nav>${[['today','Today'],['focus','Focus (F)'],['history','History'],['settings','Settings']].map(([k,l])=>`<button class="${page===k?'on':'ghost'}" data-a="page" data-i="${k}">${l}</button>`).join('')}<button class="ghost" data-a="day">Start my day</button><button class="ghost" data-a="plan">Plan tomorrow</button></nav>${msg?`<div class="banner">${e(msg)}</div>`:''}
 ${{today,focus:focusPage,history,settings}[page]()}`;
 if(page==='settings')window.api.dataPath().then(p=>{const x=document.getElementById('dp');if(x)x.textContent='Data file: '+p});
 tick();if(a){const x=document.getElementById(a);x&&x.focus()}}
function tick(){const c=document.getElementById('clock');if(c)c.textContent=new Date().toLocaleTimeString();
 document.querySelectorAll('[data-tm]').forEach(x=>x.textContent=fmt(el(S.timer)))}
const act={
 page(i){page=i;msg='';render()},back(){view=key();render()},goto(i){view=i;page='today';render()},
 tog(i){const d=D();d.done[i]=!d.done[i];save();render()},
 start(i){if(S.timer){msg='Finish or discard the running timer first.';return render()}S.timer={id:i,date:view,acc:0,at:Date.now()};save();render()},
 pause(){S.timer.acc=el(S.timer);S.timer.at=null;save();render()},resume(){S.timer.at=Date.now();save();render()},
 finish(){const t=S.timer,m=Math.round(el(t)/60000),task=taskById(t.id,t.date),d=D(t.date);
  if(t.id.startsWith('f:')){if(task)task.f.mins=(task.f.mins||0)+m}
  else{d.mins[t.id]=(d.mins[t.id]||0)+m;d.sess=d.sess||{};d.sess[t.id]=[...(d.sess[t.id]||[]),m];if(task&&task.dur&&d.mins[t.id]>=task.dur)d.done[t.id]=true}
  S.timer=null;msg=`Saved ${m} min.`;save();render()},
 fs(){const d=D(key()),t=(d.top.find(x=>x.trim())||'').trim();if(!t){msg='Add a top priority first.';return render()}if(S.timer){msg='Finish or discard the running timer first.';return render()}
  view=key();let i=d.focus.findIndex(f=>f.t===t);if(i<0){d.focus.push({t,done:false,mins:0,dur:25});i=d.focus.length-1}S.timer={id:'f:'+i,date:key(),acc:0,at:Date.now()};page='focus';save();render()},
 notif(){if(!('Notification'in window)){msg='This browser does not support notifications.';return render()}Notification.requestPermission().then(p=>{msg=p==='granted'?'Notifications enabled (they fire while the app is open).':'Notifications are blocked in browser settings.';render()})},
 colreset(){S.settings.colors=DEF().settings.colors;for(const k of['rose','cherry','burg'])document.documentElement.style.removeProperty('--'+k);save();render()},
 discard(){if(confirm('Discard this session? Elapsed time will not be saved.')){S.timer=null;save();render()}},
 fadd(){const v=document.getElementById('fnew').value.trim();if(v){D().focus.push({t:v,done:false,mins:0,dur:0});save();render()}},
 ftog(i){const f=D().focus[i];f.done=!f.done;save();render()},fdel(i){if(S.timer&&S.timer.id.startsWith('f:')){msg='Finish the running focus timer first.';return render()}D().focus.splice(i,1);save();render()},
 tadd(){const v=document.getElementById('tnew').value.trim();if(v){D().todos.push({t:v,done:false,pri:'med',due:''});save();render();document.getElementById('tnew').focus()}},
 ttog(i){const t=D().todos[i];t.done=!t.done;save();render()},tdel(i){D().todos.splice(i,1);save();render()},
 tup(i){const t=D().todos;if(i>0){[t[i-1],t[i]]=[t[i],t[i-1]];save();render()}},
 ctog(i){const d=D(),c=S.care[i];d.care[c]=!d.care[c];save();render()},
 mood(i){D().mood=+i;save();render()},energy(i){D().energy=+i;save();render()},
 set(k){S.settings[k]=!S.settings[k];const o={};o[k==='startup'?'startup':k]=S.settings[k];window.api.win(o);save();render()},
 radd(){S.routine.push({id:'r'+Date.now(),name:'New task',time:'',dur:30,pri:'med',note:'',remind:false,days:A});save();render()},
 rdel(i){if(confirm('Delete this recurring task? Past history is kept.')){S.routine.splice(i,1);save();render()}},
 cadd(){const v=document.getElementById('cnew').value.trim();if(v){S.care.push(v);save();render()}},cdel(i){S.care.splice(i,1);save();render()},
 day(){page='today';render();const r=rFor(key()).slice(0,3);msg='Morning routine: '+r.map(x=>x.name).join(' → ');render()},
 plan(){page='today';const t=new Date();t.setDate(t.getDate()+1);view=key(t);msg='Planning tomorrow — set priorities and tasks.';render()},
 export(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download=`planner-backup-${key()}.json`;a.click()}};
document.addEventListener('click',ev=>{const t=ev.target.closest('[data-a]');if(!t)return;if(t.tagName==='A')ev.preventDefault();act[t.dataset.a]&&act[t.dataset.a](t.dataset.i)});
document.addEventListener('change',ev=>{const t=ev.target,f=t.dataset.f;if(!f)return;if(f==='imp'){const fl=t.files&&t.files[0];if(fl)fl.text().then(x=>{try{const j=JSON.parse(x);if(!j||!Array.isArray(j.routine)||typeof j.days!=='object')throw 0;if(confirm('Replace ALL current data with this backup?'))window.api.save(j).then(()=>location.reload())}catch{msg='That file is not a valid planner backup.';render()}});return}const [k,a,b]=f.split(':'),d=D(),v=t.type==='checkbox'?t.checked:t.value;
 const R=id=>S.routine.find(r=>r.id===id);
 if(k==='top')d.top[a]=v;else if(k==='notes')d.notes=v;else if(k==='refl')d.refl[a]=v;else if(k==='log')d.log[a]=v;
 else if(k==='qf')d.q.from=v;else if(k==='qt')d.q.to=v;
 else if(k==='ftxt')d.focus[a].t=v;else if(k==='ttxt')d.todos[a].t=v;else if(k==='tdue')d.todos[a].due=v;else if(k==='tpri')d.todos[a].pri=v;
 else if(k==='rnote')R(a).note=v;else if(k==='rpri')R(a).pri=v;else if(k==='cn')S.care[a]=v;
 else if(k==='min'){const m=Math.max(0,Math.min(900,parseInt(v)||0));d.mins[a]=m;const r=R(a);if(r&&r.dur)d.done[a]=m>=r.dur}
 else if(k==='fdur')d.focus[a].dur=Math.max(0,Math.min(600,parseInt(v)||0));else if(k==='col'){S.settings.colors[a]=v;applyColors()}
 else if(k==='goto'){if(v){view=v;}}
 else if(k==='rn'){const r=S.routine[a];if(b==='name')r.name=v.trim()||r.name;else if(b==='time')r.time=v;else if(b==='dur')r.dur=Math.max(0,Math.min(600,parseInt(v)||0));else if(b==='remind')r.remind=v;else if(b==='rtime')r.rtime=v;else if(b==='split')r.split=Math.max(1,Math.min(8,parseInt(v)||1));
  else if(b.startsWith('day')){const x=+b.slice(3);r.days=v?[...new Set([...r.days,x])]:r.days.filter(y=>y!==x)}}
 save();render()});
document.addEventListener('dragstart',ev=>{const h=ev.target.closest&&ev.target.closest('[data-dl]');if(h){drag={l:h.dataset.dl,i:+h.dataset.di};ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain','x')}});
document.addEventListener('dragover',ev=>{if(drag&&ev.target.closest&&ev.target.closest('[data-drop]'))ev.preventDefault()});
document.addEventListener('drop',ev=>{const r=ev.target.closest&&ev.target.closest('[data-drop]');if(!drag||!r||r.dataset.drop!==drag.l)return;ev.preventDefault();
 if(drag.l==='focus'&&S.timer&&S.timer.id.startsWith('f:')){drag=null;msg='Finish the running focus timer before reordering.';return render()}
 const L={todos:()=>D().todos,focus:()=>D().focus,routine:()=>S.routine,care:()=>S.care}[drag.l](),to=+r.dataset.ri,[x]=L.splice(drag.i,1);L.splice(to,0,x);drag=null;save();render()});
document.addEventListener('keydown',ev=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
 if(ev.key==='Enter'&&['tnew','fnew','cnew'].includes(document.activeElement.id))act[{tnew:'tadd',fnew:'fadd',cnew:'cadd'}[document.activeElement.id]]();
 if(typing)return;if(ev.key==='n'){ev.preventDefault();page='today';render();document.getElementById('tnew').focus()}
 if(ev.key==='f'){page=page==='focus'?'today':'focus';render()}});
(async()=>{let raw=null;try{raw=await window.api.load()}catch{}
 const base=DEF();S=(raw&&typeof raw==='object')?Object.assign(base,raw):base;
 if(!Array.isArray(S.routine)||!S.routine.length||!S.routine.every(r=>r&&typeof r==='object'&&r.id))S.routine=DEF().routine;
 S.routine.forEach(r=>{r.days=Array.isArray(r.days)?r.days:A;r.dur=Math.max(0,+r.dur||0)});
 if(!Array.isArray(S.care))S.care=DEF().care;if(!S.days||typeof S.days!=='object')S.days={};S.settings=Object.assign(DEF().settings,S.settings);S.settings.colors=Object.assign(DEF().settings.colors,S.settings.colors);if(S.timer&&(typeof S.timer!=='object'||!S.timer.id))S.timer=null;
 D(key());applyColors();save();window.api.win({onTop:S.settings.onTop,startup:S.settings.startup});
 render();setInterval(tick,1000);
 setInterval(()=>{if(key()!==cur){const was=view===cur;cur=key();D(cur);if(was)view=cur;save();render()}},20000);})();
