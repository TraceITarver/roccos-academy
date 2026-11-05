// Rocco's Academy — accounts + cloud backup (Cloudflare Worker + KV)
// Bindings: KV namespace DATA. Secrets: SESSION_SECRET (required), RESEND_API_KEY (optional, enables email codes), MAIL_FROM (optional).
const ORIGINS = ["https://traceitarver.github.io", "capacitor://localhost", "http://localhost", "https://localhost"];
const BUNDLE = "com.tracetarver.roccosacademy", MAX_BLOB = 4 * 1024 * 1024, SESSION_DAYS = 180;
const enc = new TextEncoder();
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const sha = async s => b64u(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function hmac(secret, msg) { const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(msg))); }
function cors(req) { const o = req.headers.get("Origin") || ""; return { "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0], "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization", "Vary": "Origin" }; }
const J = (req, d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...cors(req) } });

async function verifyApple(token) {
  const [h, p, sig] = token.split("."); const hd = JSON.parse(new TextDecoder().decode(ub64u(h))), pl = JSON.parse(new TextDecoder().decode(ub64u(p)));
  const jwks = await (await fetch("https://appleid.apple.com/auth/keys", { cf: { cacheTtl: 3600 } })).json();
  const jwk = jwks.keys.find(k => k.kid === hd.kid); if (!jwk || hd.alg !== "RS256") throw new Error("bad key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, ub64u(sig), enc.encode(h + "." + p))) throw new Error("bad sig");
  const aud = Array.isArray(pl.aud) ? pl.aud : [pl.aud];
  if (pl.iss !== "https://appleid.apple.com" || !aud.includes(BUNDLE) || pl.exp * 1000 < Date.now()) throw new Error("bad claims");
  return pl;
}
async function makeSession(env, uid) { const exp = Date.now() + SESSION_DAYS * 864e5, body = b64u(enc.encode(JSON.stringify({ uid, exp }))); return body + "." + await hmac(env.SESSION_SECRET, body); }
async function auth(req, env) {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer /, ""); const [body, sig] = t.split(".");
  if (!body || !sig || sig !== await hmac(env.SESSION_SECRET, body)) return null;
  const s = JSON.parse(new TextDecoder().decode(ub64u(body))); if (s.exp < Date.now()) return null;
  const prof = await env.DATA.get("user:" + s.uid, "json"); return prof ? { uid: s.uid, prof } : null;
}
async function upsertUser(env, uid, info) { const k = "user:" + uid, cur = await env.DATA.get(k, "json") || { created: Date.now() }; const p = { ...cur, ...Object.fromEntries(Object.entries(info).filter(([, v]) => v)) }; await env.DATA.put(k, JSON.stringify(p)); return p; }
async function limit(env, key, max, ttl) { const n = Number(await env.DATA.get("rl:" + key) || 0); if (n >= max) return false; await env.DATA.put("rl:" + key, String(n + 1), { expirationTtl: ttl }); return true; }

async function sendCode(env, email, code) {
  if (!env.RESEND_API_KEY) throw new Error("email-not-configured");
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM || "Rocco's Academy <onboarding@resend.dev>", to: [email], subject: `Your Rocco's Academy code: ${code}`,
      text: `Your Rocco's Academy sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't ask for this, you can ignore this email.` }) });
  if (!r.ok) throw new Error("send failed " + r.status);
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
    const path = new URL(req.url).pathname, ip = req.headers.get("CF-Connecting-IP") || "x";
    try {
      if (path === "/auth/apple" && req.method === "POST") {
        const { identityToken, name } = await req.json(); const pl = await verifyApple(identityToken || "");
        const uid = "apple:" + pl.sub, prof = await upsertUser(env, uid, { method: "apple", email: pl.email, name });
        return J(req, { token: await makeSession(env, uid), user: prof });
      }
      if (path === "/auth/email/start" && req.method === "POST") {
        const email = String((await req.json()).email || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return J(req, { error: "That email doesn't look right" }, 400);
        if (!await limit(env, "ip:" + ip, 10, 3600) || !await limit(env, "em:" + email, 5, 3600)) return J(req, { error: "Too many codes requested. Try again later." }, 429);
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, "0");
        await env.DATA.put("otp:" + await sha(email), JSON.stringify({ h: await sha(email + ":" + code), tries: 0 }), { expirationTtl: 600 });
        try { await sendCode(env, email, code); } catch (e) { return J(req, { error: e.message === "email-not-configured" ? "Email sign-in isn't available yet. Try Sign in with Apple." : "Couldn't send the email. Try again." }, 503); }
        return J(req, { ok: true });
      }
      if (path === "/auth/email/verify" && req.method === "POST") {
        const b = await req.json(), email = String(b.email || "").trim().toLowerCase(), code = String(b.code || "").trim(), k = "otp:" + await sha(email);
        const o = await env.DATA.get(k, "json"); if (!o) return J(req, { error: "Code expired. Request a new one." }, 400);
        if (o.h !== await sha(email + ":" + code)) { o.tries++; if (o.tries >= 5) await env.DATA.delete(k); else await env.DATA.put(k, JSON.stringify(o), { expirationTtl: 600 }); return J(req, { error: "Wrong code" }, 400); }
        await env.DATA.delete(k); const uid = "email:" + await sha(email), prof = await upsertUser(env, uid, { method: "email", email });
        return J(req, { token: await makeSession(env, uid), user: prof });
      }
      const a = await auth(req, env); if (!a) return J(req, { error: "Please sign in again" }, 401);
      if (path === "/me") return J(req, { user: a.prof });
      if (path === "/backup" && req.method === "GET") { const v = await env.DATA.get("blob:" + a.uid, "json"); return J(req, v || { data: null, updatedAt: 0 }); }
      if (path === "/backup" && req.method === "PUT") {
        const txt = await req.text(); if (txt.length > MAX_BLOB) return J(req, { error: "Backup too large" }, 413);
        const b = JSON.parse(txt); if (typeof b.data !== "object") return J(req, { error: "bad data" }, 400);
        const v = { data: b.data, updatedAt: Number(b.updatedAt) || Date.now(), savedAt: Date.now() }; await env.DATA.put("blob:" + a.uid, JSON.stringify(v)); return J(req, { ok: true, savedAt: v.savedAt });
      }
      if (path === "/account" && req.method === "DELETE") { await env.DATA.delete("blob:" + a.uid); await env.DATA.delete("user:" + a.uid); return J(req, { ok: true }); }
      return J(req, { error: "not found" }, 404);
    } catch (e) { return J(req, { error: "Sign-in failed" }, 400); }
  }
};
