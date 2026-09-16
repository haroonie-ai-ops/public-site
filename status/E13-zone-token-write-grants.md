# E13 — CLOUDFLARE_ZONE_TOKEN write grants: RESOLVED

**Date:** 2026-09-15
**Zone:** `3708736be9e9237044212d032e737484` (haroonie.ai)
**Account:** `bb8eb20a5a4694930299522043258e3e`
**Token:** `CLOUDFLARE_ZONE_TOKEN` (Windows User-scope env var), verify → `active`

## Question

E13 asked whether the token Wave 4 automation would use actually carries
**write** grants. Prior state: zone *read* confirmed across DNS, rulesets,
zone settings and Pages; **write unproven on all four**.

## Result — all four grants proven

| Grant | Status | Evidence |
|---|---|---|
| DNS record write | PROVEN | apex CNAME `haroonie.ai` created via token |
| Zone Settings write | PROVEN | `always_use_https` `off` → `on` via token |
| Rulesets write | PROVEN | dynamic-redirect entrypoint ruleset `5068840f0c5046079c58a5807e11d001` created via token |
| Pages write | PROVEN | authorization-discrimination probe, below |

### Pages write probe (non-mutating)

Proving Pages write without creating anything: `POST .../pages/projects/
haroonie-ai-public-site/domains` with a deliberately invalid payload
(`{"name":"this is not a valid domain name"}`). Cloudflare authorizes before
validating, so the response distinguishes the two.

Control experiment run in the same session, same endpoint, same body:

| Credential | HTTP | Interpretation |
|---|---|---|
| Bogus token | 401 | authentication rejected |
| OAuth MCP session | 403 / 9109 "Unauthorized to access requested resource" | authenticated, not permitted |
| `CLOUDFLARE_ZONE_TOKEN` | 400 / 8000015 "The domain is invalid" | authenticated AND permitted; failed validation only |

The 400 shape occurs only after authorization succeeds. No domain was created.

## Caveat

`www.haroonie.ai`'s Pages custom-domain attachment was performed through the
Cloudflare **dashboard** (owner-authenticated), not through this token. The
Pages grant above is proven by the probe, not by that attachment.

## Recommendation (non-binding, carried from REQ-001-A1 §3.8)

Post-Wave-4 revocation of this token remains advisable. It now carries proven
write across DNS, zone settings, rulesets and Pages on a zone hosting live
Microsoft 365 mail, and has no expiry set.
