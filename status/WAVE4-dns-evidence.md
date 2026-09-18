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
- **R-7.7 AC4** — mail continuity verified at DNS-record level, by both
  halves of the method E12 approved. **Corrected 2026-09-18 (QA-006 Finding
  12):** this previously read "at exactly the level E12 approved", and it was
  not. E12's owner decision is recorded verbatim in REQ-001 as
  *"byte-identical before/after record comparison via the Cloudflare API
  **plus an external `dig`**"*. Only the API half had been performed, and the
  same paragraph then conceded, honestly, that those captures "are not an
  independent third-party observation" — which is what the external half
  exists to supply. The external half has now been run; see below. No test
  email was sent, by E12's decision; doing so would itself have been a
  separate outbound-email escalation.
- **A9** — the owner's "permanent infrastructure" commitment for the
  mail records is now backed by a before/after record rather than by a
  written undertaking alone.

## External resolution, 2026-09-18T14:47Z

The independent half of E12's approved method, missing until now. Queried
against a **public resolver (8.8.8.8)**, not the Cloudflare API, so this is
an observation of what the internet sees rather than of what the zone
contains — the distinction the "Limits" section below was right to draw about
the API captures.

```
MX    haroonie.ai                      -> haroonie-ai.mail.protection.outlook.com  (pref 0)
TXT   haroonie.ai                      -> "MS=ms54040815"
TXT   haroonie.ai                      -> "v=spf1 include:spf.protection.outlook.com ~all"
CNAME autodiscover.haroonie.ai         -> autodiscover.outlook.com
CNAME enterpriseenrollment.haroonie.ai -> enterpriseenrollment-s.manage.microsoft.com
CNAME enterpriseregistration.haroonie.ai -> enterpriseregistration.windows.net
NS    haroonie.ai                      -> alex.ns.cloudflare.com, zoe.ns.cloudflare.com
```

All six mail records resolve externally with content identical to the R-7.7
AC1 baseline. **R-7.7 AC4 and R-7.3 AC3 are satisfied on the facts**, by the
external query both criteria name.

The NS line additionally re-evidences **R-7.1 AC1**'s nameserver clause. The
zone's *status* was not re-read in the same pass: the credential available to
that session had no zone-read scope.

## Still open: R-7.7 AC3 — the post-change enumeration

Recorded here rather than left to be rediscovered. AC3 requires a
post-change enumeration showing the original six byte-identical **plus only
the new records R-7.2/R-7.3 require**. `WAVE4-post-www-dns-snapshot.json`
covers only the `www` stage — the six originals plus the `www` CNAME, and no
apex record. The apex write, the `always_use_https` change and the redirect
ruleset all post-date it, so the completed change set was never enumerated.
Neither snapshot carries a timestamp. QA-006 Finding 11.

It stays open because it needs a zone-scoped credential this session did not
have. One read-only call closes it:

```
GET https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?per_page=100
    Authorization: Bearer $CLOUDFLARE_ZONE_TOKEN
```

Save the result beside the baseline as `WAVE4-post-change-dns-snapshot.json`
with the capture time recorded, and diff it against
`WAVE4-AC1-dns-baseline.json` keyed on record `id`.

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
