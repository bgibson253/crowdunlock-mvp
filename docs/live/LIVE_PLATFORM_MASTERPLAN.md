# CrowdUnlock Live — Masterplan (2026)

This is the long-haul architecture for building the best live streaming platform available.

## Objectives
- **Best-in-class iPhone Safari reliability**
- **Sub-second latency** with graceful degradation
- **Massive scale** (1 → many) with predictable costs
- **Creator-grade monetization** (coins/gifts/tips/subs) and anti-fraud
- **Realtime interactivity** that survives reconnects
- **Observability-first** (QoS, errors, session replay)

## Architecture: 3 planes
### 1) Media Plane (WebRTC)
**Purpose:** move audio/video with minimal latency.

- **SFU:** mediasoup (self-hosted)
- **TURN:** coturn (redundant, multi-region)
- **Simulcast + SVC:** VP9/AV1 where available; H264 baseline for iOS
- **Dynamic adaptation:** per-viewer bitrate, layer selection
- **Region routing:** host region pins room; viewers join best edge → routed to room region

### 2) Realtime State Plane (Signaling + Events)
**Purpose:** everything that must be realtime AND consistent.

- **Signaling:** Cloudflare Workers + Durable Objects (room DO)
- **Room state:** participants, roles, producers, chat sequence, gift counters
- **Replay:** event log since last ack (clients reconnect cleanly)
- **Auth:** Supabase JWT + room-scoped capability tokens

### 3) Product/Commerce Plane
**Purpose:** identity, permissions, billing, payouts, moderation.

- Supabase Postgres (RLS)
- Stripe (Checkout + Connect + webhooks)
- Append-only ledgers:
  - spend ledger (`user_spend_events`)
  - coin ledger (mint/spend)
  - payout ledger

## Roadmap (ship in vertical slices)
### Milestone 1 — Own the pipeline (E2E)
- Host: publish camera+mic to SFU
- Viewer: consume and play
- TURN fallback enabled
- Basic room join/leave + reconnect

### Milestone 2 — Interactive core
- Chat (ordered, replayable)
- Reactions (aggregated)
- Gifts (coins → gift events) realtime overlay

### Milestone 3 — Creator monetization
- Creator wallet
- Stripe Connect onboarding
- Auto payout batching + fraud checks

### Milestone 4 — Discovery engine
- Live feed ranking by:
  - retention
  - gift velocity
  - chat velocity
  - QoS score
- Shadowban/quality suppression for poor streams

### Milestone 5 — Multi-region scale
- East/West SFUs
- Room placement + spillover
- Optional relay SFUs for global

## What “best” means (non-negotiables)
- **iOS Safari works** (user gesture, autoplay rules, TURN)
- **Reconnection is instant** (resume state and subscriptions)
- **Quality adapts automatically** (no spinning wheel)
- **Safety:** abuse throttling, reporting, moderation hooks
- **Monetization:** measurable, ledgered, idempotent

