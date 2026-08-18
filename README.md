# Arjam Connect

Minimal working customer inquiry and chatbot prototype for **Arjam Travel & Tours**.

## Prototype roles

- **Arjam Dashboard** — unified inbox, inquiry details, FAQ coverage, chatbot status, human takeover, and dashboard metrics.
- **Demo Tester** — customer-side simulator for Facebook Messenger, Instagram, and TikTok channel adapters.

## Working prototype features

- Two-role entry flow
- Cross-window live updates with `BroadcastChannel` + `localStorage`
- Simulated Facebook Messenger, Instagram, and TikTok adapters
- 15 FAQ/intents including pricing, packages, Bohol, Panglao, pickup, accommodation, booking, payment, groups, and human handoff
- English + common Filipino/Bisaya shorthand keywords such as `hm`, `pila`, `pax`
- Minimal inquiry extraction for destination, guest counts, adults/children, and origin
- Automatic status progression
- Human agent takeover / return-to-AI flow
- Seeded dashboard conversations for presentation
- No fabricated package prices, payment accounts, availability, or booking confirmations

## Stack

- Next.js 16
- React 19
- TypeScript
- CSS (dependency-minimal prototype)

The prototype intentionally keeps persistence client-side so the presentation does not depend on external API keys. The storage and messaging interfaces can later be replaced with Supabase/PostgreSQL and production Meta/TikTok adapters.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For the strongest demo, open **Arjam Dashboard** and **Demo Tester** in two side-by-side browser windows on the same origin.
