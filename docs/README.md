# Milegi — document map

Independent hackathon prototype of Uttar Pradesh's Saksham scholarship service. Synthetic data only.
Rewritten from scratch on 20 Aug 2026; every earlier plan in this repository's history is superseded.

Read in this order:

| # | Document | What it is |
|---|---|---|
| 1 | `../PRODUCT.md` | Product truth: what this is, who it is for, the lived pains, scope, non-goals, voice, pinned brand commitments, stack. No visual or task detail. |
| 2 | `research/2026-08-20-saksham-evidence.md` | Every fact the build rests on, tagged by confidence, with sources. Contested numbers are shown as contested. Also the hackathon rules, quoted. |
| 3 | `superpowers/specs/2026-08-20-milegi-design.md` | The design spec: thesis, architecture, data model, state machine with owners and deadlines, pre-flight, form, error contract, safety rules, mocked-vs-real table, boundary matrix, screens, Civic Ink visual system, verification plan, risks. |
| 4 | `superpowers/plans/2026-08-20-milegi-backend.md` | Implementation plan, 17 tasks. Part A (1–10): HTTP-free domain, TDD. Part B (11–17): API routes, sessions, Neon store, end-to-end curl smoke. |
| 5 | `superpowers/plans/2026-08-20-milegi-frontend.md` | Implementation plan, 12 tasks: design system and shell, autosave, intake, case file, institute console, DWO console, simulator, boundary/help, accessibility and performance, then deploy, review, video and write-up. |

Written from the shipped build:

| Document | What it is |
|---|---|
| `../DESIGN.md` | Civic Ink as shipped: tokens, type, density, component inventory |
| `../README.md` | Run instructions, env vars, surfaces, demo credentials |
| `WRITEUP.md` | Hackathon write-up (problem → safety) |
| `VIDEO.md` | Timed three-minute cut + shot checklist |

Live demo (when deployed): `https://milegi.vercel.app`

## The one-line version

The scholarship portal's real defect is not its screens — it is that a file can be nobody's
responsibility for three months and the student cannot tell. So: one door instead of eight, everything
checked before you type, a draft that survives a crash, and a case file where every stage has a named
owner, a deadline, an automatic escalation when that deadline passes, and a plain-language reason
whenever the pipeline says no.

Enforced in code: **a case in a non-terminal stage always has an owner and a `dueAt`.**
