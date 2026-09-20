# 03 — Phase 1 state & rollback

Date: 2026-09-21 · Lambda `scs-lead-mailer` v2 is **live in production mode**.

---

## What changed in your AWS account

| Resource | Change | Reversible? |
|---|---|---|
| Lambda `scs-lead-mailer` | Code replaced with v2 | Yes — see rollback below |
| Lambda timeout | 15s → **30s** | Yes, one CLI call |
| Lambda env | Supabase vars **removed**; DynamoDB + flags added | Yes |
| IAM `scs-lead-mailer-role` | Added inline policy `dynamodb-leads` (PutItem/UpdateItem/Query/GetItem on one table only — no delete, no scan) | Yes, detach policy |
| **DynamoDB `scs-leads`** | **Created.** On-demand billing, GSIs `by_month`, `by_ip` | Yes, delete table |

Nothing on the website changed. No DNS. No email to any real person. No forms wired yet.

---

## Why Supabase was replaced

The project host `cfivbhuoxlitfoubmxwv.supabase.co` returns **NXDOMAIN** — the project is gone. Every lead's durable-store write had been failing silently (the Lambda swallowed the error and returned `200`). There was no backup copy of any lead.

DynamoDB was chosen because it removes that entire failure class:
- same account and region as the Lambda — no third-party dependency
- cannot be paused or reaped for inactivity, which is what killed the last one
- IAM role instead of a shared `service_role` key — one less secret to leak or rotate
- schemaless, so new lead fields never need a migration
- on-demand billing: at 5–7 leads/week the cost is effectively zero

**The 7 rows from `.deploy/leads-backup-20260905-123516.json` were restored** (ids prefixed `legacy-`, `tier=LEGACY`). All 7 turned out to be test submissions — your own address and `test@example.com` — so **no real customer lead was lost.**

---

## Verified live (end-to-end, against the real endpoint)

| Drill | Result |
|---|---|
| HOT lead | `{"ok":true,"tier":"HOT","stored":true,"owner":true,"attempts":1}` in 2.2s |
| Row written before send | ✅ `delivery_status` went `pending` → `sent` |
| `Reply-To` = lead's address | ✅ replying reaches the lead |
| Honeypot bot | `{"ok":true}` returned, **nothing stored** |
| Disposable email | 400 refused |
| Malformed email | 400 refused |
| Bare probe (no name/message) | 400 refused |
| **Legacy contact-form payload** | ✅ `stored:true, owner:true` — forms on the live site keep working |
| Newsletter (email only) | ✅ accepted |
| Auto-ack | `visitor:false` — correctly OFF |

Plus **26/26 unit tests** (`node backend/lead/test.mjs`), including a deliberate 3-attempt delivery-failure drill.

---

## Current flag state

```
LEAD_TEST_MODE      = false     (production)
AUTO_ACK_ENABLED    = false     (visitor auto-reply OFF — awaiting your copy approval)
RATE_LIMIT_PER_HOUR = 5         (per IP)
LEADS_TABLE         = scs-leads
TURNSTILE_SECRET    = (unset — CAPTCHA skipped, logged when skipped)
ANTHROPIC_API_KEY   = (unset — AI summary/draft reply skipped)
FALLBACK_WEBHOOK_URL= (unset — no second-channel alert on delivery failure)
```

---

## Still not working, and why

| Item | Blocker | Owner |
|---|---|---|
| **Visitor auto-replies** | SES is in **sandbox** — can only send to verified addresses. Would fail for every real lead. | You: request SES production access |
| **AI summary + drafted reply** | `ANTHROPIC_API_KEY` not set on the Lambda | You: provide key, I'll set it |
| **CAPTCHA** | `TURNSTILE_SECRET` not set | You: create Cloudflare Turnstile keys |
| **Delivery-failure fallback alert** | `FALLBACK_WEBHOOK_URL` not set | You: pick a channel (Slack/Telegram/Tawk) |
| **SPF/DKIM for SES** | DNS change, needs your approval | You: I'll supply exact records |

None of these block lead capture. Owner email + durable storage work today.

---

## Rollback

```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"; export AWS_PROFILE=prod

# 1. restore the previous function code
aws lambda update-function-code --function-name scs-lead-mailer --region ap-south-1 \
  --zip-file fileb://<scratchpad>/scs-lead-mailer-ROLLBACK-20260921-024700.zip

# 2. restore the old env + timeout
aws lambda update-function-configuration --function-name scs-lead-mailer --region ap-south-1 \
  --timeout 15 \
  --environment "Variables={OWNER_EMAIL=het.soni@soniconsultancyservices.com,FROM_EMAIL=het.soni@soniconsultancyservices.com}"

# 3. optional — remove the new table and policy
aws dynamodb delete-table --table-name scs-leads --region ap-south-1
aws iam delete-role-policy --role-name scs-lead-mailer-role --policy-name dynamodb-leads
```

The rollback zip is in this session's scratchpad. **Copy it somewhere permanent if you want the rollback path to survive.**

⚠️ Rolling back restores the *old* behaviour, including the silent Supabase failure and no `Reply-To`.

---

## Next

1. Wire the 6 lead forms + newsletter to the new contract (budget / timeline / stage / consent / honeypot).
2. Then Phase 2 (concierge) — still blocked on the Tawk.to decision and pricing bands.
