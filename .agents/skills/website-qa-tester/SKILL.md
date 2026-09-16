---
name: website-qa-tester
description: Automated end-to-end quality assurance, bug-hunting, UI audit, and console error detection for AetherCraft web applications using Playwright.
---

# Website QA Tester & Bug Hunter Skill

This skill autonomously tests and audits the entire website to uncover bugs, broken flows, and UI flaws.

## Capabilities:
1. **Full Route Traversal**: Validates that all public & protected routes load without white-screens or React crashes.
2. **Auth & Permission Guard Checks**: Confirms that protected studio actions correctly prompt login modals.
3. **Console & Network Error Detection**: Captures uncaught JavaScript errors, failed HTTP endpoints, and asset 404s.
4. **Responsive Viewport Auditing**: Detects horizontal scrolling / layout overflows at Mobile (375px), Tablet (768px), and Desktop (1440px).
5. **Interactive Filtering & State Verification**: Tests search inputs, modal triggers, and form inputs.

## How to Execute the Audit:
Run the built-in auditor script from the project root:
```bash
node .agents/skills/website-qa-tester/scripts/auditor.mjs
```
