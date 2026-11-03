# Ask Rocco AI worker
Deploy (one time, from this folder):
1. `npx wrangler login` (opens Cloudflare in the browser)
2. `npx wrangler deploy` → prints https://roccos-ask.<your-subdomain>.workers.dev
3. `npx wrangler secret put XAI_API_KEY` (paste the xAI key)
4. Put that URL in `config.js` → `AI_ENDPOINT`, bump sw.js cache, push.
Limits: question ≤600 chars, last 8 history messages, ~20 questions/hour per IP (per edge instance).
