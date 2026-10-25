# Open-issue execution handoff — 2026-10-25

Starting main: `248e442d6b51afa389ba8b85fa2e9ffbbc85353c`. Clean checkout, one worktree, no unpublished local commits, no open PRs. Live queue: #1, #3, #4, #5–#16, ordered by creation time. The epic and release gate defer to their prerequisites. No issue has been closed by this execution.

## New local repair: unsupported valuation breakdown

Refs #5 (TD-01B.A/D), #14 (TD-09.A/B/D), #16 (TD-11.B/E).

Finance's current source is `521e4be13b9d42d93e15582ad8b866b02b94fc15`, tree `98d2ce3ec9e50f312d5c5270b93bb06e15dd7dd6`. Its [reported-unsettled proposal](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/blob/521e4be13b9d42d93e15582ad8b866b02b94fc15/docs/api/reported-unsettled-reporting.md), [schema](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/blob/521e4be13b9d42d93e15582ad8b866b02b94fc15/src/reporting/schema-v2.ts), and [owner decision](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/issues/13#issuecomment-6128331072) define optional `valuation.reportedUnsettled` and detail basis `provider_reported_unsettled`. The design remains subject to strict consumer adaptation and acceptance; stored older packets must retain their bytes.

The current dashboard does not render that new bucket. Its summary guard previously accepted arbitrary additional valuation members and omitted them from the breakdown. It now refuses valuation members outside the supported `estimated`, `confirmed`, `unknownCount` set using the existing safe `INVALID_SHAPE` response at the valuation object. All views withhold amounts and the export slot when this guard refuses. No producer schema, union, financial value, calculation, permission, pinned packet or interface is invented or adopted. Actual reported-unsettled presentation and export conformance still require the Finance-owned handoff.

Eleven regression cases cover known, partial, unknown, explicit zero, null and undefined extra buckets; budget/breakdown/list/detail withholding; and recovery with the original supported shape. Inputs are explicitly test-built deviations of existing synthetic fixtures, not producer captures or authority evidence.

## Actual validation

- Node `24.15.0`, npm `11.12.1`, unchanged pinned toolchain.
- Baseline: `npm test -- --run tests/components/finance-v2-valuation-boundary.test.tsx` failed all11 new cases on the original guard. That failure establishes acceptance/omission and unsafe export-slot presentation in the synthetic view.
- Repair: focused valuation, existing Finance view and captured-conformance suites passed. `npm test -- --run --reporter=json --outputFile=/private/tmp/td-valuation-full.json` passed **1,401/1,401**, zero failed or pending tests.
- `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` passed.
- `npm run test:host` exits **1/BLOCKED** for missing accepted real mount/runtime/auth/data evidence. No fixture success substitutes for it.
- Graph CLI invocation failed with exit127 (`entire: command not found`); focused source inspection was used after reading its instructions.
- No new browser or genuine host/Finance execution is claimed by these local results. Earlier macOS232/233 failure and Ubuntu233/233 success remain historical evidence in `older-issues-20261015.md`; this change does not rewrite those results.

## Fresh dependency assessment

Current upstream main identities were checked live: host `a65ba91f3871b22e1a290574d0fe80155e8f4291`, Finance `521e4be13b9d42d93e15582ad8b866b02b94fc15`, shared-contracts `11f3434af02dc0855a0eb3476f18c75cfcd16b6d`, brand `3910e0af590cf22b12a40d19095a0468e94a96d1`.

Finance query issue #2 is now **closed**. Its completion is not treated as an absent API or a reason to wait for the entire Finance epic. Its actual [reporting contract](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/blob/521e4be13b9d42d93e15582ad8b866b02b94fc15/docs/api/reporting.md) still states that production issuer mapping and producer/consumer acknowledgement are pending. The [binding source](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/blob/521e4be13b9d42d93e15582ad8b866b02b94fc15/docs/api/partition-binding.md) defaults to unavailable and supplies an explicitly `isolated_fixture` adapter, not a production custody grant.

The current [host boundary](https://github.com/Jevelopers-neatHack-2026/getticketstub.com/blob/a65ba91f3871b22e1a290574d0fe80155e8f4291/docs/integration/dashboard-host.md) explicitly does not install this package. It records app Node22 versus dashboard Node24 support and requires an accepted artifact/runtime choice. Its live authority guard is real source work, but it returns a display projection and unavailable/restricted financial state until the actual reader, grants and disclosure contract are supplied. Updating a package import in this repository alone cannot install the package into that foreign application.

The current [brand consumer contract](https://github.com/Jevelopers-neatHack-2026/brand-kit/blob/3910e0af590cf22b12a40d19095a0468e94a96d1/docs/consumers.md) remains review-only with no approved distribution. No new assets/fonts or rights are adopted here.

| Issue | Local state | Specific remaining owner input |
| --- | --- | --- |
| #1 epic | Existing package, synthetic views, contract/capture tests and repairs | Required leaves, then #16/#4; accountable dashboard and integration-evals acceptance. |
| #3 package/mount | Package, route manifest, boundary and packed fixture-host tests implemented | Host getticketstub.com #7/#9/#19/#27: accepted Node/runtime/artifact choice and actual mounted package with current auth/read context, direct/reload/denial evidence. |
| #4 release gate | Deliberately open; host gate remains BLOCKED | Complete required leaves and unchanged FIN-10/DASH-01..04 evidence; named review. |
| #5 typed adapter | 0.9.7 adapter, synthetic Finance guard; unsupported valuation omission repaired here | shared-contracts #11/#12/#13 and Finance #3/#8/#13: accepted versioned usage/reservation/reporting contracts, producer references and actual host grant/scope/disclosure composition. |
| #6 KPIs | Supplied-value summary and explicit unknown/unavailable presentation | Finance #2/#14/#16: accepted metric catalogue, full required metric/source coverage and real mounted matching drilldown oracles. Closed #2 does not provide the missing host adoption. |
| #7 filters/drilldowns | Snapshot paging and explicit unsupported local filters | Finance #2 and host #7/#9: accepted dimension capability map and same period/timezone/snapshot/detail/export predicates through the installed consumer. |
| #8 budgets | Advisory supplied balances/lifecycle/unknown-capacity presentation | Finance #2/#12/#13: accepted policy threshold decisions, reservation projections, policy/report-period semantics and integrated evidence. UI must not invent spend authority. |
| #9 breakdowns | Synthetic/captured amount, currency and economic-mode presentation | Finance #2/#14/#15/#16: accepted source/category/allocation/fulfillment coverage and canonical FIN-10/DASH-01/02 evidence through host composition. |
| #10 evidence | Safe-link primitive; no automatic exposure of source refs | Finance #8/#11, shared-contracts #8, host #9: privacy-approved redacted evidence projection, destination current-access checks and permitted trace chain. |
| #11 roles/commands | Existing verifier seam and proposed permission matrix | Host #9, Finance #8/#12/#14: accepted actual grants and command API/idempotency/reason/audit contract, real allow/deny/revocation evidence. Browser controls are not server enforcement. |
| #12 exports | Exact17 retained receipts and denial/clock/recovery tests | Finance #3/#8 and host #9: actual current read/export authority, accepted source and final disclosure boundary, generation/download denial evidence. JSON-requested captures do not establish CSV-requested producer behavior. |
| #13 CFO | Manual prepared/unavailable presentation | Finance/CFO owner and Finance #3: authoritative reconciled summary and actual authorized delivery/import; separate dated scenario owner/input/provenance acceptance. |
| #14 states | Existing uncertainty/recovery/race safeguards; unsupported valuation refusal here | Finance #13/#16 and host #9: accepted reported-unsettled interface/captures and full mounted state/coverage/snapshot matrix. |
| #15 accessibility | Existing shared components, keyboard/contrast/zoom fixtures | Brand #7/#9/#14: approved artifact/font/rights contract; Product/design: real mounted views and named manual/assistive-technology acceptance. |
| #16 validation | Required local suites and pinned fixtures; new failure-sensitive regressions | Accepted actual host/Finance matrix and original global procedures; integration-evals owns master acceptance and is downstream, not a circular prerequisite. |

Shared runtime handoff: Product/runtime plus Finance/reliability must provide accepted adapter SHA/tree, current issuer/principal/session and separate read/export grants, exact tenant/project/actor/environment/billing mapping, finite field/purpose policy, actual source and coherent post-await disclosure/custody/recovery fence, with valid/revoked/expired/foreign/missing-source negatives. The local package cannot manufacture these decisions or evidence. Existing [Finance request](https://github.com/Jevelopers-neatHack-2026/cost-intelligence/issues/3#issuecomment-6132284704) and [host receipt](https://github.com/Jevelopers-neatHack-2026/getticketstub.com/issues/9#issuecomment-6137191018) remain the routing points.

All15 issues remain open. This handoff distinguishes missing external acceptance from available source and does not claim that a closed dependency or a green mock suite completes the product. The exact PR/review/merge/post-merge results will be recorded separately after they occur.
