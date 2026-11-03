// Accounts (Firebase Auth + Firestore cloud sync) and the Account / My Subscription screen
const SYNC_KEYS=[K,DK,"roccos-plus"],UPD="roccos-updated";
const FB_ON=!!(CONFIG.FIREBASE_CONFIG&&CONFIG.FIREBASE_CONFIG.apiKey&&!CONFIG.FIREBASE_CONFIG.apiKey.includes("_HERE"));
const ACC={user:null,ready:!FB_ON,syncing:false,lastSync:localStorage.getItem("roccos-lastsync")||"",err:"",sub:null};
let FB=null,pushT=null;
// mark local data as changed + schedule a cloud push whenever app data is saved
(function(){const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){o.call(this,k,v);if(this===localStorage&&SYNC_KEYS.includes(k)&&!ACC._applying){o.call(this,UPD,String(Date.now()));schedulePush()}}})();
function schedulePush(){if(!ACC.user)return;clearTimeout(pushT);pushT=setTimeout(pushCloud,1500)}
const localSnap=()=>{const d={};SYNC_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!=null)d[k]=v});return d};
async function loadFB(){if(FB||!FB_ON)return FB;const v="10.12.2",b=`https://www.gstatic.com/firebasejs/${v}/firebase-`;
 const [a,au,fs]=await Promise.all([import(b+"app.js"),import(b+"auth.js"),import(b+"firestore.js")]);
 const app=a.initializeApp(CONFIG.FIREBASE_CONFIG);FB={au,fs,auth:au.getAuth(app),db:fs.getFirestore(app)};return FB}
const docRef=()=>FB.fs.doc(FB.db,"users",ACC.user.uid);
async function pushCloud(){if(!ACC.user||!FB)return;try{await FB.fs.setDoc(docRef(),{data:localSnap(),updatedAt:Number(localStorage.getItem(UPD)||Date.now()),email:ACC.user.email||""});stampSync()}catch(e){ACC.err="Couldn't save to the cloud";console.log(e)}}
function stampSync(){ACC.lastSync=new Date().toISOString();localStorage.setItem("roccos-lastsync",ACC.lastSync);if(location.hash=="#account")render()}
async function mergeCloud(){ACC.syncing=true;try{const s=await FB.fs.getDoc(docRef()),lu=Number(localStorage.getItem(UPD)||0);
 if(s.exists()&&Number(s.data().updatedAt||0)>lu){const d=s.data().data||{};ACC._applying=true;SYNC_KEYS.forEach(k=>d[k]!=null?localStorage.setItem(k,d[k]):localStorage.removeItem(k));localStorage.setItem(UPD,String(s.data().updatedAt));ACC._applying=false;stampSync();toast("Synced from your account ☁️");setTimeout(()=>location.reload(),600);return}
 await pushCloud()}catch(e){ACC.err="Sync failed. Check your connection.";console.log(e)}ACC.syncing=false}
async function rcLink(uid){if(!RC()||CONFIG.REVENUECAT_IOS_API_KEY.includes("_HERE"))return;try{uid?await PL.Purchases.logIn({appUserID:uid}):await PL.Purchases.logOut();await refreshEnt();loadSub()}catch(e){console.log("RC link",e)}}
async function accInit(){if(!FB_ON)return;try{await loadFB();FB.au.onAuthStateChanged(FB.auth,async u=>{const was=ACC.user;ACC.user=u;ACC.ready=true;if(u){await rcLink(u.uid);if(!was)await mergeCloud()}render()})}catch(e){ACC.ready=true;ACC.err="Accounts are unavailable offline";console.log(e)}}
const fbMsg=e=>({"auth/invalid-credential":"Wrong email or password","auth/wrong-password":"Wrong email or password","auth/user-not-found":"No account with that email","auth/email-already-in-use":"That email already has an account. Sign in instead","auth/weak-password":"Password needs at least 6 characters","auth/invalid-email":"That email doesn't look right","auth/requires-recent-login":"Please sign out and back in, then try again","auth/popup-closed-by-user":"Sign-in canceled"}[e&&e.code]||"Something went wrong. Try again");
const creds=()=>[$("#ae").value.trim(),$("#ap").value];
async function signUp(){const [e,p]=creds();try{await FB.au.createUserWithEmailAndPassword(FB.auth,e,p);toast("Account created! Your training is backed up ☁️")}catch(x){toast(fbMsg(x))}}
async function signIn(){const [e,p]=creds();try{await FB.au.signInWithEmailAndPassword(FB.auth,e,p);toast("Signed in")}catch(x){toast(fbMsg(x))}}
async function appleSignIn(){try{const pr=new FB.au.OAuthProvider("apple.com");pr.addScope("email");pr.addScope("name");await FB.au.signInWithPopup(FB.auth,pr)}catch(x){toast(fbMsg(x))}}
async function resetPw(){const e=$("#ae").value.trim();if(!e){toast("Enter your email first");return}try{await FB.au.sendPasswordResetEmail(FB.auth,e);toast("Reset link sent to "+e)}catch(x){toast(fbMsg(x))}}
async function signOutAcc(){await pushCloud();await FB.au.signOut(FB.auth);await rcLink(null);toast("Signed out. Your data stays on this device")}
async function deleteAcc(){if(!confirm("Delete your account and all cloud data? This can't be undone. Data on this device stays. Subscriptions must be canceled separately in App Store settings."))return;
 try{await FB.fs.deleteDoc(docRef());await FB.au.deleteUser(FB.auth.currentUser);await rcLink(null);toast("Account deleted")}catch(x){toast(fbMsg(x))}}
// ---- subscription info ----
const PLAN_NAME={[CONFIG.PRODUCTS.monthly]:"Plus Monthly",[CONFIG.PRODUCTS.yearly]:"Plus Yearly",[CONFIG.PRODUCTS.lifetime]:"Lifetime"};
async function loadSub(){if(!RC()||CONFIG.REVENUECAT_IOS_API_KEY.includes("_HERE"))return;try{const r=await PL.Purchases.getCustomerInfo(),e=r.customerInfo.entitlements.active[CONFIG.ENTITLEMENT];
 ACC.sub=e?{plan:PLAN_NAME[e.productIdentifier]||"Plus",trial:e.periodType=="TRIAL",exp:e.expirationDate,renew:e.willRenew,lifetime:e.productIdentifier==CONFIG.PRODUCTS.lifetime||!e.expirationDate}:null;if(location.hash=="#account")render()}catch(e){console.log(e)}}
function subInfo(){if(ACC.sub)return ACC.sub;if(localStorage.getItem("roccos-dev-plus"))return{plan:"Plus (test mode)",dev:true};if(isPlus())return{plan:"Plus"};return null}
const fmtD=d=>d?new Date(d).toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}):"";
function manageSub(){const u="https://apps.apple.com/account/subscriptions";NATIVE?window.open(u,"_system"):window.open(u,"_blank")}
const kv=(k,v)=>`<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3ece8"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
V.account=()=>{const u=ACC.user,s=subInfo();let prof;
 if(!FB_ON)prof=`<div class="card"><b>☁️ Accounts & cloud backup are coming soon</b><p class="muted">Soon you'll be able to create an account to back up your dogs, progress, journal, and streak and use them on any device. For now everything is saved on this device.</p></div>`;
 else if(!ACC.ready)prof=`<div class="card"><p class="muted">Loading your account…</p></div>`;
 else if(u)prof=`<div class="card"><div class="row"><div class="avatar">👤</div><div class="grow"><b>${esc(u.displayName||u.email||"Signed in with Apple")}</b><div class="muted">${esc(u.email||"")}</div><div class="muted">Member since ${fmtD(u.metadata&&u.metadata.creationTime)}</div></div></div>
  ${kv("Cloud backup",ACC.syncing?"Syncing…":"✅ On")}${kv("Last synced",ACC.lastSync?new Date(ACC.lastSync).toLocaleString():"Not yet")}${ACC.err?`<p class="muted" style="color:#c0392b">${esc(ACC.err)}</p>`:""}
  <div class="row" style="margin-top:12px"><button class="grow" onclick="pushCloud().then(()=>toast('Backed up ☁️'))">Sync now</button><button class="ghost grow" onclick="signOutAcc()">Sign out</button></div></div>`;
 else prof=`${rocko("Make a free account and I'll back up everything: your dogs, progress, plan, journal, and streak. Sign in on any device to pick up where you left off.")}<div class="card"><b style="display:block;margin-bottom:8px">Create an account or sign in</b>
  <label>Email</label><input id="ae" type="email" autocomplete="email" placeholder="you@example.com"><label>Password</label><input id="ap" type="password" autocomplete="current-password" placeholder="At least 6 characters">
  <div class="row"><button class="grow" onclick="signUp()">Create account</button><button class="ghost grow" onclick="signIn()">Sign in</button></div>
  <button style="width:100%;margin-top:10px;background:#000" onclick="appleSignIn()"> Sign in with Apple</button>
  <p style="text-align:center;margin:10px 0 0"><a href="javascript:resetPw()">Forgot password?</a></p><p class="muted" style="text-align:center">Accounts are optional. You can keep using the app without one.</p></div>`;
 const sub=`<h2>My Subscription</h2><div class="card">${s?`<div class="row"><div class="ic" style="font-size:28px">⭐</div><div class="grow"><b style="font-size:18px">${s.plan}</b></div><span class="badge b2">${s.trial?"Free trial":"Active"}</span></div>
  ${kv("Status",s.trial?"In 7-day free trial":"Active")}${s.lifetime?kv("Access","Forever, no renewals"):s.exp?kv(s.renew?(s.trial?"Trial ends / first charge":"Renews on"):"Expires on",fmtD(s.exp)):""}${s.dev?`<p class="muted">Test mode is on (?dev=plus). Real purchases show here in the iPhone app.</p>`:""}
  <div class="row" style="margin-top:12px">${s.lifetime||s.dev?"":`<button class="grow" onclick="manageSub()">Manage subscription</button>`}<button class="ghost grow" onclick="restore()">Restore purchases</button></div>`
  :`<div class="row"><div class="ic" style="font-size:28px">🐾</div><div class="grow"><b style="font-size:18px">Free</b><div class="muted">7 core lessons, timer, clicker, log & streak</div></div></div>
  <button style="width:100%;margin-top:12px" onclick="location.hash='paywall'">Upgrade to Plus: 7 days free</button><div class="row" style="margin-top:10px"><button class="ghost grow" onclick="restore()">Restore purchases</button>${NATIVE?`<button class="ghost grow" onclick="manageSub()">Manage subscription</button>`:""}</div>`}
  <p class="muted" style="font-size:12px">Subscriptions are billed through your Apple ID and managed in App Store settings. Deleting your account doesn't cancel a subscription.</p></div>`;
 const del=u?`<div class="card"><b>Danger zone</b><p class="muted">Permanently delete your account and cloud backup.</p><button class="ghost" style="color:#c0392b" onclick="deleteAcc()">Delete account</button></div>`:"";
 return `<h2>Account</h2>`+prof+sub+del+`<p class="muted" style="text-align:center;font-size:13px"><a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a> · <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener">Terms of Use</a></p>`};
// header account button
(function(){const h=document.querySelector("header");if(!h||document.getElementById("accBtn"))return;h.style.position="relative";const a=document.createElement("a");a.id="accBtn";a.href="#account";a.setAttribute("aria-label","Account");a.textContent="👤";a.style.cssText="position:absolute;top:calc(22px + env(safe-area-inset-top));right:18px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;font-size:22px;text-decoration:none";h.appendChild(a)})();
loadSub();accInit();render();
