// Suggestions / Feedback screen
const APP_VER="1.0.0",SG="roccos-suggestions",FEED_EMAIL="traceamite@gmail.com";
const SG_CATS=[["feature","💡 New feature"],["change","✏️ Change something"],["bug","🐞 Bug / problem"],["other","💬 Other"]];
let SGS={cat:"feature",rate:0,sent:null};
const myS=()=>JSON.parse(localStorage.getItem(SG)||"[]");
const platform=()=>(NATIVE?"iOS app":"Web")+" · "+navigator.userAgent.replace(/^.*?\(([^)]*)\).*$/,"$1").slice(0,60);
const catName=c=>(SG_CATS.find(x=>x[0]==c)||SG_CATS[3])[1].replace(/^\S+ /,"");
V.suggest=()=>{const list=myS();
 const form=SGS.sent?`<div class="card" style="text-align:center"><img class="mav" src="icon-192.png" alt="" style="width:80px;height:80px"><h2 style="margin:10px 0 4px">Thank you! 🐾</h2><p class="muted">${SGS.sent=="cloud"?"Rocco got your suggestion. We read every one.":"Your email app should open with your suggestion ready. Just tap Send."}</p><button onclick="SGS.sent=null;render()">Send another</button></div>`
 :`${rocko("What should I learn next? Tell us what you'd like added or changed. We read every suggestion.")}<div class="card"><fieldset><legend>What's it about?</legend><div class="chips">${SG_CATS.map(c=>`<button class="chip${SGS.cat==c[0]?" sel":""}" onclick="SGS.cat='${c[0]}';render()">${c[1]}</button>`).join("")}</div></fieldset>
 <label>Your suggestion</label><textarea id="sm" rows="5" placeholder="e.g. Add a lesson for jumping on guests"></textarea>
 <label>How do you like the app so far? (optional)</label><div class="row" style="margin:4px 0 10px">${[1,2,3,4,5].map(n=>`<span style="font-size:28px;cursor:pointer;filter:${n<=SGS.rate?"none":"grayscale(1) opacity(.35)"}" onclick="SGS.rate=SGS.rate==${n}?0:${n};render()">⭐</span>`).join("")}</div>
 <label>Email for a reply (optional)</label><input id="se" type="email" placeholder="you@example.com" value="${esc((typeof ACC!="undefined"&&ACC.user&&ACC.user.email)||"")}">
 <button style="width:100%" onclick="sendSuggestion()">Send suggestion</button></div>`;
 return `<p><a href="#account">← Account</a></p><h2>Suggestions</h2>`+form+(list.length?`<h2>Your suggestions</h2>`+list.slice().reverse().map(s=>`<div class="card"><div class="row"><b class="grow">${esc(catName(s.cat))}</b>${s.rate?`<span class="muted">${"⭐".repeat(s.rate)}</span>`:""}</div><p style="margin:6px 0">${esc(s.msg)}</p><div class="muted">${new Date(s.at).toLocaleDateString()} · ${s.via=="cloud"?"Sent ✅":"Sent by email"}</div></div>`).join(""):"")};
async function sendSuggestion(){const msg=$("#sm").value.trim(),email=$("#se").value.trim();if(msg.length<3){toast("Please write your suggestion first");return}
 const s={cat:SGS.cat,msg,email,rate:SGS.rate,at:new Date().toISOString(),ver:APP_VER,platform:platform()};let via="email";
 try{if(typeof FB_ON!="undefined"&&FB_ON){const fb=await loadFB();await fb.fs.addDoc(fb.fs.collection(fb.db,"suggestions"),{...s,uid:(ACC.user&&ACC.user.uid)||null,createdAt:fb.fs.serverTimestamp()});via="cloud"}}catch(e){console.log("suggest cloud",e)}
 if(via=="email"){const body=`${msg}\n\nCategory: ${catName(s.cat)}\nRating: ${s.rate?s.rate+"/5":"—"}\nReply to: ${email||"—"}\nApp version: ${APP_VER}\nPlatform: ${s.platform}`;
  location.href=`mailto:${FEED_EMAIL}?subject=${encodeURIComponent("Rocco's Academy suggestion: "+catName(s.cat))}&body=${encodeURIComponent(body)}`}
 const l=myS();l.push({cat:s.cat,msg,rate:s.rate,at:s.at,via});localStorage.setItem(SG,JSON.stringify(l));SGS={cat:"feature",rate:0,sent:via};render()}
// add link card to Account page + header button
const _acc=V.account;V.account=()=>_acc()+`<div class="card lesson" onclick="location.hash='suggest'"><div class="ic">💡</div><div class="grow"><h3>Suggestions</h3><small>Tell us what to add or change</small></div></div>`;
(function(){const h=document.querySelector("header");if(!h||document.getElementById("sugBtn"))return;const a=document.createElement("a");a.id="sugBtn";a.href="#suggest";a.setAttribute("aria-label","Suggestions");a.textContent="💡";a.style.cssText="position:absolute;top:22px;right:68px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;font-size:22px;text-decoration:none";h.appendChild(a)})();
render();
