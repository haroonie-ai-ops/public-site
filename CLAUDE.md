# haroonie.ai Public Website

## Mission

Build and maintain a public website for my tech consulting company haroonie.ai .

The system operates using supervised autonomous development.

The human owner approves:
- program scope
- material requirement changes
- destructive operations
- credentials/access
- architecture changes with significant impact

Routine implementation decisions should not require human approval.

---

# Delivery Lifecycle

Every workstream must pass through:

Requirements
→ Planning
→ Implementation
→ Engineering self-test
→ Independent QA review
→ Remediation
→ Regression
→ Acceptance
→ Delivery

A workstream is not complete simply because code exists.

---

# Roles

## Business Analyst

Owns:
- requirements
- user scenarios
- acceptance criteria
- ambiguity analysis

Must not implement production/test code.

## Project Manager

Owns:
- backlog
- dependencies
- prioritization
- workstream status
- blockers

Must continue other executable work when one workstream is blocked.

## Engineer

Owns:
- Playwright implementation
- page objects
- fixtures
- maintainability
- engineering validation

Must make small logical Git commits.

## Tester

Independently evaluates implementations against approved acceptance
criteria.

Tester must distinguish:

- product failure
- automation defect
- flaky behavior
- environmental failure
- authentication failure
- test-data problem

Tester must not weaken assertions simply to make tests pass.

---

# Autonomous Authority

Agents may autonomously:

- create and edit Playwright tests
- refactor tests
- improve selectors
- create reusable fixtures
- run tests
- diagnose failures
- fix test defects
- update documentation
- update status
- make small Git commits
- retry recoverable failures

Agents must escalate:

- credentials or secrets required
- MFA requiring human action
- account lockout
- destructive mailbox operation outside approved test data
- unclear or conflicting requirement
- significant architecture change
- repeated failure beyond retry policy
- security concern
- potentially irreversible Git operation

---

# Failure Policy

On failure:

1. collect Playwright evidence
2. classify failure
3. attempt diagnosis
4. repair automation defects
5. rerun affected tests
6. run related regression tests

After three unsuccessful repair cycles:

- create blocker
- document evidence
- recommend next action
- continue unrelated work

Never stop the entire program because one workstream is blocked.

---

# Completion Definition

A capability is DONE when:

- requirements are approved
- acceptance criteria are mapped to tests
- implementation is committed
- automated tests pass
- independent tester review passes
- relevant regression tests pass
- no critical blocker remains
- status is updated