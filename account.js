// Accounts (Sign in with Apple / email code via roccos-sync worker + cloud backup) and the Account / My Subscription screen
const SYNC_KEYS=[K,DK,"roccos-plus"],UPD="roccos-updated";
const SYNC=CONFIG.SYNC_ENDPOINT||"",ACC_ON=!!SYNC;
const ACC={user:JSON.parse(localStorage.getItem("roccos-user")||"null"),token:localStorage.getItem("roccos-token")||"",ready:true,syncing:false,lastSync:localStorage.getItem("roccos-lastsync")||"",err:"",sub:null,codeFor:""};
let pushT=null;
// mark local data as changed + schedule an auto-backup whenever app data is saved
(function(){const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){o.call(this,k,v);if(this===localStorage&&SYNC_KEYS.includes(k)&&!ACC._applying){o.call(this,UPD,String(Date.now()));schedulePush()}}})();
function schedulePush(){if(!ACC.token)return;clearTimeout(pushT);pushT=setTimeout(()=>pushCloud(true),2500)}
const localSnap=()=>{const d={};SYNC_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)d[k]=v});return d};
async function api(path,opt={}){const r=await fetch(SYNC+path,{...opt,headers:{"Content-Type":"application/json",...(ACC.token?{Authorization:"Bearer "+ACC.token}:{})}});const j=await r.json().catch(()=>({}));
 if(r.status==401&&ACC.token){clearSession();render()}if(!r.ok)throw new Error(j.error||"Something went wrong");return j}
function setSession(j){ACC.token=j.token;ACC.user=j.user;localStorage.setItem("roccos-token",j.token);localStorage.setItem("roccos-user",JSON.stringify(j.user))}
function clearSession(){ACC.token="";ACC.user=null;["roccos-token","roccos-user","roccos-lastsync"].forEach(k=>localStorage.removeItem(k));ACC.lastSync=""}
async function pushCloud(quiet){if(!ACC.token)return;ACC.syncing=true;try{await api("/backup",{method:"PUT",body:JSON.stringify({data:localSnap(),updatedAt:Number(localStorage.getItem(UPD)||Date.now())})});ACC.err="";stampSync();if(!quiet)toast("Backed up ☁️")}catch(e){ACC.err="Couldn't back up: "+e.message}ACC.syncing=false;if(location.hash=="#account")render()}
function stampSync(){ACC.lastSync=new Date().toISOString();localStorage.setItem("roccos-lastsync",ACC.lastSync)}
function applyCloud(b){const d=b.data||{};ACC._applying=true;SYNC_KEYS.forEach(k=>d[k]!=null?localStorage.setItem(k,d[k]):localStorage.removeItem(k));localStorage.setItem(UPD,String(b.updatedAt||Date.now()));ACC._applying=false;stampSync();toast("Restored from your backup ☁️");setTimeout(()=>location.reload(),700)}
async function restoreCloud(){try{const b=await api("/backup");if(!b.data){toast("No backup found yet");return}if(!confirm("Replace what's on this device with your cloud backup from "+new Date(b.updatedAt).toLocaleString()+"?"))return;applyCloud(b)}catch(e){toast(e.message)}}
// after sign-in: newer side wins
async function mergeCloud(){try{const b=await api("/backup"),lu=Number(localStorage.getItem(UPD)||0);if(b.data&&b.updatedAt>lu){applyCloud(b);return}await pushCloud(true)}catch(e){ACC.err="Sync failed. Check your connection."}}
async function rcLink(uid){if(!RC()||CONFIG.REVENUECAT_IOS_API_KEY.includes("_HERE"))return;try{uid?await PL.Purchases.logIn({appUserID:uid.replace(/[^A-Za-z0-9._:-]/g,"_")}):await PL.Purchases.logOut();await refreshEnt();loadSub()}catch(e){console.log("RC link",e)}}
async function afterSignIn(j){setSession(j);toast("Signed in ✅");render();await mergeCloud();render()}
const APPLE_OK=NATIVE&&!!PL.SignInWithApple;
async function appleSignIn(){try{const r=await PL.SignInWithApple.authorize({clientId:"com.tracetarver.roccosacademy",redirectURI:"https://traceitarver.github.io/roccos-academy/",scopes:"email name"});
 const x=r.response,name=[x.givenName,x.familyName].filter(Boolean).join(" ");await afterSignIn(await api("/auth/apple",{method:"POST",body:JSON.stringify({identityToken:x.identityToken,name})}))}
 catch(e){if(!/cancel|1001/i.test(String(e&&(e.message||e.code))))toast(e.message||"Apple sign-in failed")}}
async function emailStart(){const e=$("#ae").value.trim();if(!e){toast("Enter your email first");return}try{await api("/auth/email/start",{method:"POST",body:JSON.stringify({email:e})});ACC.codeFor=e;toast("Code sent to "+e);render()}catch(x){toast(x.message)}}
async function emailVerify(){const c=$("#ac").value.trim();try{await afterSignIn(await api("/auth/email/verify",{method:"POST",body:JSON.stringify({email:ACC.codeFor,code:c})}));ACC.codeFor=""}catch(x){toast(x.message)}}
async function signOutAcc(){await pushCloud(true);clearSession();ACC.codeFor="";toast("Signed out. Your data stays on this device");render()}
async function deleteAcc(){if(!confirm("Delete your account and all cloud backup data? This can't be undone. Data on this device stays. Subscriptions must be canceled separately in App Store settings."))return;
 try{await api("/account",{method:"DELETE"});clearSession();toast("Account deleted");render()}catch(x){toast(x.message)}}
// ---- subscription info ----
const PLAN_NAME={[CONFIG.PRODUCTS.monthly]:"Plus Monthly",[CONFIG.PRODUCTS.yearly]:"Plus Yearly",[CONFIG.PRODUCTS.lifetime]:"Lifetime"};
async function loadSub(){if(!RC()||CONFIG.REVENUECAT_IOS_API_KEY.includes("_HERE"))return;try{const r=await PL.Purchases.getCustomerInfo(),e=r.customerInfo.entitlements.active[CONFIG.ENTITLEMENT];
 ACC.sub=e?{plan:PLAN_NAME[e.productIdentifier]||"Plus",trial:e.periodType=="TRIAL",exp:e.expirationDate,renew:e.willRenew,lifetime:e.productIdentifier==CONFIG.PRODUCTS.lifetime||!e.expirationDate}:null;if(location.hash=="#account")render()}catch(e){console.log(e)}}
function subInfo(){if(ACC.sub)return ACC.sub;if(localStorage.getItem("roccos-dev-plus"))return{plan:"Plus (test mode)",dev:true};if(isPlus())return{plan:"Plus"};return null}
const fmtD=d=>d?new Date(d).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}):"";
function manageSub(){const u="https://apps.apple.com/account/subscriptions";NATIVE?window.open(u,"_system"):window.open(u,"_blank")}
const kv=(k,v)=>`<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid #ebe8de"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
V.account=()=>{const u=ACC.user,s=subInfo();let prof;
 if(!ACC_ON)prof=`<div class="card"><b>☁️ Cloud backup is unavailable</b><p class="muted">Everything is saved on this device.</p></div>`;
 else if(u)prof=`<div class="card"><div class="row"><div class="avatar">👤</div><div class="grow"><b>${esc(u.name||u.email||"Signed in with Apple")}</b><div class="muted">${esc(u.email||"")}</div><div class="muted">${u.method=="apple"?"Signed in with Apple":"Signed in with email"}${u.created?" · Member since "+fmtD(u.created):""}</div></div></div>
  ${kv("Auto-backup",ACC.syncing?"Backing up…":"✅ On")}${kv("Last backup",ACC.lastSync?new Date(ACC.lastSync).toLocaleString():"Not yet")}${ACC.err?`<p class="muted" style="color:#c0392b">${esc(ACC.err)}</p>`:""}
  <div class="row" style="margin-top:12px"><button class="grow" onclick="pushCloud()">Back up now</button><button class="ghost grow" onclick="restoreCloud()">Restore from backup</button></div>
  <button class="ghost" style="width:100%;margin-top:10px" onclick="signOutAcc()">Sign out</button></div>`;
 else prof=`${roccoTip("Make a free account and I'll back up everything: your dogs, progress, plan, journal, and streak. Sign in on any device to pick up where you left off.")}<div class="card"><b style="display:block;margin-bottom:8px">Sign in or create an account</b>
  ${APPLE_OK?`<button style="width:100%;margin-bottom:12px;background:#000;color:#fff" onclick="appleSignIn()"> Sign in with Apple</button><p class="muted" style="text-align:center;margin:0 0 8px">or use your email</p>`:""}
  ${ACC.codeFor?`<p class="muted">We emailed a 6-digit code to <b>${esc(ACC.codeFor)}</b>.</p><label>Code</label><input id="ac" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">
  <div class="row"><button class="grow" onclick="emailVerify()">Sign in</button><button class="ghost grow" onclick="ACC.codeFor='';render()">Use a different email</button></div>`
  :`<label>Email</label><input id="ae" type="email" autocomplete="email" placeholder="you@example.com"><button style="width:100%" onclick="emailStart()">Email me a sign-in code</button>`}
  <p class="muted" style="text-align:center">Accounts are optional. You can keep using the app without one.</p></div>`;
 const sub=`<h2>My Subscription</h2><div class="card">${s?`<div class="row"><div class="ic" style="font-size:28px">⭐</div><div class="grow"><b style="font-size:18px">${s.plan}</b></div><span class="badge b2">${s.trial?"Free trial":"Active"}</span></div>
  ${kv("Status",s.trial?"In 7-day free trial":"Active")}${s.lifetime?kv("Access","Forever, no renewals"):s.exp?kv(s.renew?(s.trial?"Trial ends / first charge":"Renews on"):"Expires on",fmtD(s.exp)):""}${s.dev?`<p class="muted">Test mode is on (?dev=plus). Real purchases show here in the iPhone app.</p>`:""}
  <div class="row" style="margin-top:12px">${s.lifetime||s.dev?"":`<button class="grow" onclick="manageSub()">Manage subscription</button>`}<button class="ghost grow" onclick="restore()">Restore purchases</button></div>`
  :`<div class="row"><div class="ic" style="font-size:28px">🐾</div><div class="grow"><b style="font-size:18px">Free</b><div class="muted">7 core lessons, timer, clicker, log & streak</div></div></div>
  <button style="width:100%;margin-top:12px" onclick="location.hash='paywall'">Upgrade to Plus: 7 days free</button><div class="row" style="margin-top:10px"><button class="ghost grow" onclick="restore()">Restore purchases</button>${NATIVE?`<button class="ghost grow" onclick="manageSub()">Manage subscription</button>`:""}</div>`}
  <p class="muted" style="font-size:12px">Subscriptions are billed through your Apple ID and managed in App Store settings. Deleting your account doesn't cancel a subscription.</p></div>`;
 const del=u?`<div class="card"><b>Danger zone</b><p class="muted">Permanently delete your account and cloud backup.</p><button class="ghost" style="color:#c0392b" onclick="deleteAcc()">Delete account</button></div>`:"";
 return `<h2>Account</h2>`+prof+sub+del+`<p class="muted" style="text-align:center;font-size:13px">Need help? <a href="mailto:${CONFIG.SUPPORT_EMAIL}">${CONFIG.SUPPORT_EMAIL}</a><br><a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> · <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener">Terms of Use</a></p>`};
// header account button
(function(){const h=document.querySelector("header");if(!h||document.getElementById("accBtn"))return;h.style.position="relative";const a=document.createElement("a");a.id="accBtn";a.href="#account";a.setAttribute("aria-label","Account");a.textContent="👤";a.style.cssText="position:absolute;top:calc(22px + env(safe-area-inset-top));right:18px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;font-size:22px;text-decoration:none";h.appendChild(a)})();
loadSub();if(ACC.token)api("/me").then(j=>{ACC.user=j.user;localStorage.setItem("roccos-user",JSON.stringify(j.user))}).catch(()=>{});render();
