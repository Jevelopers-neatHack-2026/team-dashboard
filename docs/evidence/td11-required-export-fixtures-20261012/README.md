# TD-11: required export fixture inventory

Refs #16 and #12. This is a test-coverage repair, not Finance, actual-host or release acceptance.

## Behavior and scope

The accepted export conformance packet contains receipts 0–16 and 34 artifact files. Main `eeefeb3497f3ce43fb9cc456ca67e5bbbe3b1a0f` contains all 17, and its separate run 38302841549 actually executed all 74 export conformance cases. That result remains valid.

The old suite selected cases from only the receipts present on disk. Unless `TD_REQUIRE_EXPORT_FIXTURES=1`, an incomplete checkout could silently lose required cases while its inventory assertion passed. Two additional tests returned early for missing receipts 2 and 16.

The repaired suite calls `requireExportReceiptIndices` before registering cases, always uses the fixed 0–16 inventory, and removes both early returns. Missing files fail collection with fixed filenames and instructions to restore the exact accepted copies. The legacy `TD_REQUIRE_EXPORT_FIXTURES` setting is no longer needed and cannot make a required receipt optional. Historical provisioning notes in the unchanged fixture PROVENANCE record describe the original receipt-copy stage, not the current required coverage.

No captured bytes, schemas, pins, financial expectations, runtime code, permissions, host ports or dependency versions change. No synthetic replacement receipt is generated. The 22 new inventory tests use TEST_BUILT presence callbacks only; the existing conformance suite still checks the real captured synthetic artifact bytes and retains legacy-format refusal and cross-snapshot controls.

## Exact source and local execution

Base commit: `eeefeb3497f3ce43fb9cc456ca67e5bbbe3b1a0f`; base tree: `75df49586fe6fb18acf6c74f99861247c7d880a6`.

| Source | Git blob |
| --- | --- |
| Original conformance test, 15,911 bytes | `2ff7a27bc1b66344e57e64d345043c4188f99c42` |
| Repaired conformance test | `578472956b2d3be75b78aa5d412fdc78b89eddbc` |
| New inventory helper | `1395f0c7d17cac257f4b7644ea889b126b6ebc9a` |
| New 22-case Vitest suite | `4485662da4bba7da93972b8f340bbb7159698b54` |

Execution date: 2026-10-12 UTC. Actual local runtime: Node 22.16.0, npm 10.9.2 and TypeScript 5.8.3. The original source snapshot was verified against its Git blob before editing. GitHub cloning failed DNS and the required Entire graph command failed because `entire` was unavailable. This was an isolated source snapshot, not a full checkout or the mandated Node 24 toolchain.

`probe-inventory.cjs.txt` contains the actual local probe, retained as text rather than a repository command. Copy it to a temporary `.cjs` path to replay. It transpiles the source and executes its test registration plus the real inventory assertion using injected presence and registration shims. It does not execute financial test bodies, Vitest, React, a browser or a Finance service. Each missing-file case also restores that receipt and checks that all 74 cases are registered again. The probe never deletes or rewrites actual receipt files.

| Executed local command | Actual outcome |
| --- | --- |
| `NODE_PATH=$(npm root -g) node probe-inventory.cjs base/tests/components/finance-v2-export-conformance.test.ts` | exit 1; 22 passing and 32 failing expectations, 0 skipped |
| Same command with `candidate/tests/components/finance-v2-export-conformance.test.ts` | exit 0; 54 passing, 0 failing/skipped |
| TypeScript `transpileModule` with diagnostics and `node --check` on each generated module for the three affected TypeScript files | No transpilation diagnostics; all three syntax checks exit 0. Not project typechecking. |

The 54 probe scenarios are three complete inventories plus every single missing receipt under unset, `0`, and `1` legacy flag values. The 32 red cases are missing receipts 1–16 under unset/`0`: the baseline inventory accepted the reduced registration. For example, missing legacy receipt 1 registered only 72 cases instead of 74. The repair refuses collection before any test is registered; restoration recovers all 74. The failing baseline is preserved, not relabelled as passing.

## Raw evidence

The `.json.gz` files are lossless gzip storage of the original JSON outputs (fixed gzip timestamp). They contain synthetic registration observations only. Read them with `gzip -dc <file>`; the original uncompressed output hashes below must match.

| Artifact | SHA-256 |
| --- | --- |
| probe-inventory.cjs.txt | `ac8fcf8997342996b682c9926cab3b1f1bd03404bd4e61051d59f0d4df0aa28a` |
| baseline-registration.json, uncompressed | `8838adfa007fd509ba55ba823216e8a771a017fac2013a7aaf56d29dcd0eb2b2` |
| baseline-registration.json.gz | `a51e5f9f70b8defda3fa55c2bb9d4b2af39a7d6db35da018652a6e0c63255188` |
| repaired-registration.json, uncompressed | `763b69e0d3ae536066cb4cd90424ff817287f753b6f55f80feb7ace2742ba329` |
| repaired-registration.json.gz | `e5c6f78c4e62675a3b22970f9efb92ea5ce13578eeb44a83394cb2c27b97b38a` |

## Required hosted qualification and owner handoff

The new 22-case Vitest suite was authored but not executed locally. On the mandated Node 24.15.0/npm 11.12.1 runtime, run `npm test -- --run tests/components/export-fixture-inventory.test.ts tests/components/finance-v2-export-conformance.test.ts`, and the full existing locked-install/lint/typecheck/Vitest/build/contrast/browser/packed-fixture-host/report-gate workflow. Record actual candidate checkout/head/tree, commands and outcomes in the PR; do not transfer the earlier main results to the new candidate. A qualifying merge requires accountable independent review and current checks, followed by separate resulting-main verification.

The real `test:host` prerequisite is unchanged. Product/runtime and Finance still owe an accepted current-authority, scoped read/export and final-disclosure composition. The existing Finance packets remain synthetic conformance evidence; CSV-requested positive controls are TEST_BUILT, not new producer captures. No provider request, credential provisioning, CFO delivery/import, deployment, publication or global acceptance occurred. Paid product-provider authorization, budget and cost: N/A. No leaf, gate or epic closes through this receipt.
