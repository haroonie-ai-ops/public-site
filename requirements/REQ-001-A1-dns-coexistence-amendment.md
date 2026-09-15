# REQ-001-A1 — Amendment: DNS Zone Coexistence with Existing Mail/Microsoft 365 Records

**Status: DRAFT — requires owner approval. This is a proposed material
requirement change to an Approved document (REQ-001, Approved 2026-09-10)
and has NOT been adopted.** Nothing in this file changes REQ-001 until the
owner explicitly approves it. No implementation may proceed against this
draft's new acceptance criteria until then.

Amends: `requirements/REQ-001-mvp-public-website.md` (Approved 2026-09-10)
Cross-references: `planning/PLAN-001-execution-waves.md` Wave 4
Author: Business Analyst
Date: 2026-09-15
Trigger: owner-supplied live Cloudflare zone data (queried 2026-09-15, one
session, one query — see §0.3 on evidentiary weight) showing the
`haroonie.ai` zone is not empty, contradicting REQ-001 §5 U2's greenfield
assumption.

This document does not implement anything, does not modify DNS, and does
not use any Cloudflare credential. It is analysis and a proposed
specification change only.

---

## 0. What the owner is being asked to approve

Three things, and only these three:

1. **A new requirement, R-7.7**, making non-destructive DNS change and
   mail/Microsoft-365 record preservation a hard, tested constraint on
   Wave 4, with its own acceptance criteria.
2. **Two new acceptance criteria on the existing R-7.3** (apex → `www`
   redirect), proving the apex record addition did not disturb the MX/TXT
   records already at that name.
3. **One new acceptance criterion on the existing R-2.4** and a clarifying
   sentence on R-3.1, making explicit a dependency (Contact/enquiry mail
   relies on the DNS records this amendment protects) that REQ-001
   currently leaves implicit.
4. **One new acceptance criterion each on R-7.2 and R-7.7** naming the
   correct target Cloudflare Pages project (`haroonie-ai-public-site`, not
   the account's older `haroonie-bb8eb` project) for the `www` custom-domain
   attachment, added after a second session identified two Pages projects
   on the account during this review (§5).

Everything else below — the gap assessment, the ambiguities, the
escalations — is supporting analysis for that approval, not itself part of
what's being adopted. Nothing here expands MVP scope (no new page, no new
feature); it constrains *how* Wave 4's already-approved DNS work may be
carried out.

### 0.1 New facts this amendment is built on

Owner-supplied, from a live query against the `haroonie.ai` zone
(`3708736be9e9237044212d032e737484`, account `bb8eb20a5a4694930299522043258e3e`,
status active, plan Free, nameservers `alex.ns.cloudflare.com` /
`zoe.ns.cloudflare.com`, activated 2026-03-28):

| Name | Type | Notes |
|---|---|---|
| `haroonie.ai` | MX | live mail routing |
| `haroonie.ai` | TXT | ×2 (almost certainly SPF + a domain-verification record — see U9) |
| `autodiscover.haroonie.ai` | CNAME → `autodiscover.outlook.com` | Microsoft 365 / Exchange Online |
| `enterpriseenrollment.haroonie.ai` | CNAME | Microsoft Intune / MDM enrolment |
| `enterpriseregistration.haroonie.ai` | CNAME | Microsoft device registration |

No A, AAAA or CNAME exists at the apex or at `www` — i.e. **zero web-facing
records exist anywhere on this zone today**; this specific point was
independently reconfirmed by a second session via a working zone-scoped
token during this review (§5), strengthening it beyond the single-query
status the rest of this table carries (see §0.3/U11). `always_use_https`
is currently `off`. The Cloudflare account also holds two Pages projects —
`haroonie-ai-public-site` (this program's real project) and `haroonie-bb8eb`
(older, bound to a different domain, `www.haroonie.com`) — relevant to
R-7.2's custom-domain attachment target (§5).

This directly falsifies REQ-001 §5 U2's applied default ("Assume
greenfield") **for the DNS zone specifically**. It does not falsify U2 for
website *content* — there is still no existing site to migrate; the gap is
narrower and sharper than a blanket "not greenfield": the zone carries live
non-website infrastructure that Wave 4 must not disturb.

### 0.2 Why this is a material change, not routine implementation detail

CLAUDE.md reserves "material requirement changes" to the owner. This
qualifies: R-7.1 through R-7.6 were approved on 2026-09-10 against an
implicit assumption (an empty zone) that is now known to be false, and the
enquiry-delivery requirement (R-3.1) and published contact channel (R-2.4)
turn out to depend on infrastructure REQ-001 never named. That is a gap in
what was approved, not a new feature request — but closing it changes what
"done" means for R-7.3 specifically, so it goes to the owner rather than
being treated as a routine engineering call.

### 0.3 Evidentiary weight of the trigger fact itself

This program has an established internal standard for treating a DNS fact
as settled: E2 (nameserver delegation) was not accepted as closed on the
owner's first report — it was independently reproduced twice, in two
separate sessions, with identical results, before `status/STATUS.md`
recorded it as CLOSED. The zone/record data behind this amendment has not
yet had that treatment: it is a single query, from a single session,
supplied directly to this analysis. It is reliable enough to draft
requirements against (the record types described — MX, SPF-shaped TXT,
Microsoft CNAMEs — are an entirely ordinary, internally consistent
Microsoft 365 configuration, not an implausible claim), but this amendment
does not treat it as independently verified. See U11 and R-7.7 AC1, which
require Wave 4 to re-query and re-confirm the exact record set itself
before making any change, rather than proceeding on this conversation's
say-so alone.

---

## 1. Gap assessment

| REQ-001 location | Written assuming | Now known | Consequence |
|---|---|---|---|
| §5 U2 | Greenfield zone | Zone carries live MX, 2×TXT, 3×CNAME | U2's applied default was correct for *content*, wrong for *DNS occupancy*. Needs a split resolution — see §4 below. |
| R-7.1 AC1 | Nameservers active ⇒ zone ready for configuration | Nameservers active AND zone already carries production-critical non-website records | AC1 itself still holds (nameservers are correct), but R-7 as a whole silently assumed "ready for configuration" meant "empty." It doesn't. No AC change needed here; the gap is addressed by the new R-7.7, not by rewriting R-7.1. |
| R-7.2 (`www` canonical) | No collision risk stated or needed | Confirmed true today (`www` is NXDOMAIN) — but REQ-001 never says so, so nothing would have caught it if it turned out otherwise | Low residual risk (nothing currently occupies `www`), but the "no existing record" precondition should be stated, not assumed silently. Addressed by R-7.7's baseline requirement, which covers `www` as well as the apex. |
| R-7.3 (apex → `www` 301) | Apex is free to receive whatever record the redirect needs | Apex already carries MX + 2×TXT | **Highest-risk gap.** Requires the specific analysis in §3 below and two new ACs. |
| R-7.4 (HTTPS upgrade + HSTS) | `always_use_https` is a simple flip with no side effect | Confirmed true — this is a zone-wide *setting* that only affects proxied (orange-cloud) hostnames' HTTP traffic; the three Microsoft CNAMEs are (and must remain) DNS-only, so they never pass through Cloudflare's edge and this setting cannot touch them | No AC change to R-7.4 itself; the "must remain DNS-only" fact is now an explicit thing to preserve, folded into R-7.7's baseline/diff rather than duplicated here. |
| R-2.4 AC1 (published email + booking link) | Implicit reliance on `dev@haroonie.ai` resolving | Now known to depend specifically on the Microsoft 365 MX/autodiscover configuration this amendment protects | Dependency made explicit — new AC3 (§3.3 below). |
| R-3.1 (enquiry delivery) | Implicit reliance on the same mailbox | Same | Note added to R-3.1's existing "Blocked" text (§3.4 below); does not change R-3.1's blocked status or its E4 dependency, adds a second, independent precondition. |

**Bottom line:** R-7.1, R-7.2, R-7.4, R-7.5, R-7.6 need no AC changes — their
behaviour as written is still correct and still independently observable.
R-7.3 needs targeted new ACs because it is the one place Wave 4's plan
requires *writing a new record onto a name that already carries other
records*. A new umbrella requirement (R-7.7) is needed because "don't
break what's already there" is a cross-cutting constraint on the whole of
Wave 4's DNS work, not a property of any single existing AC, and CLAUDE.md
treats "destructive operations" as an owner-reserved concern that deserves
its own named, testable requirement rather than a footnote.

---

## 2. The apex/MX coexistence question (R-7.3), interrogated

**Question:** R-7.3 needs a proxied record at the apex so Cloudflare's edge
can see the request and apply the 301. The apex already carries an MX
record and two TXT records. Is adding that proxied record safe?

**Answer: yes, for three independent reasons, each verifiable, none of
which relies on the others:**

1. **DNS record types at the same name do not conflict with each other.**
   A name can simultaneously carry an MX record (used only for SMTP mail
   routing — "where do I deliver mail for this domain"), TXT records (used
   for arbitrary text lookups — SPF, verification strings, etc.), and an
   A/AAAA/CNAME record (used only for resolving that name to an address for
   protocols that ask for one, chiefly HTTP/HTTPS). These are different
   record *types* stored under the same name; adding one type does not
   read, touch, or require modifying another type. This is not a
   Cloudflare-specific behaviour — it is how the DNS protocol itself works,
   and it is in fact the *default* configuration for the overwhelming
   majority of domains that run both email and a website from the same
   apex. There is nothing unusual about this zone's target state; what's
   unusual is only that Wave 4's plan didn't say so explicitly.

2. **Cloudflare's proxy only intercepts HTTP/HTTPS traffic to a
   proxied (orange-cloud) A/AAAA/CNAME record.** SMTP mail delivery for
   `haroonie.ai` is a completely separate transport: a sending mail server
   looks up the MX record and connects directly to whatever host that MX
   record names, on port 25/587 — it never consults, and is not affected
   by, the apex's A/AAAA record or that record's proxy status. Proxying the
   apex for the web redirect does not "capture" or reroute mail traffic in
   any way; Cloudflare's HTTP proxy has no mechanism that touches MX
   resolution or SMTP delivery.

3. **The change is additive, not a modification.** The apex currently has
   *no* A, AAAA, or CNAME record — Wave 4 creates one where none existed
   before. It is not editing, replacing, or re-pointing an existing record;
   the existing MX and TXT records are not read, referenced, or written by
   the operation that adds the apex web record.

**Where the actual risk lives — and it is real, just not where the naive
question points:** the risk is not architectural (mail and web coexisting
at an apex is normal and safe), it is *operational* — the specific API call
or dashboard action used to add the apex record could, through a tooling
or human error, be a "set records for this name" operation that silently
replaces the whole record set instead of an "add one record" operation
that leaves the rest alone. Some registrar/DNS UIs and some naive
automation scripts do work that way. This is the failure mode the new ACs
below are written to catch: not "is coexistence theoretically safe"
(it is), but "did *this specific execution* actually only add, and never
replace or delete."

A second, related but distinct risk: the three Microsoft CNAMEs
(`autodiscover`, `enterpriseenrollment`, `enterpriseregistration`) must
remain **DNS-only (grey-cloud, unproxied)** — proxying a CNAME that points
at a third-party service like `autodiscover.outlook.com` breaks it (TLS
certificate mismatch, wrong origin). Nothing in R-7.2/R-7.3 needs those
three records touched at all, but a Wave 4 script that blanket-enables
proxying across "all records" rather than targeting only the new `www` and
apex records could break them as a side effect. This is why the new AC
below checks proxy status, not just record content.

---

## 3. Proposed amendment text

Everything in this section is proposed new/changed text for
`requirements/REQ-001-mvp-public-website.md`. It is written in place, ready
to merge, but is **not** being written into that file by this session per
the coordination constraint in effect — the owner or a future session
merges it after approval.

### 3.1 New requirement — R-7.7 (insert after R-7.6, before R-8)

**R-7.7 — Wave 4's DNS and zone-setting changes are non-destructive to
existing mail and Microsoft 365 records.**

Applies to every DNS record or zone-level setting change made in service
of R-7.1–R-7.6, not only the apex record discussed in R-7.3.

- **AC1** — Given the zone as it exists before any Wave 4 change, When Wave
  4 begins, Then a complete, independently-queried enumeration of every
  existing DNS record (name, type, content, proxy status) is captured and
  recorded before any write is made. This enumeration must be freshly
  queried by the executing agent/session, not copied from this document or
  any prior conversation (see §0.3), and must confirm the record count is
  exactly six (1 MX, 2 TXT, 3 CNAME) before proceeding — a different count
  is itself a signal to stop and re-verify against §0.1/§5 before any
  write, not to proceed on an assumption.
- **AC1a** — Given Wave 4 requires a Cloudflare credential capable of
  writing DNS records, zone settings and redirect rules (R-7.2–R-7.4), When
  that credential is selected, Then it is a scoped API token — not
  Cloudflare's interactive OAuth path, which is independently confirmed
  (§5) to return zero visible zones for this account and therefore cannot
  perform any of Wave 4's writes at all, regardless of preference. The
  exact permission grants on that token are an owner/Engineer
  implementation decision (E13), not specified by this AC; this AC only
  fixes that the OAuth path is not an available option to choose between.
- **AC2** — Given that baseline is exactly the six pre-existing records
  (AC1), When any Wave 4 DNS or zone-setting change is made, Then the
  operation performed is **create-only**: it adds new records (the `www`
  record for R-7.2 and the apex record for R-7.3) or changes zone-level
  settings (R-7.4's `always_use_https`), and it never issues an update or
  delete call against any of the six pre-existing records — this is a
  create-only rule to be enforced and checked, not a caution to bear in
  mind, made possible by the confirmed fact that zero web-facing (A/AAAA/
  CNAME) records exist anywhere on the zone today (§0.1, independently
  reconfirmed, §5), so no legitimate Wave 4 operation ever needs to touch
  an existing record at all.
- **AC3** — Given the create-only rule (AC2), When a post-change
  enumeration of the zone is performed, Then it shows exactly the original
  six records, byte-identical in name, type, content and proxy status, plus
  only the new records R-7.2/R-7.3 require — verified by count (six plus
  exactly the new additions) and by field-for-field comparison against the
  AC1 baseline, not by spot-checking the apex alone. The apex record
  required by R-7.3 specifically coexists with the pre-existing MX and TXT
  records there without modifying either (see §2 for why this is safe by
  construction); this AC verifies that the actual operation performed was
  in fact the targeted, single-record creation §2 assumes, not a bulk or
  replace-all call against that name.
- **AC4** — Given the change is complete, When the MX record and both TXT
  records at the apex, and the three Microsoft CNAMEs
  (`autodiscover`, `enterpriseenrollment`, `enterpriseregistration`), are
  queried externally (e.g. `dig`/`nslookup` against public resolvers),
  Then each resolves with content identical to the pre-change baseline,
  and the three CNAMEs remain DNS-only (unproxied).
- **AC5** — Given the correct target for R-7.2's custom-domain attachment
  is the `haroonie-ai-public-site` Cloudflare Pages project, When
  `www.haroonie.ai` is attached, Then the attachment is verified to name
  that project specifically — not `haroonie-bb8eb` (an older project on the
  same account, already bound to a different domain,
  `www.haroonie.com`) — by inspecting the target project's custom-domains
  list after attachment, not by assuming the correct project was selected.
- **AC6** — Given any Wave 4 change is found to have altered or removed any
  record in scope of AC1 (i.e. the create-only rule in AC2 was violated),
  When this is detected, Then it is treated as a critical incident under
  CLAUDE.md's destructive-operation policy: the change is reverted
  immediately using the AC1 baseline, and the owner is notified before any
  further Wave 4 work continues — not silently "fixed forward" and
  reported as a footnote.
- Verified by: recorded manual check (per R-8.1) — pre/post API enumeration
  output, diffed and attached to the Wave 4 record. This cannot be
  meaningfully expressed as a CI-gated Playwright test: it requires live
  access to the production zone at execution time, and running it
  automatically and repeatedly against production DNS on every build would
  itself be a risk this requirement exists to avoid. It is a one-time,
  evidenced, human-auditable step at Wave 4 execution, not a regression
  test.

### 3.1a Amendment to R-7.2 (add AC3)

**R-7.2** `www.haroonie.ai` is the canonical, TLS-secured production host.
- AC1, AC2 — *(unchanged)*
- **AC3 (new)** — Given the account holds two Cloudflare Pages projects
  (`haroonie-ai-public-site`, this program's real project, and
  `haroonie-bb8eb`, an older project already bound to a different domain,
  `www.haroonie.com`), When `www.haroonie.ai` is attached as a custom
  domain, Then the attachment names `haroonie-ai-public-site` specifically,
  verified by inspecting that project's custom-domains list after
  attachment — not inferred from the attachment call succeeding, since a
  misdirected attachment to the wrong project could plausibly also
  "succeed" from the caller's point of view. (Mirrors R-7.7 AC5, stated
  here as well because R-7.2 is the specific requirement this mistake would
  silently satisfy the letter of while attaching to the wrong target.)

### 3.2 Amendment to R-7.3 (add AC3, AC4)

**R-7.3** The apex domain redirects to the canonical host.
- AC1 — *(unchanged)*
- AC2 — *(unchanged)*
- **AC3 (new)** — Given the apex's pre-existing MX record and two TXT
  records, When the proxied record required for this redirect is added at
  the apex, Then both pre-existing record types remain present and
  resolve with unchanged content, verified by an external DNS query
  performed immediately after the change (this AC is the R-7.3-specific
  instance of R-7.7 AC4; it is stated here as well because R-7.3 is the
  specific requirement that creates the risk).
- **AC4 (new)** — Given the redirect is live, When mail-routing continuity
  is verified, Then verification is limited to DNS-record-level checks
  (MX/TXT resolution, per AC3) and does not include sending or receiving an
  actual email message — see E12 below on why an end-to-end send test is
  explicitly out of scope for this AC without separate owner approval.

### 3.3 Amendment to R-2.4 (add AC3)

**R-2.4 Contact** — enables an enquiry.
- AC1, AC2 — *(unchanged)*
- **AC3 (new)** — Given the Contact page publishes `dev@haroonie.ai` as the
  enquiry destination (AC1), When Wave 4's DNS changes are applied, Then
  the mailbox's underlying mail-routing records are confirmed intact per
  R-7.7 AC4 before Wave 4 is reported exit-complete. The Contact page's
  published `mailto:` link being "actionable" (AC1, a UI-level check) is
  not sufficient evidence that mail delivered to it actually arrives —
  that evidence is R-7.7's, not this page's, and this AC makes the
  dependency traceable rather than assumed.

### 3.4 Amendment to R-3.1 (clarify existing "Blocked" note)

Append to R-3.1's existing note (no change to its blocked status or E4
dependency):

> This requirement has a second, independent precondition beyond the
> transactional email credential (E4): the destination mailbox's own
> mail-routing DNS records must remain intact through Wave 4 (R-7.7). A
> resolved E4 does not make R-3.1 deliverable if Wave 4 has broken MX
> resolution for `haroonie.ai` in the meantime — the two preconditions are
> independent and both must hold.

### 3.5 Amendment to §2 Assumed defaults (add A9)

| # | Assumption |
|---|-----------|
| A9 (new) | The existing Microsoft 365 / Exchange Online mail configuration on `haroonie.ai` (MX, SPF-shaped TXT, autodiscover/enterprise-enrolment/enterprise-registration CNAMEs) is to be preserved indefinitely. No requirement or plan in this program authorizes modifying or removing it. See U7. |

### 3.6 Amendment to §4 Test data and preconditions (add rows)

| Item | Value | Source |
|------|-------|--------|
| Cloudflare zone ID | `3708736be9e9237044212d032e737484` | Owner (queried 2026-09-15) |
| Cloudflare account ID | `bb8eb20a5a4694930299522043258e3e` | Owner (queried 2026-09-15) |
| Pre-existing apex records (baseline for R-7.7 AC1–AC4) | MX (1); TXT (2, one SPF-shaped); see §0.1 table | Owner (queried 2026-09-15) — Wave 4 must independently re-confirm per U11, not treat this row as sufficient evidence on its own |
| Pre-existing Microsoft CNAMEs | `autodiscover`, `enterpriseenrollment`, `enterpriseregistration` — all must remain DNS-only (unproxied) | Owner (queried 2026-09-15) |
| `always_use_https` current value | `off` | Owner (queried 2026-09-15) |
| `CLOUDFLARE_ZONE_TOKEN` (user token, prefix `cfut_`, **no expiry set**) | Read confirmed across DNS records, rulesets, zone settings, Pages. **Write untested** — no zone modification has been made pending this amendment. | Verified by a separate session, 2026-09-15 (see U12/E13). Informational only; this analysis does not use it. |

### 3.7 Amendment to §5 Ambiguities (add U7–U12)

| # | Ambiguity | Safest default applied |
|---|-----------|------------------------|
| U7 | Is the Microsoft 365 setup permanent, or legacy infrastructure the owner may eventually retire? | Assume permanent and out of this program's authority to touch (see A9); if the owner intends to decommission it, that is a separate, explicit future decision, never inferred from silence. |
| U8 | Is a CAA record needed to constrain TLS certificate issuance for this zone? | None exists today, and none is required for MVP — Cloudflare's own managed certificates work without one. Flagged as residual risk (an unconstrained zone can technically have a certificate issued by any public CA), not added to MVP scope. No action taken. |
| U9 | Are SPF/DKIM/DMARC completeness for `haroonie.ai` in scope for this program? | **Out of scope.** This program builds a website; the existing TXT record is "almost certainly SPF" but its exact content, and the presence/absence of DKIM/DMARC records, have not been inspected and are not this program's to fix. Flagged as a residual mail-deliverability risk to the owner (relevant to R-2.4/R-3.1's mailbox), not an MVP requirement — raising it is not the same as expanding scope to solve it. |
| U10 | Is `www.haroonie.ai` already used by anything (a SaaS binding, a Microsoft vanity domain, etc.)? | **Resolved by direct evidence**: no A/AAAA/CNAME exists at `www` today. Treated as clear. If a future need for `www` conflicts with this program, that is a conflict to raise when it happens, not now. |
| U11 | Is the §0.1 zone/record data independently verified, or a single unverified report? | Single query, single session — see §0.3. Safest default: usable for drafting this amendment, but Wave 4 must independently re-query and diff the live zone (R-7.7 AC1) before making any change; this document's record table is not itself the AC1 evidence. |
| U12 (new — received, then corrected, during drafting; see §5) | Not "which mechanism" — that was this ambiguity's first draft and has been superseded (§5): Cloudflare's interactive OAuth path is independently confirmed to return zero visible zones for this exact account despite the zone being active on it, so it cannot perform any of Wave 4's writes and is not a real option to weigh. The live question is narrower: **exactly what permission scope must the one viable scoped token carry**, and is the already-existing `CLOUDFLARE_ZONE_TOKEN` (no expiry set, write untested) the right instrument, as-is, reduced, or replaced? | A specific permission list is an owner/Engineer implementation decision, not specified by this amendment (R-7.7 AC1a fixes only that OAuth is excluded, §3.1). Safest default: whatever token is used, R-7.7 AC2/AC3's create-only rule is verified by *observed behaviour of the actual writes made*, independent of what the token is nominally scoped to allow — so this ambiguity does not block R-7.7 from being implemented and checked correctly even before E13 names the exact permission list. |

### 3.8 Amendment to §6 Escalations (add E11–E13)

| # | Item | Blocks |
|---|------|--------|
| E11 (new) | Owner must explicitly confirm: the mail/Microsoft 365 DNS records listed in §0.1 are to remain permanently, and no agent may alter or remove them under any circumstance, including as a side effect of an "add/replace records" style API call. This is the specific human sign-off R-7.7 depends on — CLAUDE.md reserves "destructive operations" to the owner, and while this amendment's design avoids any destructive operation being *necessary*, the owner should confirm the intent before Wave 4 executes against production DNS. | R-7.7 execution (Wave 4's apex/`www` work) |
| E12 (new) | Owner must decide whether mail-continuity verification (R-7.3 AC4 / R-7.7 AC4) may ever include an actual end-to-end test email send/receive, or must remain limited to DNS-record-level checks only. Sending mail is listed in CLAUDE.md's escalation policy ("outbound email") independent of this amendment. Safest default applied absent a decision: DNS-record-level checks only; no message is ever sent as part of Wave 4 verification. | Nothing blocked today (the default already satisfies R-7.3 AC4/R-7.7 AC4 without a send) — only relevant if a future session proposes an actual send test |
| E13 (new — see §5) | Owner must confirm the exact permission scope for the scoped Cloudflare API token Wave 4 will use (U12) — Cloudflare's interactive OAuth path is confirmed non-viable (§5) and PLAN-001's E5 correction, which chose OAuth specifically to avoid a stored DNS-capable secret, no longer has a functioning alternative to recommend instead. This narrows `status/STATUS.md`'s E10 (which offered scoped token / `wrangler login` / manual dashboard as three options) to effectively one, with the remaining decision being the token's precise scope, not which of three paths to take. Also part of this decision: whether the existing `CLOUDFLARE_ZONE_TOKEN` (no expiry set, write untested, read confirmed on DNS/zone settings/rulesets/Pages) is the intended token, whether its scope should be narrowed before use, and whether an expiry should be set on it. | Blocks Wave 4 *execution* of any DNS write (R-7.2–R-7.4) until named; does not block R-7.7's ACs from being specified or checked once a token exists, since AC2/AC3 verify actual write behaviour regardless of nominal scope |

---

## 4. Resolution proposed for §5 U2 (not a new ambiguity — a correction)

U2 as currently written ("Does an existing site or content need migrating?
Assume greenfield") is not wrong for the question it actually asked — there
is still no existing *website* to migrate. It is incomplete: it never asked
about the *DNS zone's* occupancy, and PLAN-001's Wave 4 silently inherited
"greenfield" as if it covered DNS too. Proposed resolution: split U2 into
two explicit statements, U2a and U2b, in the amended document:

- **U2a** (content): Does existing site content need migrating? Confirmed:
  no. No prior website exists at `haroonie.ai` or `www.haroonie.ai`.
- **U2b** (DNS zone): Does the DNS zone carry existing, non-website
  records that must be preserved? Confirmed: yes — see §0.1. This is the
  fact this entire amendment exists to address; R-7.7 is its resolution.

---

## 5. Addendum — DNS-write access mechanism (received, then corrected, during drafting)

While drafting this amendment, a separate session raised a claim, and then
retracted and corrected it before this document was finished. Both are
recorded here in full, per instruction to incorporate or reject with
reasoning rather than silently overwrite.

**Original claim (retracted):** that PLAN-001's E5 preference for
Cloudflare's interactive OAuth path over a stored scoped token was a
security trade-off now inverted by the non-greenfield finding — a broad
interactive grant being arguably more dangerous than a narrow stored token
against live mail records, but a genuine two-sided choice either way. This
amendment's first draft accepted that framing and recorded it as U12/E13
without picking a side, on the reasoning that R-7.7's ACs are
mechanism-agnostic regardless of which side won.

**Correction (superseding the above):** the session holding an authorized
`cloudflare-api` OAuth session tested it directly rather than reasoning
about it abstractly. Result: that OAuth session sees exactly one account
(`Haroonyoeu@gmail.com's Account`, `bb8eb20a5a4694930299522043258e3e`), and
`GET /zones` against it returns `success: true, count: 0` — not a 403, an
empty result. Independently, `CLOUDFLARE_ZONE_TOKEN` shows `haroonie.ai`
active on that *exact same account*. So the zone exists exactly where the
OAuth session is bound, and the OAuth session still cannot see it — the
grant excludes zone resources entirely, not "is riskier if used." **This
is not a two-sided trade-off; one arm is non-functional.** An OAuth session
that cannot list a single zone cannot create R-7.2's DNS record, cannot
create R-7.3's redirect rule, and cannot change R-7.4's TLS settings. A
scoped Cloudflare API token is therefore not "the safer of two options" —
it is **the only viable path** for Wave 4's writes at all.

**Consequence for this amendment: U12 and E13 (§3.7/§3.8) are reframed, not
withdrawn.** The open question was never "which mechanism" — it is now
"what exact permission scope must that one viable token carry, and how do
we prove, independent of what the token is nominally allowed to do, that
its actual writes stayed create-only." That reframing is reflected in the
updated U12/E13 text below and in R-7.7's strengthened ACs. This Business
Analyst role does not choose the token's exact permission grants (a
credentials/access decision CLAUDE.md reserves to the owner, tracked at
`status/STATUS.md`'s E10) — it specifies the *capabilities* the chosen
token must have (§3.1 AC1a) and the *proof* required regardless of what
the token is capable of (§3.1 AC2–AC3, now strengthened to a create-only
rule rather than a general caution).

**Two further verified facts, both incorporated into the strengthened
ACs below, not left as informational asides:**

1. **Zero web-facing records exist on the zone** — no A, AAAA, or CNAME at
   the apex or at `www`, independently confirmed via the zone token by a
   second session (consistent with, and now doubly confirming, §0.1's
   original report — see U11's evidentiary note). Because the zone's
   entire pre-existing record set is exactly six records (1 MX, 2 TXT, 3
   Microsoft CNAMEs) and none of them is web-facing, the additive-only
   constraint stops being a caution ("take care not to break mail") and
   becomes an exact, testable rule: **Wave 4 may only CREATE new records;
   it must never UPDATE or DELETE any of the six pre-existing records.**
   R-7.7 AC2/AC3 below are rewritten to state exactly that.
2. **Two Cloudflare Pages projects exist on the account**:
   `haroonie-ai-public-site` (the real one this program builds) and
   `haroonie-bb8eb` (older, bound to a *different* domain,
   `www.haroonie.com` — a one-character typo away from this program's
   actual domain). Attaching `www.haroonie.ai` as a custom domain to the
   wrong project is a cheap, easy mistake with an annoying cleanup. A new
   AC is added to R-7.2 (below) naming the target project explicitly.

**One piece of good news, also incorporated:** the zone and the correct
Pages project (`haroonie-ai-public-site`) are confirmed on the same
Cloudflare account, so R-7.2's native custom-domain attachment path is
viable — not a given, and worth recording as a resolved risk rather than
an open one.

The `CLOUDFLARE_ZONE_TOKEN` fact from the first draft (no expiry set,
write untested by design) still stands and is unaffected by the
correction; it remains in §3.6's test-data table and E13.

## 6. Traceability note (R-8.1)

Every new/changed AC above states its own "Verified by." Summary for the
traceability matrix once this amendment is merged:

| AC | Verified by |
|---|---|
| R-7.7 AC1, AC1a, AC2, AC3, AC4, AC6 | Recorded manual check — pre/post zone-record enumeration (exact six-record baseline, create-only diff), diffed, attached to Wave 4's execution record. Not CI-automatable (requires live production zone access at execution time). AC1a is verified once, at credential-selection time, by confirming which mechanism was actually used. |
| R-7.7 AC5, R-7.2 AC3 | Recorded manual check — inspecting the target Pages project's (`haroonie-ai-public-site`) custom-domains list after attachment, confirming it and not `haroonie-bb8eb`. |
| R-7.3 AC3, AC4 | Recorded manual check — external DNS query (`dig`/`nslookup`) immediately after the apex change; scoped to record-level checks only per AC4/E12. |
| R-2.4 AC3 | Recorded manual check — cross-reference to R-7.7 AC4's evidence at Wave 4 exit; not independently re-tested from the Contact page (the page-level check already exists as AC1). |
| R-3.1 note | No new AC; clarifies an existing blocked requirement's preconditions. Nothing to newly verify until R-3.1 itself is unblocked. |

None of the above can be satisfied by a Playwright test against a build
artifact — they all require a live, production-zone check at the moment
Wave 4 executes, which is exactly why R-8.1's "or an explicitly recorded
manual verification" clause exists.

---

## 7. Summary for the owner

**Gap:** REQ-001's R-7 series and PLAN-001's Wave 4 were written assuming
an empty DNS zone. The zone is not empty — it carries a live Microsoft 365
mail configuration that R-2.4 and R-3.1 already silently depend on.

**Is the highest-risk step (R-7.3's apex record) actually safe?** Yes, by
construction — different DNS record types at the same name don't conflict,
Cloudflare's HTTP proxy has no effect on mail transport, and the apex
addition is purely additive since no A/AAAA/CNAME exists there today. The
real risk is operational (a bulk-write tool call, or accidentally proxying
the Microsoft CNAMEs), not architectural — which is exactly what R-7.7's
baseline-and-diff ACs are built to catch.

**What's being asked of the owner:** approve R-7.7 (new, now with a
testable create-only rule rather than a general caution), the new R-7.2 and
R-7.3 ACs (mail-record integrity plus the correct Pages-project target),
the new R-2.4 AC, and the R-3.1 clarifying note; and separately, action
E11 (confirm the mail records must be preserved), E12 (confirm
verification stays DNS-only, no test email send), and E13 (name the scoped
token's exact permissions — Cloudflare's OAuth path is confirmed unable to
perform any of Wave 4's writes at all, so this is no longer a choice among
options, only a scope to fix) before Wave 4 executes against production
DNS. Nothing here expands MVP scope or touches E1 (zone existence — now
effectively answered by this review's own evidence, though that update
belongs to the Project Manager's status ledger, not this document) or
E10's broader access-mechanism framing in `status/STATUS.md`, both of
which remain outside this amendment's file scope.
