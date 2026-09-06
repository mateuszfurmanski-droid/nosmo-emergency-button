# NOSMO Emergency Core — V1.0009 release gate

Status: ENGINEERING RC
Clinical freeze: CF-2026-09-06-01

This repository must not describe the current build as clinically approved, certified, pilot-ready or production-ready for medical use until all required release gates are PASS.

## Required gates

- Real-device acceptance on target Android hardware: PENDING
- Independent clinical review of visible first-aid instructions: PENDING
- Human professional review of non-English emergency translations: PENDING
- Product safety / legal review of intended use and claims: PENDING

## Frozen medical copy

The clinical-freeze module pins the Git blob fingerprints of the current English emergency engine, Site Medical Pack and all 17 language packs. CI fails if those files change without a new clinical-freeze revision.

## Source traceability

Every scenario exposed by the current Emergency Core and Site Medical Pack must resolve to at least one source entry in `src/source-provenance.js`. The current source set includes Resuscitation Council UK, NHS and British Red Cross references.

## Device acceptance deferred

The Fold / Android real-device acceptance checklist remains open. It must be completed before any pilot claim. Engineering CI cannot substitute for tests of PWA install, airplane-mode reopen, GPS permissions, dialler return, fullscreen, wake lock, fold/unfold and screen rotation on real hardware.
