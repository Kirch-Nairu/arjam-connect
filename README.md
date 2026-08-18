# Arjam Connect

Minimum working prototype for **Arjam Travel & Tours**.

Arjam Connect demonstrates how customer inquiries from Facebook Messenger, Instagram, and TikTok can be normalized into one travel inquiry workspace with automated FAQ handling, structured lead qualification, and human agent takeover.

## What is working

- Arjam workspace and Demo Customer login
- unified inbox
- simulated Messenger, Instagram, and TikTok conversations
- 18 editable FAQ responses
- stateful multi-turn chatbot qualification
- destination, date, guest count, origin, accommodation, transport, and phone extraction
- qualified inquiry status
- human takeover and return to assistant
- customer directory
- shared LAN state hosted by the laptop

## LAN demo architecture

The laptop is the server and the single source of truth.

```text
Phone / Demo Customer
        │
        │  Wi-Fi / LAN
        ▼
http://LAPTOP-IP:3000
        │
        ▼
Next.js /api/state
        │
        ├── chatbot engine
        ├── FAQ knowledge
        └── data/arjam-state.json
        │
        ▼
Laptop / Arjam Workspace
```

Unlike the earlier browser-only prototype, conversations are no longer stored separately in each device's `localStorage`. Both the phone and laptop read and write the same state through the laptop API.

## Demo accounts

### Arjam workspace

- Email: `arjam@demo.local`
- Password: `arjam2026`

### Demo customer

- Email: `tester@demo.local`
- Password: `demo2026`

## Run on the laptop for LAN access

Install and build once:

```powershell
cd D:\arjam-connect
npm install
npm run build
```

Start the production server on all network interfaces:

```powershell
npm run start -- -H 0.0.0.0
```

Find the laptop IPv4 address:

```powershell
ipconfig
```

If the laptop address is `192.168.1.25`, use:

- Laptop Arjam workspace: `http://localhost:3000/arjam?auto=1`
- Phone Demo Customer: `http://192.168.1.25:3000/demo?auto=1`

Both devices must be connected to the same LAN or Wi-Fi network.

If Windows Firewall blocks the phone, run PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Arjam Connect 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Recommended live demonstration

1. Keep the Arjam workspace open on the laptop.
2. Connect the phone to the same Wi-Fi/LAN.
3. Open the phone using `http://<LAPTOP-IP>:3000/demo?auto=1`.
4. Start a TikTok conversation.
5. Send: `Hi, how much is a Bohol package?`
6. Send: `5 pax`
7. Send: `September 20`
8. Show the laptop inbox receiving the same conversation and marking the inquiry as qualified.
9. Send from the phone: `I want to speak with a human agent.`
10. On the laptop, click **Take over** and reply manually.
11. Show the agent reply appearing on the phone.

## Stack

- Next.js 16
- React 19
- TypeScript
- Next.js Route Handler API
- laptop-owned JSON demo persistence
- deterministic FAQ/chatbot engine
- polling-based LAN synchronization

## Prototype boundary

The social channels are simulated transport adapters. The chatbot, inquiry state, shared LAN data, FAQ editing, qualification flow, inbox, and human handoff are functional.

Production work would replace the JSON demo store with PostgreSQL/Supabase, replace demo authentication with real Auth/RBAC, and connect approved Meta and TikTok messaging APIs.
