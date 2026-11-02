const K="rockos-academy-v1";
let S=JSON.parse(localStorage.getItem(K)||"null")||{dog:{name:"",age:"",breed:"",photo:""},progress:{},sessions:[]};
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const $=s=>document.querySelector(s),app=$("#app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ST=["Not started","Practicing","Mastered"];
const prog=id=>S.progress[id]||0;
const dayKey=d=>{d=new Date(d);return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()};
function streak(){const days=new Set(S.sessions.map(s=>dayKey(s.at)));let n=0,d=new Date();if(!days.has(dayKey(d)))d.setDate(d.getDate()-1);while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1)}return n}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
const dogName=()=>S.dog.name||"your dog";
const avatar=()=>`<div class="avatar">${S.dog.photo?`<img src="${S.dog.photo}" alt="">`:"🐶"}</div>`;
const CAP=window.Capacitor,NATIVE=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform()),PL=(CAP&&CAP.Plugins)||{};
if(!NATIVE&&"serviceWorker" in navigator&&(location.protocol=="https:"||location.hostname=="localhost"))navigator.serviceWorker.register("sw.js").catch(()=>{});
async function setReminder(on,time){S.reminder={on,time};save();
 if(!NATIVE){toast(on?"Reminders work in the iPhone app. Saved for later!":"Reminder off");return}
 const LN=PL.LocalNotifications;if(!LN)return;try{await LN.cancel({notifications:[{id:1}]});
 if(on){const p=await LN.requestPermissions();if(p.display!="granted"){toast("Please allow notifications in Settings");return}
  const [h,m]=time.split(":").map(Number);await LN.schedule({notifications:[{id:1,title:"Rocco's Academy 🐾",body:"Time for a quick training session with "+dogName()+"! Keep your streak going 🔥",schedule:{on:{hour:h,minute:m},repeats:true,allowWhileIdle:true}}]});toast("Daily reminder set for "+time)}else toast("Reminder off")}catch(e){toast("Couldn't set reminder")}}
let actx;function click(){if(NATIVE&&PL.Haptics)PL.Haptics.impact({style:"MEDIUM"}).catch(()=>{});try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime;[0,0.012].forEach((o,i)=>{const os=actx.createOscillator(),g=actx.createGain();os.type="square";os.frequency.value=i?2600:3400;g.gain.setValueAtTime(0.5,t+o);g.gain.exponentialRampToValueAtTime(0.001,t+o+0.03);os.connect(g).connect(actx.destination);os.start(t+o);os.stop(t+o+0.04)});!NATIVE&&navigator.vibrate&&navigator.vibrate(15)}catch(e){}}
function lessonRow(l){const p=prog(l.id);return `<div class="card lesson" onclick="location.hash='lesson/${l.id}'"><div class="ic">${l.icon}</div><div class="grow"><h3>${l.title}</h3><small>${l.level} · ${l.summary}</small></div><span class="badge b${p}">${ST[p]}</span></div>`}
const RT=["Hi, I'm Rocco! Keep sessions short and fun. I learn best in 3–5 minute bursts.","Rocco's rule: reward within 1 second, so I know exactly what I did right.","End on a win! Finish with something I already know so I want to train again.","Tired dog, happy dog: a sniffy walk before training helps me focus.","Be patient with me. Every dog learns at their own pace. 🐾"];
const rocko=t=>`<div class="rocko"><img class="mav" src="icon-192.png" alt="Rocco"><div><b>Rocco's tip</b><div>${t}</div></div></div>`;
const V={
home(){const m=LESSONS.filter(l=>prog(l.id)==2).length,days=new Set(S.sessions.map(s=>dayKey(s.at)));let wk="";for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);wk+=`<div class="d"><i class="${days.has(dayKey(d))?"on":""}"></i>${"SMTWTFS"[d.getDay()]}</div>`}
const next=LESSONS.find(l=>prog(l.id)==1)||LESSONS.find(l=>prog(l.id)==0);
return `<div class="card row">${avatar()}<div class="grow"><b style="font-size:18px">${S.dog.name?"Hi, "+esc(S.dog.name)+"!":"Welcome!"}</b><div class="muted">${S.dog.name?esc([S.dog.breed,S.dog.age&&S.dog.age+" old"].filter(Boolean).join(" · ")):"Set up your dog's profile to get started."}</div></div>${S.dog.name?"":`<a class="btn" href="#profile">Set up</a>`}</div>
${rocko(RT[new Date().getDate()%RT.length])}<div class="stats"><div class="stat"><b>🔥 ${streak()}</b><span>day streak</span></div><div class="stat"><b>${S.sessions.length}</b><span>sessions</span></div><div class="stat"><b>${m}/${LESSONS.length}</b><span>mastered</span></div></div>
<div class="card" style="margin-top:14px"><b>This week</b><div class="week" style="margin-top:10px">${wk}</div></div>
${next?`<h2>Up next</h2>${lessonRow(next)}`:""}
<div class="card"><b>Quick start</b><p class="muted">Short, fun sessions (3–5 min) a few times a day work best. Reward the instant your dog gets it right.</p><button onclick="location.hash='train'">Start a 5-minute session</button></div>`},
lessons(){return `<h2>Lesson library</h2>`+LESSONS.map(lessonRow).join("")},
lesson(id){const l=LESSONS.find(x=>x.id==id);if(!l)return V.lessons();const p=prog(id);
return `<p><a href="#lessons" style="color:var(--pd)">← All lessons</a></p><div class="card"><div class="row"><div class="lesson"><div class="ic">${l.icon}</div></div><div><h2 style="margin:0">${l.title}</h2><small class="muted">${l.level}</small></div></div><p>${l.summary}</p>
<label>Progress</label><div class="seg">${ST.map((s,i)=>`<button class="${p==i?"sel":""}" onclick="setProg('${id}',${i})">${s}</button>`).join("")}</div></div>
<div class="card"><b>📋 Steps</b><ol>${l.steps.map(s=>`<li>${s}</li>`).join("")}</ol></div>
${rocko(l.tips[0])}${l.tips.length>1?`<div class="card"><b>💡 More tips</b><ul>${l.tips.slice(1).map(s=>`<li>${s}</li>`).join("")}</ul></div>`:""}
<div class="card"><b>⚠️ Common mistakes</b><ul>${l.mistakes.map(s=>`<li>${s}</li>`).join("")}</ul></div>
<button style="width:100%" onclick="location.hash='train/${id}'">Practice this now</button>`},
train(id){return rocko("Click the instant I get it right, then treat. The click means YES!")+`<div class="card"><label>Lesson</label><select id="tl">${LESSONS.map(l=>`<option value="${l.id}" ${l.id==(id||T.lesson)?"selected":""}>${l.icon} ${l.title}</option>`).join("")}</select>
<label>Session length</label><div class="seg">${[3,5,10].map(m=>`<button class="${T.len==m*60?"sel":""}" onclick="setLen(${m})">${m} min</button>`).join("")}</div>
<div class="timer" id="tm">${fmt(T.left)}</div><div class="row"><button class="grow" id="tb" onclick="toggle()">${T.run?"Pause":"Start"}</button><button class="ghost" onclick="resetT()">Reset</button></div></div>
<div class="card" style="text-align:center"><button class="clicker" onpointerdown="click();T.clicks++;$('#cc').textContent=T.clicks">CLICK</button><div class="muted">Clicks this session: <b id="cc">${T.clicks}</b> · Click the instant your dog does it right, then treat.</div></div>
<button style="width:100%" onclick="finish()">✅ Log this session</button>`},
log(){const ss=[...S.sessions].reverse();return `<h2>Session log</h2><div class="card"><b>Add a note-only entry</b><select id="ll">${LESSONS.map(l=>`<option value="${l.id}">${l.title}</option>`).join("")}</select><input id="lm" type="number" min="1" placeholder="Minutes" value="5"><textarea id="ln" rows="2" placeholder="How did it go?"></textarea><button onclick="addLog()">Save entry</button></div>
<div class="card">${ss.length?ss.map((s,i)=>{const l=LESSONS.find(x=>x.id==s.lesson)||{};return `<div class="log"><b>${l.icon||""} ${l.title||s.lesson}</b> · ${s.min} min${s.clicks?` · ${s.clicks} clicks`:""}<div class="muted">${new Date(s.at).toLocaleString()}</div>${s.note?`<div>${esc(s.note)}</div>`:""}</div>`}).join(""):`<p class="muted">No sessions yet. Your first one starts a streak! 🔥 Rocco is ready when you are.</p>`}</div>`},
profile(){const d=S.dog;return `<h2>Dog profile</h2><div class="card"><div class="row" style="margin-bottom:12px">${avatar()}<label class="btn ghost" style="cursor:pointer">📷 Photo<input type="file" accept="image/*" id="ph" hidden></label>${d.photo?`<button class="ghost" onclick="S.dog.photo='';save();render()">Remove</button>`:""}</div>
<label>Name</label><input id="dn" value="${esc(d.name)}" placeholder="e.g. Biscuit"><label>Age</label><input id="da" value="${esc(d.age)}" placeholder="e.g. 8 months"><label>Breed</label><input id="db" value="${esc(d.breed)}" placeholder="e.g. Lab mix"><button onclick="saveDog()">Save profile</button></div>
<div class="card"><b>⏰ Daily practice reminder</b><p class="muted">${NATIVE?"Rocco will nudge you each day at this time.":"Available in the iPhone app."}</p><input type="time" id="rt" value="${(S.reminder||{}).time||"18:00"}"><div class="row"><button class="grow" onclick="setReminder(true,$('#rt').value)">${(S.reminder||{}).on?"Update reminder":"Turn on"}</button>${(S.reminder||{}).on?`<button class="ghost" onclick="setReminder(false,$('#rt').value)">Turn off</button>`:""}</div></div><div class="card"><b>Data</b><p class="muted">Everything is stored only on this device.</p><button class="ghost" onclick="if(confirm('Erase all data?')){localStorage.removeItem(K);location.reload()}">Reset all data</button></div>`}
};
const T={len:300,left:300,run:false,iv:null,clicks:0,lesson:"name"};
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
function setLen(m){if(T.run)return;T.len=T.left=m*60;render()}
function toggle(){T.lesson=$("#tl").value;if(T.run){clearInterval(T.iv);T.run=false}else{T.run=true;T.iv=setInterval(()=>{T.left--;const e=$("#tm");e&&(e.textContent=fmt(T.left));if(T.left<=0){clearInterval(T.iv);T.run=false;click();setTimeout(click,200);toast("Time's up! Great work 🎉");finish()}},1000)}$("#tb").textContent=T.run?"Pause":"Start"}
function resetT(){clearInterval(T.iv);T.run=false;T.left=T.len;T.clicks=0;render()}
function finish(){const sel=$("#tl");const lesson=sel?sel.value:T.lesson;const min=Math.max(1,Math.round((T.len-T.left)/60));S.sessions.push({lesson,min,clicks:T.clicks,at:Date.now()});if(!prog(lesson))S.progress[lesson]=1;save();clearInterval(T.iv);T.run=false;T.left=T.len;T.clicks=0;toast("Session logged 🔥 streak: "+streak());location.hash="home"}
function addLog(){S.sessions.push({lesson:$("#ll").value,min:+$("#lm").value||5,note:$("#ln").value,at:Date.now()});if(!prog($("#ll").value))S.progress[$("#ll").value]=1;save();toast("Saved");render()}
function setProg(id,i){S.progress[id]=i;save();if(i==2)toast("Mastered! 🏆");render()}
function saveDog(){Object.assign(S.dog,{name:$("#dn").value.trim(),age:$("#da").value.trim(),breed:$("#db").value.trim()});save();toast("Profile saved");location.hash="home"}
function onPhoto(f){const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),z=256,s=Math.min(img.width,img.height);c.width=c.height=z;c.getContext("2d").drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,z,z);S.dog.photo=c.toDataURL("image/jpeg",.8);save();render()};img.src=r.result};r.readAsDataURL(f)}

const Q={age:[["puppy","Puppy (under 6 mo)"],["adolescent","Adolescent (6–18 mo)"],["adult","Adult (1.5–7 yr)"],["senior","Senior (7+ yr)"]],
size:[["small","Small (<20 lb)"],["medium","Medium (20–50 lb)"],["large","Large (50–90 lb)"],["giant","Giant (90+ lb)"]],
group:[["mixed","Mixed / not sure"],["herding","Herding (Border Collie, Aussie, Shepherd)"],["working","Working (Husky, Boxer, Rottweiler)"],["sporting","Sporting (Lab, Retriever, Spaniel)"],["hound","Hound (Beagle, Greyhound)"],["terrier","Terrier"],["toy","Toy (Chihuahua, Yorkie)"],["nonsporting","Non-sporting (Poodle, Bulldog)"]],
energy:[["low","Low – couch buddy"],["medium","Medium"],["high","High – always on"]],
exp:[["first","First-time owner"],["some","Some experience"],["pro","Very experienced"]],
goals:[["basics","Basic obedience"],["house","House training"],["leash","Better walks"],["recall","Reliable recall"],["calm","A calmer dog"],["social","Confidence & socialization"]]};
const sel=(id,opts,v)=>`<select id="q_${id}">${opts.map(([k,t])=>`<option value="${k}" ${v==k?"selected":""}>${t}</option>`).join("")}</select>`;
const chips=(name,opts,vals)=>`<div class="chips">${opts.map(([k,t])=>`<button type="button" class="chip ${vals.includes(k)?"sel":""}" data-g="${name}" data-k="${k}" onclick="this.classList.toggle('sel')">${t}</button>`).join("")}</div>`;
const picked=g=>[...document.querySelectorAll(`.chip.sel[data-g="${g}"]`)].map(b=>b.dataset.k);
function genPlan(q,fixes,created){
 const sc={};LESSONS.forEach((l,i)=>sc[l.id]=100-i*3);
 const up=(ids,n)=>ids.forEach(i=>sc[i]=(sc[i]||0)+n);
 up(["name","sit"],40);
 if(q.age=="puppy")up(["potty","crate","social","name","drop"],60);
 if(q.age=="adolescent")up(["come","leash","wait","leaveit"],25);
 if(q.age=="senior"){up(["name","settle","sit","leash"],25);up(["stay","come"],-10)}
 if(q.energy=="high"||["herding","working"].includes(q.group))up(["wait","settle","leaveit"],45);
 if(q.group=="hound")up(["come","leaveit"],25);if(q.group=="terrier")up(["drop","leaveit","settle"],20);if(q.group=="sporting")up(["drop","leash"],15);
 if(["large","giant"].includes(q.size))up(["leash","sit"],20);
 if(q.energy=="low")up(["settle"],-15);
 const gm={basics:["sit","down","stay"],house:["potty","crate"],leash:["leash"],recall:["come","name"],calm:["settle","wait"],social:["social"]};
 (q.goals||[]).forEach(g=>up(gm[g]||[],30));
 const fx=[...new Set([...(q.problems||[]),...(fixes||[])])];
 fx.forEach(f=>{const pr=PROBLEMS.find(p=>p.id==f);pr&&up(pr.lessons,35)});
 if(!(q.goals||[]).includes("house")&&q.age!="puppy"&&!fx.includes("potty"))up(["potty"],-60);
 const order=Object.keys(sc).sort((a,b)=>sc[b]-sc[a]);
 const nW=q.exp=="first"||q.age=="puppy"?6:5,per=q.exp=="pro"?3:2;
 const mins={puppy:3,adolescent:5,adult:5,senior:4}[q.age]+(q.energy=="high"&&q.age=="adult"?2:0);
 const perDay={puppy:3,adolescent:3,adult:2,senior:2}[q.age];
 const weeks=[];let k=0;
 for(let w=0;w<nW;w++){const nw=order.slice(k,k+per);k+=per;const review=w?weeks[w-1].focus.slice(0,1):[];
  const wfix=fx.filter((_,i)=>i%nW==w%Math.max(1,Math.min(nW,fx.length))||w>=1);
  const focus=nw.length?nw:order.slice(0,per);
  const items=[...focus,...review];const fxw=fx.length?fx[w%fx.length]:null;
  weeks.push({focus,review,fix:fxw,mins:Math.min(10,mins+(w>=3?1:0)),perDay,note:weekNote(q,w)})}
 return {q,fixes:fixes||[],created:created||Date.now(),weeks};
}
function weekNote(q,w){if(q.age=="puppy"&&w<2)return "Puppy brains tire fast: 3-minute sessions, lots of naps, and safe new experiences every day.";
 if(q.age=="senior")return "Keep it gentle and low-impact: soft surfaces, no jumping, and stop before your dog seems sore or tired.";
 if((q.energy=="high"||["herding","working"].includes(q.group))&&w<3)return "Busy brain! Do a sniff walk or fetch first, then train. Calm is a skill: reward it.";
 if(q.exp=="first"&&w==0)return "Welcome! Go slow, use tiny tasty treats, and end every session on a win.";
 return ["Review last week's skills in new rooms.","Add mild distractions, one at a time.","Practice outside on quiet walks.","Mix skills together in short games.","Take it on the road: new places, same skills."][w%5]}
const curWeek=()=>S.plan?Math.min(S.plan.weeks.length-1,Math.floor((Date.now()-S.plan.created)/864e5/7)):0;
function todayTasks(){if(!S.plan)return[];const w=S.plan.weeks[curWeek()];const ids=[...w.focus,...w.review];const t=[];
 for(let i=0;i<w.perDay;i++){const id=ids[i%ids.length];t.push({lesson:id,label:(LESSONS.find(l=>l.id==id)||{}).title})}
 if(w.fix){const pr=PROBLEMS.find(p=>p.id==w.fix);pr&&t.push({lesson:pr.lessons[0],fix:pr.id,label:"Fix: "+pr.title+" ("+(LESSONS.find(l=>l.id==pr.lessons[0])||{}).title+")"})}
 const today=S.sessions.filter(s=>dayKey(s.at)==dayKey(Date.now()));const used=new Set();
 t.forEach(x=>{const i=today.findIndex((s,j)=>!used.has(j)&&s.lesson==x.lesson);if(i>=0){used.add(i);x.done=true}});return t}
function tasksHTML(){const t=todayTasks(),w=S.plan.weeks[curWeek()];return `<div class="muted">Week ${curWeek()+1} of ${S.plan.weeks.length} · ${w.mins}-min sessions · ${t.filter(x=>x.done).length}/${t.length} done today</div>`+t.map(x=>`<div class="task"><div class="chk ${x.done?"on":""}">${x.done?"✓":""}</div><div class="grow">${x.label}</div>${x.done?"":`<button class="ghost" style="padding:8px 12px" onclick="location.hash='train/${x.lesson}'">Train</button>`}</div>`).join("")}
function makePlan(){const q={age:$("#q_age").value,size:$("#q_size").value,group:$("#q_group").value,energy:$("#q_energy").value,exp:$("#q_exp").value,goals:picked("goals"),problems:picked("problems")};
 Object.assign(S.dog,{name:$("#dn").value.trim(),age:$("#da").value.trim(),breed:$("#db").value.trim()});S.quiz=q;
 S.plan=genPlan(q,S.plan?S.plan.fixes:[],null);save();toast("Rocco built your plan! 🗓️");location.hash="plan"}
function addFix(id){S.fixes=S.fixes||[];if(!S.plan){toast("Take the quiz first so Rocco can build your plan");location.hash="profile";return}
 if(!S.plan.fixes.includes(id))S.plan.fixes.push(id);S.plan=genPlan(S.plan.q,S.plan.fixes,S.plan.created);save();toast("Added to your plan ✅");location.hash="plan"}
V.plan=()=>{if(!S.plan)return rocko("Answer a few questions about your dog and I'll build a week-by-week plan just for you!")+`<button style="width:100%" onclick="location.hash='profile'">Take the quiz</button>`;
 const c=curWeek();return `<h2>${esc(S.dog.name||"Your dog")}'s training plan</h2>${rocko(S.plan.weeks[c].note)}<div class="card"><b>Today</b>${tasksHTML()}</div>`+
 S.plan.weeks.map((w,i)=>`<div class="card wk ${i==c?"cur":""}"><b>Week ${i+1}${i==c?" · this week":""}</b><div class="muted">${w.perDay} sessions/day · ${w.mins} min each</div><div>🎯 New: ${w.focus.map(id=>`<a href="#lesson/${id}">${LESSONS.find(l=>l.id==id).title}</a>`).join(", ")}</div>${w.review.length?`<div>🔁 Review: ${w.review.map(id=>LESSONS.find(l=>l.id==id).title).join(", ")}</div>`:""}${w.fix?`<div>🛠️ Fix: <a href="#fix/${w.fix}">${PROBLEMS.find(p=>p.id==w.fix).title}</a></div>`:""}</div>`).join("")+
 `<button class="ghost" style="width:100%" onclick="location.hash='profile'">Update answers & regenerate</button>`};
V.fix=id=>{const pr=PROBLEMS.find(p=>p.id==id);
 if(!pr)return `<h2>Fix my problem</h2>${rocko("Tell me what's going on in your own words, and I'll find the best plan. No judgment, every dog has something!")}<div class="card"><textarea id="ft" rows="3" placeholder="e.g. He jumps all over guests when they come in"></textarea><button style="width:100%" onclick="findFix()">Find a fix</button></div><h2>Or pick one</h2>`+PROBLEMS.map(p=>`<div class="card lesson" onclick="location.hash='fix/${p.id}'"><div class="ic">${p.icon}</div><div class="grow"><h3>${p.title}</h3></div>${S.plan&&S.plan.fixes.includes(p.id)?'<span class="badge b2">In plan</span>':""}</div>`).join("");
 const L=a=>a.map(x=>`<li>${x}</li>`).join(""),inP=S.plan&&S.plan.fixes.includes(id);
 return `<p><a href="#fix" style="color:var(--pd)">← All problems</a></p><div class="card"><div class="row"><div class="lesson"><div class="ic">${pr.icon}</div></div><h2 style="margin:0">${pr.title}</h2></div></div>
 <div class="card"><b>🔍 Likely causes</b><ul>${L(pr.causes)}</ul></div><div class="card"><b>📋 Fix plan</b><ol>${L(pr.plan)}</ol><div class="muted">Related lessons: ${pr.lessons.map(l=>`<a href="#lesson/${l}">${LESSONS.find(x=>x.id==l).title}</a>`).join(", ")}</div></div>
 <div class="card"><b>🚫 What to avoid</b><ul>${L(pr.avoid)}</ul></div>${rocko("Management first: "+pr.manage.join(" "))}
 <div class="card" style="border:2px solid #ffd2c4"><b>🩺 When to see a professional</b><p>${pr.pro}</p></div>
 <button style="width:100%" ${inP?"disabled":""} onclick="addFix('${id}')">${inP?"✅ In your plan":"➕ Add to my training plan"}</button>`};
function findFix(){const t=$("#ft").value;const p=matchProblem(t);if(!p){toast("Hmm, try different words or pick below");return}S.lastQ=t;location.hash="fix/"+p.id;setTimeout(()=>toast("Rocco thinks this matches: "+p.title),50)}
const _home=V.home;V.home=()=>{let h=_home();const blk=S.plan?`<h2>This week's plan</h2><div class="card">${tasksHTML()}<p style="margin:10px 0 0"><a href="#plan" style="color:var(--pd)">See full plan →</a></p></div>`:`<div class="card"><b>🗓️ Get a personalized plan</b><p class="muted">Answer 6 quick questions and Rocco will build a week-by-week plan for your dog.</p><button onclick="location.hash='profile'">Take the quiz</button></div>`;return h.replace('<div class="card" style="margin-top:14px"><b>This week</b>',blk+'<div class="card" style="margin-top:14px"><b>Streak</b>')};
V.profile=()=>{const d=S.dog,q=S.quiz||{age:"adult",size:"medium",group:"mixed",energy:"medium",exp:"some",goals:["basics"],problems:[]};
 return `<h2>Dog profile & quiz</h2><div class="card"><div class="row" style="margin-bottom:12px">${avatar()}<label class="btn ghost" style="cursor:pointer">📷 Photo<input type="file" accept="image/*" id="ph" hidden></label>${d.photo?`<button class="ghost" onclick="S.dog.photo='';save();render()">Remove</button>`:""}</div>
 <label>Name</label><input id="dn" value="${esc(d.name)}" placeholder="e.g. Biscuit"><label>Age (exact)</label><input id="da" value="${esc(d.age)}" placeholder="e.g. 8 months"><label>Breed</label><input id="db" value="${esc(d.breed)}" placeholder="e.g. Lab mix"></div>
 ${rocko("Answer these and I'll tailor the lesson order, session length, and how often to train.")}
 <div class="card"><label>Life stage</label>${sel("age",Q.age,q.age)}<label>Size</label>${sel("size",Q.size,q.size)}<label>Breed group</label>${sel("group",Q.group,q.group)}<label>Energy level</label>${sel("energy",Q.energy,q.energy)}<label>Your experience</label>${sel("exp",Q.exp,q.exp)}
 <fieldset><legend>Goals</legend>${chips("goals",Q.goals,q.goals)}</fieldset><fieldset><legend>Current problem behaviors</legend>${chips("problems",PROBLEMS.map(p=>[p.id,p.title]),q.problems)}</fieldset>
 <button style="width:100%" id="gen" onclick="makePlan()">${S.plan?"Save & regenerate plan":"Save & build my plan"}</button></div>
 <div class="card"><b>⏰ Daily practice reminder</b><p class="muted">${NATIVE?"Rocco will nudge you each day at this time.":"Available in the iPhone app."}</p><input type="time" id="rt" value="${(S.reminder||{}).time||"18:00"}"><div class="row"><button class="grow" onclick="setReminder(true,$('#rt').value)">${(S.reminder||{}).on?"Update reminder":"Turn on"}</button>${(S.reminder||{}).on?`<button class="ghost" onclick="setReminder(false,$('#rt').value)">Turn off</button>`:""}</div></div><div class="card"><b>Data</b><p class="muted">Everything is stored only on this device.</p><button class="ghost" onclick="if(confirm('Erase all data?')){localStorage.removeItem(K);location.reload()}">Reset all data</button></div>`};
function render(){const [v,a]=(location.hash.slice(1)||"home").split("/");app.innerHTML=(V[v]||V.home)(a);
document.querySelectorAll("nav a").forEach(n=>n.classList.toggle("on",n.dataset.t==(v=="lesson"?"lessons":v=="train"?"plan":v)));
$("#sub").textContent=S.dog.name?`Training with ${S.dog.name}`:"Positive training, guided by Rocco";
const ph=$("#ph");ph&&ph.addEventListener("change",e=>e.target.files[0]&&onPhoto(e.target.files[0]));window.scrollTo(0,0)}
window.addEventListener("hashchange",()=>{if(T.run&&!location.hash.startsWith("#train")){}render()});render();
