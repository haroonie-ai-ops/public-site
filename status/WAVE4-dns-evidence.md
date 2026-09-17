# Wave 4 — DNS evidence (R-7.7 AC1, AC2, AC4)

Captured by: Engineer, during Wave 4 execution.
Published: 2026-09-16 (the captures predate this; they lived only in one
working copy until now).
Credential used: `CLOUDFLARE_ZONE_TOKEN` (the instrument the owner selected
in E13).

Two files accompany this note:

| File | What it is |
|---|---|
| `WAVE4-AC1-dns-baseline.json` | The zone's full record set **before** Wave 4 wrote anything — R-7.7 AC1's required independent re-query, not a prior session's report reused as evidence (U11). |
| `WAVE4-post-www-dns-snapshot.json` | The same query **after** the `www` record was created — R-7.7 AC4's post-change comparison. |

## What the pair proves

Compared by Cloudflare record `id`, not by eye:

- **0 records removed. 0 records modified.**
- **Exactly 1 record added:** `www.haroonie.ai` `CNAME` ->
  `haroonie-ai-public-site.pages.dev`, `proxied=true`, `ttl=1`
  (automatic).
- **All six mail / Microsoft 365 records are byte-identical** across the
  two captures, under their **original record ids** — the MX, both apex
  TXT records (`MS=` verification and the SPF record), and the
  `autodiscover` / `enterpriseenrollment` / `enterpriseregistration`
  CNAMEs. Identical ids matter: the records were not deleted and
  recreated with the same content, they were never touched at all.
- **No apex (`haroonie.ai`) record changed in any way.**

## Which acceptance criteria this closes, and how

- **R-7.7 AC1** — the live zone was independently re-queried and diffed
  before any change, rather than trusting an earlier session's report
  (U11's explicit requirement).
- **R-7.7 AC2** — the create-only rule held, including the sequencing
  consequence E13 attached to it: the **first** write performed was the
  `www` record, never the apex. `CLOUDFLARE_ZONE_TOKEN`'s write grants
  were untested at that point, so this ordering meant a missing grant
  would have surfaced on a name carrying nothing, rather than mid-change
  on the name carrying live mail. The token's write grant is now proven
  to work, by this successful create.
- **R-7.7 AC4** — mail continuity verified at exactly the level **E12**
  approved: DNS-record-level comparison only. No test email was sent;
  doing so would itself have been a separate outbound-email escalation.
- **A9** — the owner's "permanent infrastructure" commitment for the
  mail records is now backed by a before/after record rather than by a
  written undertaking alone.

## Limits, stated plainly

- These are captures taken **by this program** against the Cloudflare
  API. They are not an independent third-party observation.
- The baseline is a **single capture at a single moment** — U11's
  standing caveat, not resolved by publishing it.
- They prove what the zone contained immediately before and after the
  `www` write. They are **not** a continuous audit, and they do **not**
  prove mail was actually delivered during the window. No send test was
  performed, by E12's decision.
- The JSON files were normalized from their original PowerShell capture:
  a UTF-8 BOM was stripped and CRLF line endings converted to LF, so the
  files parse as JSON and diff cleanly. **Every record id, name, type,
  content, proxied flag, ttl and priority value is unchanged.**
