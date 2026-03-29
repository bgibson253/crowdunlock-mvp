# AI Moderator Reference — Unmaskr Forum

This document describes the database schema, RPCs, and workflow the AI moderator uses to review forum content. Use this file to build the moderator prompt.

---

## Overview

The AI moderator reviews **forum threads** and **forum replies** that haven't been moderated yet (or have been disputed by their author). It reads post content, makes a verdict, and calls an RPC to record its decision.

---

## Database Schema (moderation columns)

### `forum_threads` — additional columns

| Column | Type | Default | Description |
|---|---|---|---|
| `moderation_status` | text | `'unreviewed'` | One of: `unreviewed`, `approved`, `flagged`, `rejected`, `disputed` |
| `moderation_reviewed_at` | timestamptz | null | When the AI last reviewed this post |
| `moderation_model` | text | null | Model identifier (e.g. `claude-sonnet-4-20250514`) |
| `moderation_confidence` | smallint (0-100) | null | AI confidence in verdict |
| `moderation_notes` | text | null | AI reasoning / explanation. Dispute reasons appended here. |

### `forum_replies` — same additional columns

Identical columns as above on the `forum_replies` table.

---

## Moderation Statuses

| Status | Meaning |
|---|---|
| `unreviewed` | Never reviewed by AI. **Default for all new posts.** |
| `approved` | AI reviewed and approved (no violations found). |
| `flagged` | AI found potential issues but confidence is below auto-action threshold. Needs human review. |
| `rejected` | AI rejected. If confidence ≥ 90, post is **auto-hidden** (`deleted_at` set). |
| `disputed` | Author disputed a `flagged` or `rejected` decision. Queued for re-review. |

---

## RPCs (Supabase Functions)

### `get_unmoderated_posts(p_limit int default 50)` → jsonb

Returns all threads and replies with `moderation_status IN ('unreviewed', 'disputed')` where `deleted_at IS NULL`, ordered oldest first.

**Response format:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "target_type": "thread",
      "title": "Post title",
      "body": "Full markdown body",
      "author_id": "uuid",
      "author_username": "username",
      "author_display_name": "Display Name",
      "section_id": "general",
      "moderation_status": "unreviewed",
      "created_at": "2026-03-29T..."
    }
  ],
  "replies": [
    {
      "id": "uuid",
      "target_type": "reply",
      "title": null,
      "body": "Reply body text",
      "author_id": "uuid",
      "author_username": "username",
      "author_display_name": "Display Name",
      "thread_id": "uuid",
      "moderation_status": "unreviewed",
      "created_at": "2026-03-29T..."
    }
  ],
  "total": 5
}
```

### `ai_moderate_post(...)` → jsonb

Records the AI's moderation verdict on a single post.

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `p_target_type` | text | ✅ | `'thread'` or `'reply'` |
| `p_target_id` | uuid | ✅ | The post's `id` |
| `p_verdict` | text | ✅ | `'approve'`, `'flag'`, or `'reject'` |
| `p_confidence` | int | ✅ | 0-100 confidence score |
| `p_categories` | jsonb | ❌ | Array of violation categories (see below) |
| `p_reasoning` | text | ❌ | Explanation of verdict |
| `p_model` | text | ❌ | Model name used |
| `p_prompt_version` | text | ❌ | Prompt version (default `'v1'`) |

**Auto-actions:**
- `reject` with confidence ≥ 90 → post is **auto-hidden** (`deleted_at = now()`)
- All other verdicts → post remains visible but status is updated

**Response:**
```json
{
  "ok": true,
  "status": "approved",
  "auto_hidden": false
}
```

### `dispute_moderation(...)` → jsonb

Called by authenticated users (post authors only) to dispute a `flagged` or `rejected` decision. Sets status back to `disputed` for re-review.

**Parameters:**
- `p_target_type` — `'thread'` or `'reply'`
- `p_target_id` — post `id`
- `p_reason` — optional dispute reason (appended to `moderation_notes`)

---

## Violation Categories

Use these standardized category slugs in `p_categories`:

| Slug | Description |
|---|---|
| `spam` | Promotional content, bot-like posting, link farming |
| `harassment` | Targeted abuse, threats, bullying, doxxing |
| `hate_speech` | Slurs, dehumanization, identity-based attacks |
| `misinformation` | Demonstrably false claims presented as fact |
| `nsfw` | Sexually explicit or graphic violent content |
| `off_topic` | Irrelevant to the section/thread context |
| `self_harm` | Encouraging or glorifying self-harm or suicide |
| `illegal` | Content promoting illegal activity |
| `manipulation` | Coordinated inauthentic behavior, sock puppets |

**Example `p_categories`:**
```json
["spam", "misinformation"]
```

---

## Audit Trail

Every call to `ai_moderate_post()` is logged in `ai_moderation_log`:

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Log entry ID |
| `target_type` | text | `'thread'` or `'reply'` |
| `target_id` | uuid | Post ID |
| `verdict` | text | `'approve'`, `'flag'`, `'reject'`, `'review'` |
| `confidence` | smallint | 0-100 |
| `categories` | jsonb | Violation categories array |
| `reasoning` | text | AI reasoning text |
| `model_used` | text | Model identifier |
| `prompt_version` | text | Prompt version |
| `created_at` | timestamptz | When moderation occurred |

User disputes are also logged with `verdict = 'review'`, `model_used = 'user_dispute'`.

---

## AI Moderator Workflow

```
1. Call get_unmoderated_posts(50)
2. For each post in response:
   a. Read the body (and title if thread)
   b. Consider: section context, author history, community guidelines
   c. Determine verdict: approve | flag | reject
   d. Assign confidence (0-100)
   e. List any violation categories
   f. Write brief reasoning
   g. Call ai_moderate_post(target_type, target_id, verdict, confidence, categories, reasoning, model, prompt_version)
3. Posts with status='disputed':
   - Re-read the dispute reason (in moderation_notes after "DISPUTE:")
   - Re-evaluate with the author's context in mind
   - May approve, re-flag, or re-reject
4. Repeat on schedule (cron / heartbeat)
```

---

## Confidence Guidelines

| Confidence | When to use |
|---|---|
| **95-100** | Slam dunk. Obvious spam, clear slurs, unambiguous violations. |
| **80-94** | Strong signal but some nuance. Borderline language, context-dependent. |
| **60-79** | Uncertain. Could go either way. Should be flagged for human review. |
| **Below 60** | Low confidence. Default to `approve` unless multiple red flags. |

**Important:** Only `reject` with confidence ≥ 90 triggers auto-hide. Use `flag` for anything you're not sure about — it surfaces to human admins without hiding the post.

---

## Key Principles

1. **Bias toward approval.** This is a community forum. Free speech matters. Only reject clear violations.
2. **Context matters.** A post in "General Discussion" has different standards than a formal data request.
3. **Disputed posts get a second chance.** If someone disputes, re-read with fresh eyes. The default should shift toward approval unless the violation is unambiguous.
4. **Be transparent.** Always include reasoning. Users and admins should understand why a decision was made.
5. **Don't moderate opinions.** Unpopular or controversial opinions are not violations. Only factual misinformation, abuse, or rule-breaking content should be flagged.
