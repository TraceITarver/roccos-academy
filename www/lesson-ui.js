// Detailed lesson screen: collapsible sections + tickable step checklists
const LS=()=>{S.steps=S.steps||{};return S.steps};
function tickStep(id,k){const st=LS();st[id]=st[id]||[];const i=st[id].indexOf(k);i>=0?st[id].splice(i,1):st[id].push(k);save();
 const el=document.querySelector(`[data-k="${id}:${k}"]`);if(el){const on=i<0;el.classList.toggle("on",on);el.textContent=on?"✓":""}
 const tot=document.querySelectorAll(".stepchk").length,dn=document.querySelectorAll(".stepchk.on").length,b=$("#stepbar");if(b){b.style.width=Math.round(dn/tot*100)+"%";$("#steptxt").textContent=`${dn}/${tot} steps checked`}}
const sec=(icon,t,body,open)=>`<details class="card sec"${open?" open":""}><summary><b>${icon} ${t}</b></summary><div class="secb">${body}</div></details>`;
const UL=a=>`<ul>${a.map(x=>`<li>${x}</li>`).join("")}</ul>`;
V.lesson=id=>{const l=LESSONS.find(x=>x.id==id);if(!l)return V.lessons();const p=prog(id),d=l.d||{},done=LS()[id]||[];
 const head=`<p><a href="#lessons" style="color:var(--pd)">← All lessons</a></p><div class="card"><div class="row"><div class="lesson"><div class="ic">${l.icon}</div></div><div><h2 style="margin:0">${l.title}</h2><small class="muted">${l.level}${d.reps?" · "+d.reps.split(".")[0]:""}</small></div></div><p>${l.summary}</p>
<label>Progress</label><div class="seg">${ST.map((s,i)=>`<button type="button" class="${p==i?"sel":""}" onclick="setProg('${id}',${i})">${s}</button>`).join("")}</div></div>`;
 if(!d.stages)return head+`<div class="card"><b>📋 Steps</b><ol>${l.steps.map(s=>`<li>${s}</li>`).join("")}</ol></div><button style="width:100%" onclick="location.hash='train/${id}'">Practice this now</button>`;
 let tot=0;d.stages.forEach(g=>tot+=g.s.length);const pct=Math.round(done.length/tot*100);
 const stages=d.stages.map((g,gi)=>sec("🪜",g.n,`<div>${g.s.map((s,si)=>{const k=gi+"-"+si,on=done.includes(k);return `<div class="task" onclick="tickStep('${id}','${k}')" style="cursor:pointer"><div class="chk stepchk ${on?"on":""}" data-k="${id}:${k}">${on?"✓":""}</div><div class="grow"><b style="color:var(--m);font-weight:600">${si+1}.</b> ${s}</div></div>`}).join("")}</div>`,gi==0)).join("");
 return head+roccoTip(d.why)
 +`<div class="card"><div class="row" style="justify-content:space-between"><b>📋 Step-by-step</b><span class="muted" id="steptxt">${done.length}/${tot} steps checked</span></div><div style="background:#ebe8de;border-radius:99px;height:8px;margin-top:8px"><div id="stepbar" style="width:${pct}%;background:var(--g);height:8px;border-radius:99px;transition:.3s"></div></div><p class="muted" style="margin:8px 0 0">Tap a step to tick it off. Work through stages in order and only move on when your dog succeeds about 4 out of 5 times.</p></div>`
 +sec("🎒","What you need",UL(d.need))+sec("🧰","Prep & setup",UL(d.setup))+stages
 +sec("🗣️","Cue word & hand signal",`<p><b>Say:</b> ${d.cue.word}</p><p><b>Show:</b> ${d.cue.signal}</p><p class="muted">Say the word once, pause a second, then give the signal. Over time the word alone will work.</p>`)
 +sec("✅","What success looks like",`<p>${d.success}</p>`)+sec("⏱️","How long & how many reps",`<p>${d.reps}</p>`)
 +sec("🔧","Troubleshooting",d.trouble.map(t=>`<div style="margin:8px 0"><b>${t[0]}</b><div>${t[1]}</div></div>`).join(""))
 +sec("⚠️","Common mistakes",UL(d.mistakes))+(d.safety?sec("🩺","Safety notes",UL(d.safety)):"")
 +sec("🐾","Puppy vs adult dogs",`<p><b>Puppies:</b> ${d.puppy}</p><p><b>Adult dogs:</b> ${d.adult}</p>`)
 +(d.next?sec("🚀","Next level",`<p>${d.next}</p>`):"")
 +sec("💡","Quick tips",UL(l.tips))
 +`<button style="width:100%" onclick="location.hash='train/${id}'">Practice this now</button>`};
