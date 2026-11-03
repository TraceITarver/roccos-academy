// ===== Health & Care, Ask Rocco, Breed tips, Behavior tracker =====
const CARE_T={vet:["🩺","Vet visit",365],vaccine:["💉","Vaccine",365],flea:["🪲","Flea & tick med",30],heart:["❤️","Heartworm med",30],groom:["✂️","Grooming",42],nails:["💅","Nail trim",21],other:["📌","Other",30]};
const todayISO=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const daysUntil=iso=>Math.round((new Date(iso+"T00:00")-new Date(todayISO()+"T00:00"))/864e5);
const careList=()=>(S.care=S.care||[]).slice().sort((a,b)=>a.due<b.due?-1:1);
const dueTxt=n=>n<0?`<span class="badge" style="background:#ffe0dc;color:#b3261e">Overdue ${-n}d</span>`:n==0?`<span class="badge b1">Today</span>`:`<span class="badge b0">in ${n}d</span>`;
const FREE_CARE=1;
function careAdd(){const c=S.care=S.care||[];if(!isPlus()&&c.length>=FREE_CARE){location.hash="paywall";return}
 const ty=$("#ct").value,t=$("#cn").value.trim()||CARE_T[ty][1],due=$("#cd").value||todayISO(),ev=Math.max(0,parseInt($("#ce").value)||0);
 c.push({id:"c"+Date.now(),type:ty,title:t,due,every:ev});save();careSchedule();toast("Reminder added 🐾");render()}
function careDone(id){const r=(S.care||[]).find(x=>x.id==id);if(!r)return;r.last=todayISO();
 if(r.every>0){const d=new Date(todayISO()+"T00:00");d.setDate(d.getDate()+r.every);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());r.due=d.toISOString().slice(0,10);toast("Done! Next due "+r.due)}else{S.care=S.care.filter(x=>x!=r);toast("Done ✅")}save();careSchedule();render()}
function careDel(id){S.care=(S.care||[]).filter(x=>x.id!=id);save();careSchedule();render()}
function careCty(){const t=$("#ct").value;$("#ce").value=CARE_T[t][2]}
const nid=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return 1000+Math.abs(h)%2e9};
// Native (Capacitor LocalNotifications) when available; web Notification API otherwise
async function careSchedule(){const items=careList();
 if(NATIVE&&PL.LocalNotifications){const LN=PL.LocalNotifications;try{const p=await LN.getPending();const old=(p.notifications||[]).filter(n=>n.id>=1000);if(old.length)await LN.cancel({notifications:old.map(n=>({id:n.id}))});
  const ns=items.filter(r=>daysUntil(r.due)>=0).map(r=>({id:nid(S.id+r.id),title:"Rocco's Academy 🐾",body:`${CARE_T[r.type][1]} for ${dogName()}: ${r.title} is due today`,schedule:{at:new Date(r.due+"T09:00"),allowWhileIdle:true}}));if(ns.length)await LN.schedule({notifications:ns})}catch(e){}return}
 careNotifyWeb()}
async function careEnableNotif(){if(NATIVE&&PL.LocalNotifications){const p=await PL.LocalNotifications.requestPermissions();toast(p.display=="granted"?"Notifications on":"Allow notifications in Settings");careSchedule();return}
 if(!("Notification" in window)){toast("This browser can't show notifications. Add the app to your Home Screen.");return}
 const p=await Notification.requestPermission();toast(p=="granted"?"Notifications on 🔔":"Notifications blocked");if(p=="granted"){localStorage.removeItem("roccos-care-notified");careNotifyWeb()}render()}
async function careNotifyWeb(){if(!("Notification" in window)||Notification.permission!="granted")return;const k="roccos-care-notified",day=todayISO();if(localStorage.getItem(k)==day)return;
 const due=careList().filter(r=>daysUntil(r.due)<=0);if(!due.length)return;localStorage.setItem(k,day);
 const body=due.map(r=>`${CARE_T[r.type][0]} ${r.title} ${daysUntil(r.due)<0?"(overdue)":"(today)"}`).join("\n"),o={body,icon:"icon-192.png",tag:"care"};
 try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg&&reg.showNotification)reg.showNotification(dogName()+"'s care reminders",o);else new Notification(dogName()+"'s care reminders",o)}catch(e){}}
V.health=()=>{const c=careList(),can=isPlus()||c.length<FREE_CARE,np=("Notification" in window)?Notification.permission:"na";
 return `<h2>🩺 Health & Care</h2>${roccoTip(`Keep ${esc(dogName())}'s vet visits, meds and grooming on track. I'll flag anything due on Home.`)}`+
 (c.length?c.map(r=>`<div class="card lesson"><div class="ic">${CARE_T[r.type][0]}</div><div class="grow"><h3>${esc(r.title)}</h3><small>Due ${r.due}${r.every?` · every ${r.every} days`:" · one time"}</small></div><div style="text-align:right">${dueTxt(daysUntil(r.due))}<div style="margin-top:6px;display:flex;gap:6px"><button class="ghost" style="padding:8px 10px" onclick="careDone('${r.id}')">✓ Done</button><button class="ghost" style="padding:8px 10px" aria-label="Delete" onclick="careDel('${r.id}')">🗑️</button></div></div></div>`).join(""):`<div class="card muted">No reminders yet.</div>`)+
 (can?`<div class="card"><b>Add a reminder</b><label style="display:block;margin-top:8px">Type</label><select id="ct" onchange="careCty()">${Object.entries(CARE_T).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join("")}</select><label>Name (optional)</label><input id="cn" placeholder="e.g. Rabies booster, NexGard"><label>Next due date</label><input id="cd" type="date" value="${todayISO()}"><label>Repeat every (days, 0 = once)</label><input id="ce" type="number" min="0" value="365"><button style="width:100%" onclick="careAdd()">＋ Add reminder</button>${isPlus()?"":`<p class="muted" style="margin:8px 0 0">Free includes ${FREE_CARE} reminder. Plus: unlimited.</p>`}</div>`:lockCard("Unlimited care reminders"))+
 `<div class="card"><b>🔔 Notifications</b><p class="muted">${NATIVE?"Get a notification at 9:00 AM on each due date.":np=="granted"?"On. You'll get a notification when you open the app on a due day.":"Turn on to get a heads-up when something is due."}</p>${np!="granted"||NATIVE?`<button class="ghost" style="width:100%" onclick="careEnableNotif()">Turn on notifications</button>`:""}</div><p class="muted">Reminders only — always follow your vet's schedule.</p>`};
// ===== Behavior tracker =====
const BEH={barking:"🗣️ Barking",pulling:"🦮 Pulling",jumping:"🦘 Jumping",accidents:"💧 Accidents",chewing:"🦴 Chewing",reactivity:"⚡ Reactivity",whining:"😢 Whining"};
const BCOL={barking:"#ff7a59",pulling:"#5b8def",jumping:"#f5b82e",accidents:"#3bb07a",chewing:"#a06cd5",reactivity:"#e4473e",whining:"#6bb5c9"};
let BS={k:"barking",v:3};
function behPick(k){BS.k=k;document.querySelectorAll("#bk .chip").forEach(b=>b.classList.toggle("sel",b.dataset.k==k))}
function behInt(v){BS.v=v;document.querySelectorAll("#bi .chip").forEach(b=>b.classList.toggle("sel",+b.dataset.v==v))}
function behLog(){const n=$("#bn").value.trim();(S.beh=S.beh||[]).push({k:BS.k,v:BS.v,n,at:Date.now()});save();toast("Logged "+BEH[BS.k].split(" ")[1]);$("#bn").value="";render()}
const wkIdx=t=>Math.floor((Date.now()-t)/(7*864e5)); // 0 = this week
function behWeeks(k){const w=[0,0,0,0];(S.beh||[]).forEach(e=>{const i=wkIdx(e.at);if(i<4&&(!k||e.k==k))w[3-i]+=e.v});return w}
function behImprove(k){const w=behWeeks(k),first=w.find(x=>x>0);if(first==null)return null;const fi=w.indexOf(first);if(fi==3)return null;return Math.round((first-w[3])/first*100)}
function behChart(){const keys=Object.keys(BEH).filter(k=>behWeeks(k).some(x=>x));if(!keys.length)return `<p class="muted">Log a few behaviors to see your trend.</p>`;
 const W=340,H=170,pl=28,pb=22,max=Math.max(1,...keys.flatMap(behWeeks)),x=i=>pl+i*(W-pl-10)/3,y=v=>H-pb-v/max*(H-pb-10);
 let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="4-week behavior trend">`;[0,.5,1].forEach(f=>{const yy=y(max*f);s+=`<line x1="${pl}" x2="${W-6}" y1="${yy}" y2="${yy}" stroke="#eee"/><text x="${pl-6}" y="${yy+4}" font-size="10" text-anchor="end" fill="#999">${Math.round(max*f)}</text>`});
 ["3 wks ago","2 wks ago","Last wk","This wk"].forEach((t,i)=>s+=`<text x="${x(i)}" y="${H-6}" font-size="10" text-anchor="middle" fill="#999">${t}</text>`);
 keys.forEach(k=>{const w=behWeeks(k);s+=`<polyline fill="none" stroke="${BCOL[k]}" stroke-width="3" stroke-linejoin="round" points="${w.map((v,i)=>x(i)+","+y(v)).join(" ")}"/>`+w.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${BCOL[k]}"/>`).join("")});
 return s+`</svg><div class="chips" style="margin-top:6px">${keys.map(k=>{const p=behImprove(k);return `<span class="chip" style="border-left:4px solid ${BCOL[k]}">${BEH[k]}${p==null?"":` · ${p>=0?"▼ "+p+"% better":"▲ "+(-p)+"% worse"}`}</span>`}).join("")}</div>`}
V.behavior=()=>{const L=S.beh||[],wk=L.filter(e=>wkIdx(e.at)==0),tot=behImprove();
 return `<h2>📊 Behavior tracker</h2>${roccoTip("Log it the moment it happens. Score is intensity (1 = mild, 5 = intense) — watch the trend, not single days.")}`+
 `<div class="card"><b>Quick log</b><div class="chips" id="bk" style="margin:8px 0">${Object.entries(BEH).map(([k,t])=>`<button class="chip ${BS.k==k?"sel":""}" data-k="${k}" onclick="behPick('${k}')">${t}</button>`).join("")}</div><label>Count / intensity</label><div class="chips" id="bi" style="margin:4px 0 8px">${[1,2,3,4,5].map(v=>`<button class="chip ${BS.v==v?"sel":""}" data-v="${v}" onclick="behInt(${v})">${v}</button>`).join("")}</div><input id="bn" placeholder="Note (optional): what triggered it?"><button style="width:100%" onclick="behLog()">＋ Log behavior</button></div>`+
 `<div class="card"><b>This week</b>${wk.length?`<div class="chips" style="margin-top:8px">${Object.keys(BEH).filter(k=>wk.some(e=>e.k==k)).map(k=>`<span class="chip">${BEH[k]} × ${wk.filter(e=>e.k==k).length}</span>`).join("")}</div>`:`<p class="muted">Nothing logged this week yet.</p>`}</div>`+
 (isPlus()?`<div class="card"><b>4-week trend</b>${tot!=null?`<p style="margin:6px 0"><b style="font-size:22px;color:${tot>=0?"var(--g)":"#b3261e"}">${tot>=0?tot+"% improvement":(-tot)+"% increase"}</b> <span class="muted">overall vs. first tracked week</span></p>`:""}${behChart()}</div><h2>History</h2>`+(L.length?L.slice().reverse().slice(0,50).map(e=>`<div class="log"><b>${BEH[e.k]}</b> · ${e.v}/5 <span class="muted">${new Date(e.at).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span>${e.n?`<div>${esc(e.n)}</div>`:""}</div>`).join(""):`<p class="muted">No entries yet.</p>`):lockCard("4-week trend chart, improvement % & full history"))};
// ===== Breed tips =====
function breedCard(full){const b=BRD(S.dog.breed);if(!b)return full?`<div class="card"><b>🧬 Breed tips</b><p class="muted">Pick ${esc(dogName())}'s breed in the profile below to get tips.</p></div>`:"";
 return `<div class="card"><b>🧬 ${b[0]} tips</b><p style="margin:6px 0">${ENERGY[b[1]]} energy · ${b[2]}</p>${full?`<b>Common challenges</b><ul>${b[3].map(x=>`<li>${x}</li>`).join("")}</ul><b>Rocco's tips</b><ul>${b[4].map(x=>`<li>${x}</li>`).join("")}</ul>`:""}${b[5].length?`<p class="muted" style="margin:6px 0 4px">Helpful fixes for this breed:</p><div class="chips">${b[5].map(id=>{const p=PROBLEMS.find(x=>x.id==id);return p?`<a class="chip" href="#fix/${id}" style="text-decoration:none">${p.icon} ${p.title}</a>`:""}).join("")}</div>`:""}</div>`}
const f_profile=V.profile;V.profile=a=>{let h=f_profile(a);h=h.replace(/(<input[^>]*id="db"[^>]*)>/,`$1 list="breedlist" autocomplete="off"><datalist id="breedlist">${BREEDS.map(b=>`<option value="${b[0]}">`).join("")}</datalist>`);return h.replace(/(<h2>My dogs<\/h2><div class="card">[\s\S]*?<\/div><\/div>)/,`$1`+breedCard(true))};
const f_plan=V.plan;V.plan=a=>{const b=BRD(S.dog.breed),h=f_plan(a);if(!b||!S.plan)return h;
 const tip=`<div class="card"><b>🧬 Tailored for a ${b[0]}</b><p class="muted" style="margin:6px 0">${b[1]==3?"High energy: add a 10-minute sniff walk or fetch before each session.":b[1]==1?"Lower energy: keep sessions to 2–3 minutes and stop while they're keen.":"Mix short sessions with play breaks."}</p>${b[5].filter(id=>!(S.fixes||[]).includes(id)).slice(0,3).map(id=>{const p=PROBLEMS.find(x=>x.id==id);return p?`<button class="chip" style="margin:3px" onclick="addFix('${id}')">＋ ${p.icon} ${p.title}</button>`:""}).join("")}</div>`;return tip+h};
// ===== Ask Rocco =====
let ASK_BUSY=0;const ASK_FREE=3,ASKK="roccos-ask-count";
const askUsed=()=>{const o=JSON.parse(localStorage.getItem(ASKK)||"{}");return o.d==todayISO()?o.n:0};
const askBump=()=>localStorage.setItem(ASKK,JSON.stringify({d:todayISO(),n:askUsed()+1}));
const HEALTH_RE=/\b(vomit|throw(ing)? up|diarrh|blood|limp|sick|ill|fever|letharg|not eating|won'?t eat|poison|ate (a |some )?(chocolate|grape|xylitol)|seizure|cough|itch|rash|lump|vaccin|medic|pain|injur|bleed|vet)\w*/i;
const AGG_RE=/\b(bite|bit|bites|biting|aggress\w*|growl\w*|snap\w*|attack\w*|lunge\w*|guarding)\b/i;
const pupAge=()=>{const a=(S.dog.age||"").toLowerCase(),n=parseFloat(a)||0;if(/week|wk/.test(a))return"puppy";if(/month|mo/.test(a))return n<=6?"puppy":n<18?"teen":"adult";if(n&&n>=8)return"senior";if(n&&n<1)return"puppy";return n?(n<1.5?"teen":"adult"):(S.quiz&&S.quiz.age)||""};
function askLocal(q){const t=q.toLowerCase(),nm=esc(dogName()),b=BRD(S.dog.breed),age=pupAge(),out=[];let links=[];
 const health=HEALTH_RE.test(t),agg=AGG_RE.test(t);
 if(health)out.push(`<div class="card" style="border:2px solid #f5b82e"><b>⚠️ Health first</b><p style="margin:6px 0">I'm a training coach, not a vet. If ${nm} seems sick, hurt, or ate something toxic, call your vet or an emergency animal hospital right away. (ASPCA Poison Control: 888-426-4435.)</p></div>`);
 if(agg)out.push(`<div class="card" style="border:2px solid #f5b82e"><b>⚠️ Safety note</b><p style="margin:6px 0">Bites and aggression can come from pain or fear. Please get a vet check and work with a certified behavior professional (CAAB, DACVB or IAABC). Until then, manage: avoid triggers and never punish growling — it's a warning.</p></div>`);
 const p=matchProblem(t);
 const lw=LESSONS.map(l=>{let s=0;const ws=(l.id+" "+l.title).toLowerCase().split(/[^a-z]+/).filter(w=>w.length>2);ws.forEach(w=>{if(new RegExp("\\b"+w).test(t))s+=2});if(t.includes(l.id))s+=2;return[l,s]}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
 const pr=PROGRAMS.find(x=>t.includes(x.id)||x.title.toLowerCase().split(" ").some(w=>w.length>4&&t.includes(w)));
 if(p){out.push(`<p><b>${p.icon} ${p.title}</b> — here's my take for ${nm}${b?` (${b[0]})`:""}.</p><p><b>Why it happens:</b> ${p.causes.slice(0,2).join(" ")}</p><p><b>What to do:</b></p><ol>${(p.plan||[]).slice(0,4).map(x=>`<li>${Array.isArray(x)?x.join(": "):x}</li>`).join("")}</ol>${p.avoid&&p.avoid[0]?`<p><b>Avoid:</b> ${p.avoid[0]}</p>`:""}`);links.push(...p.lessons.map(id=>LESSONS.find(l=>l.id==id)).filter(Boolean));out.push(`<p><a href="#fix/${p.id}">Open the full ${p.title} guide →</a></p>`)}
 else if(lw.length){const l=lw[0][0];out.push(`<p>Let's teach <b>${l.title}</b> to ${nm}:</p><ol>${l.steps.slice(0,5).map(s=>`<li>${s}</li>`).join("")}</ol>${l.tips&&l.tips[0]?`<p>💡 ${l.tips[0]}</p>`:""}`);links.push(...lw.slice(0,3).map(x=>x[0]))}
 else if(/breed|energy|exercise|how much/.test(t)&&b){out.push(`<p>${b[0]}s: ${ENERGY[b[1]]} energy. ${b[2]}</p><ul>${b[4].map(x=>`<li>${x}</li>`).join("")}</ul>`)}
 else if(/start|begin|first|new (dog|puppy)|what should i teach/.test(t)){out.push(`<p>Great place to start with ${nm}: Name Recognition, then Sit, then Come. Keep sessions 3–5 minutes, a few times a day.</p>`);links.push(...["name","sit","come"].map(id=>LESSONS.find(l=>l.id==id)).filter(Boolean))}
 if(pr)out.push(`<p>📚 The <a href="#program/${pr.id}">${pr.icon} ${pr.title}</a> program walks you through this day by day.</p>`);
 if(age=="puppy"&&(p||lw.length))out.push(`<p>🐣 Since ${nm} is a puppy: keep sessions to 2–3 minutes and expect lots of repetition — that's normal.</p>`);
 if(age=="senior")out.push(`<p>👴 For a senior dog, go gentle on joints and keep sessions short and fun.</p>`);
 if(b&&p&&b[5].includes(p.id))out.push(`<p>🧬 This is common for ${b[0]}s. ${b[4][0]}</p>`);
 if(!p&&!lw.length&&out.length<=(health+agg)&&!/breed|energy|exercise/.test(t))out.push(`<p>I'm not sure I understood. Try asking about a behavior (barking, pulling, jumping, potty, chewing, biting) or a skill (sit, stay, come, leash, crate).</p>`);
 links=[...new Set(links)].slice(0,3);if(links.length)out.push(`<div class="chips">${links.map(l=>`<a class="chip" href="#lesson/${l.id}" style="text-decoration:none">${l.icon} ${l.title}</a>`).join("")}</div>`);
 return out.join("")}
async function askSend(){const i=$("#aq"),q=i.value.trim();if(!q||ASK_BUSY)return;if(!isPlus()&&askUsed()>=ASK_FREE){location.hash="paywall";return}
 S.chat=S.chat||[];const history=S.chat.filter(m=>!m.wait).slice(-8).map(m=>({role:m.r=="u"?"user":"assistant",content:m.r=="u"?m.t:m.t.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,800)}));
 S.chat.push({r:"u",t:q});askBump();i.value="";ASK_BUSY=1;save();render();
 let ans="";const ep=(typeof CONFIG!="undefined"&&CONFIG.AI_ENDPOINT)||"";
 if(ep){try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),20000);const r=await fetch(ep,{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q.slice(0,600),dogProfile:{name:S.dog.name,breed:S.dog.breed,age:S.dog.age,quiz:S.quiz||null},history})});clearTimeout(to);const j=await r.json();
  if(r.ok&&j&&(j.answer||j.reply))ans=`<p>${esc(j.answer||j.reply).replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>")}</p>`+((HEALTH_RE.test(q)||AGG_RE.test(q))?`<p class="muted">⚠️ Not veterinary advice — for health or aggression concerns, see your vet or a certified behaviorist.</p>`:"")}catch(e){}}
 else await new Promise(r=>setTimeout(r,500));
 if(!ans)ans=askLocal(q);ASK_BUSY=0;
 S.chat.push({r:"a",t:ans});S.chat=S.chat.slice(-40);save();render()}
function askClear(){S.chat=[];save();render()}
V.ask=()=>{const c=S.chat||[],left=ASK_FREE-askUsed(),sug=["How do I stop barking at the door?","My puppy bites my hands","How do I teach stay?","Pulls on the leash"];
 return `<h2>💬 Ask Rocco</h2><div class="card" style="display:flex;gap:12px;align-items:center"><img class="mav" src="icon-192.png" alt="Rocco" style="width:54px;height:54px"><div><b>Rocco, your training coach</b><div class="muted">Tips tailored to ${esc(dogName())}${S.dog.breed?` (${esc(S.dog.breed)})`:""}. Not a vet.</div></div></div>`+
 (c.length?c.map(m=>m.r=="u"?`<div style="display:flex;justify-content:flex-end;margin:8px 0"><div style="background:var(--p);color:#fff;padding:10px 14px;border-radius:18px 18px 4px 18px;max-width:80%">${esc(m.t)}</div></div>`:`<div style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><img class="mav" src="icon-192.png" alt="" style="width:32px;height:32px;flex:none"><div class="card" style="margin:0;max-width:86%;line-height:1.45">${m.t}</div></div>`).join("")+(ASK_BUSY?`<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><img class="mav" src="icon-192.png" alt="" style="width:32px;height:32px"><div class="card typing" style="margin:0;padding:12px 16px" aria-label="Rocco is typing"><span></span><span></span><span></span></div></div>`:""):`<div class="chips" style="margin:8px 0">${sug.map(s=>`<button class="chip" onclick="$('#aq').value=this.textContent;askSend()">${s}</button>`).join("")}</div>`)+
 `<div class="card"><textarea id="aq" rows="2" placeholder="Ask about ${esc(dogName())}'s training…" onkeydown="if(event.key=='Enter'&&!event.shiftKey){event.preventDefault();askSend()}"></textarea><button style="width:100%" onclick="askSend()">Ask Rocco</button><p class="muted" style="margin:8px 0 0">${isPlus()?"Unlimited questions with Plus.":`${Math.max(0,left)} of ${ASK_FREE} free questions left today. Plus: unlimited.`}${c.length?` · <a href="javascript:askClear()" style="color:var(--pd)">Clear chat</a>`:""}</p></div>`};
// ===== Hub, Home, nav =====
hub.splice(0,0,["ask","💬","Ask Rocco","Your AI training coach"],["health","🩺","Health & Care","Vet, meds, grooming reminders"],["behavior","📊","Behavior tracker","Log & see trends"]);
const f_home=V.home;V.home=a=>{let h=f_home(a);const due=careList().filter(r=>daysUntil(r.due)<=7);
 const care=due.length?`<h2>Health & Care</h2><div class="card">${due.slice(0,4).map(r=>`<div class="row" style="padding:6px 0"><span style="font-size:22px">${CARE_T[r.type][0]}</span><div class="grow"><b>${esc(r.title)}</b></div>${dueTxt(daysUntil(r.due))}</div>`).join("")}<p style="margin:6px 0 0"><a href="#health" style="color:var(--pd)">Manage reminders →</a></p></div>`:"";
 h=h.replace("<h2>Explore</h2>",care+"<h2>Explore</h2>");
 const row=`<div class="stats" style="margin-top:10px"><div class="stat" onclick="location.hash='ask'" style="cursor:pointer"><b>💬</b><span>Ask Rocco</span></div><div class="stat" onclick="location.hash='health'" style="cursor:pointer"><b>🩺</b><span>Health</span></div><div class="stat" onclick="location.hash='behavior'" style="cursor:pointer"><b>📊</b><span>Behavior</span></div></div>`;
 return h+row};
const f_render=render;render=function(){f_render();const v=(location.hash.slice(1)||"home").split("/")[0];if(["ask","health","behavior"].includes(v))document.querySelectorAll("nav a").forEach(n=>n.classList.toggle("on",n.dataset.t=="more"));if(v=="ask")setTimeout(()=>scrollTo(0,document.body.scrollHeight),0)};
setTimeout(careSchedule,1500);render();

(()=>{const st=document.createElement("style");st.textContent=".typing span{display:inline-block;width:8px;height:8px;margin:0 2px;border-radius:50%;background:#c9b8ae;animation:tdot 1s infinite}.typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}";document.head.appendChild(st)})();
