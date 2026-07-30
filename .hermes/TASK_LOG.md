# Task Log
Last updated: 2026-06-11

## Completed
- 2026-06-11 Live feature disabled (pages 404, APIs 410, components renamed .disabled)
- 2026-06-11 Nav links to /live removed from desktop + mobile
- 2026-06-11 Console.error/warn noise removed from DMs, DMCA, uploads, markdown editor, error.tsx
- 2026-06-11 /api/test/create-upload stubbed to 410
- 2026-06-11 Zod reverted to caret range (user requested no pin)
- 2026-06-11 Supabase migration added: launch_waitlist table
- 2026-06-11 Old Cloudflare D1 waitlist queried: 2 entries (test+jarvis@unmaskr.org, 건우65@twinbash.co)
- 2026-06-11 xurl installed globally
- 2026-06-11 X developer app "unmaskr" registered locally

## In Progress / Blocked
- (none)

## Resolved
- 2026-07-30 X auth 401 fixed: default_app in ~/.xurl was "default" (empty client_id). Switched with `xurl auth default unmaskr` → /2/users/me returns Unmaskr_org OK.

## User Preferences
- Do not mention waitlist repeatedly after it's been acknowledged as resolved/done
- Do not repeat already-completed cleanup items
- Address X auth failure directly, don't hand-wave
