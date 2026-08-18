# Arjam Connect

Presentation-grade minimum working prototype for **Arjam Travel & Tours**.

Arjam Connect demonstrates how customer inquiries from Facebook Messenger, Instagram, and TikTok can be normalized into one travel inquiry workspace with automated FAQ handling, structured lead qualification, and human agent takeover.

## Prototype boundary

This repository deliberately separates **working application behavior** from **production social API authorization**.

Working in this prototype:

- role-based demo login
- Arjam client operations dashboard
- unified inbox with search and workflow filters
- simulated Messenger, Instagram, and TikTok inbound conversations
- 18 editable FAQ categories
- conversational FAQ matching
- multi-turn travel inquiry qualification
- destination, travel date, guest count, origin, accommodation, transport, and phone extraction
- qualified lead state
- human-agent handoff and return to automation
- customer directory
- inquiry analytics
- cross-window live synchronization using `BroadcastChannel` + browser storage events
- deterministic seeded demo reset

Not represented as production-ready:

- Meta production authorization
- TikTok Business Messaging production authorization
- real customer data persistence
- production authentication
- payment processing
- booking confirmation
- live package inventory

## Demo accounts

### Arjam Operations

- Email: `arjam@demo.local`
- Password: `arjam2026`

### Demo Tester

- Email: `tester@demo.local`
- Password: `demo2026`

The login screen also provides a one-click seeded demo access option.

## Recommended client demo

1. Open **Arjam Operations** in one browser window.
2. Open **Demo Tester** in a second window.
3. Start a TikTok simulation.
4. Send: `Hi, how much is a Bohol package?`
5. Send: `5 pax`
6. Send: `September 20`
7. Show the Arjam inbox automatically capturing and qualifying the inquiry.
8. From the tester, send: `I want to speak with a human agent.`
9. Show **Needs human** on the Arjam side.
10. Click **Take over**, reply from Arjam, and show that response on the tester side.

## Stack

- Next.js 16
- React 19
- TypeScript
- CSS design system with no external UI dependency
- browser-local prototype persistence

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Architecture direction

The prototype uses one normalized conversation model. Production channel adapters can later map Meta and TikTok webhook events into that model without rewriting the inbox, chatbot workflow, or customer state.

```text
Messenger / Instagram / TikTok
             │
      channel adapters
             │
             ▼
 normalized conversation model
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
  inbox   chatbot   inquiry
                   workflow
```

For production, replace browser persistence with a server-side store such as PostgreSQL/Supabase, replace demo authentication with real Auth/RBAC, and connect approved social messaging adapters.
