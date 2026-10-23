(()=>{const K='planner-data-v1',pad=n=>String(n).padStart(2,'0'),fired=new Set();
window.api={web:true,
 load:async()=>{try{return JSON.parse(localStorage.getItem(K))}catch{return null}},
 save:async s=>{try{localStorage.setItem(K,JSON.stringify(s));return true}catch{return false}},
 win:async()=>true,dataPath:async()=>'Stored on this device in the browser (localStorage). Export backups regularly.'};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
setInterval(async()=>{
 if(!('Notification'in window)||Notification.permission!=='granted')return;
 let s;try{s=JSON.parse(localStorage.getItem(K))}catch{return}
 if(!s||!Array.isArray(s.routine)||(s.settings&&s.settings.quiet))return;
 const n=new Date(),k=`${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`,hm=`${pad(n.getHours())}:${pad(n.getMinutes())}`,day=(s.days||{})[k]||{done:{}};
 for(const r of s.routine){
  if(!r.remind||(r.rtime||r.time)!==hm||!(r.days||[]).includes(n.getDay())||(day.done||{})[r.id])continue;
  const id=k+r.id+hm;if(fired.has(id))continue;fired.add(id);
  const o={body:r.note||`Scheduled for ${r.time}`,icon:'icon-192.png',tag:id};
  try{const reg=await navigator.serviceWorker.getRegistration();reg?reg.showNotification(r.name,o):new Notification(r.name,o)}catch{}}
},15000)})();
