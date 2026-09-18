---
heading: "Contact"
email: "dev@haroonie.ai"
phone: "+13129709638"
phoneDisplay: "(312) 970-9638"
formIntro: >-
  Prefer to write instead? Send us a note and we'll get back to you. This
  form isn't accepting submissions yet — please email us directly in the
  meantime.
metaDescription: >-
  Get in touch with haroonie.ai by email, or send an enquiry from the
  contact page.
placeholder: false
# Telephone added 2026-09-17, owner-supplied in answer to E18 (REQ-001-A3).
# This is a REAL number. The brand sheet's business card shows
# "(312) 555-0100", which lies in the NANP's reserved fictional range and
# therefore cannot be published under REQ-001 §1.3 at all; the owner
# confirmed the refusal and supplied this number instead.
#
# No booking link. Removed 2026-09-17 under an interim waiver, then
# CANCELLED outright by owner decision 2026-09-18 ("Cancel e22 and p17"), so
# R-2.4 AC1's booking clause is struck rather than waived and there is no
# restore path to keep warm. The previous value returned 404 — visible but
# not actionable — so the clause had been failing since Wave 2b regardless.
# Enquiry routes are the published email and telephone above, both actionable.
# QA-004-class remediation (sweep, PRODUCT_DEFECT, High): formIntro above
# previously cited an internal requirement ID and wave number directly in
# visitor-facing prose. Removed; the underlying fact is unchanged — the
# enquiry form is markup-only in this wave (see the script comment in
# src/pages/contact/index.astro). Wiring it up is a later wave, blocked on
# a transactional email credential (E4).
---
