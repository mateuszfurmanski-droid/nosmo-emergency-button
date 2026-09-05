# NOSMO Emergency Button

Standalone, mobile-first, offline-capable emergency assistance PWA for UK users.

Version: **V1.0001 Release Candidate**

## Safety position

NOSMO Emergency Button is not a replacement for 999, 112, paramedics, doctors, qualified first aiders, or emergency medical services. In potentially life-threatening situations the application prioritises calling 999 / 112. The app only opens the device dialler; it never claims a call has connected or emergency services have been notified.

Core guidance is deterministic and stored locally. Free-text symptom routing cannot suppress life-threatening escalation.

## Core V1 capability

- giant emergency activation control
- 999 / 112 actions kept prominent in emergency mode
- scene safety, responsiveness, breathing and severe-bleeding triage
- adult, child and infant CPR guidance
- AED guidance
- severe bleeding, choking, stroke, chest pain / suspected heart attack, anaphylaxis, seizure and additional emergency scenarios
- local symptom / free-text routing
- optional voice input and read-aloud guidance where supported
- optional local haptics / CPR rhythm assistance
- optional geolocation, requested only by user action
- copy / share location where supported
- offline-first service worker and local protocol data
- installable PWA manifest and icons
- 17 UK-relevant languages
- no backend dependency for critical guidance
- no dependency on NOSMO Work, NOSMO Agency or Nexus Core

## Languages

English, Polish, Romanian, Urdu, Punjabi, Bengali, Gujarati, Arabic, Portuguese, Spanish, French, Lithuanian, Bulgarian, Ukrainian, Chinese, Turkish and Italian.

Critical emergency paths use local translations. Less-common extended scenario text may explicitly fall back to the reviewed English source rather than using runtime machine translation.

## Privacy

The V1 core does not require an account. Emergency answers are held only for the active session. The application does not send symptom answers or location to a NOSMO backend. Location is requested only after explicit user action.

## Medical content governance

Source provenance is stored in `src/source-provenance.js`. Guidance is intended to be aligned to current UK authoritative sources including NHS, Resuscitation Council UK, British Red Cross and St John Ambulance. Emergency service operator instructions always take priority.

Production release should retain a documented clinical-content review and translation-review process when source guidance changes.

## Run locally

Requires Node.js 20+.

```bash
npm test
npm run check
npm start
```

Open `http://127.0.0.1:4173`.

## Acceptance

The automated V1 suite covers the required emergency routes, free-text routing, offline asset contract, language preservation, narrow-screen safety constraints, no fake responder claims and isolation from other NOSMO applications.

## Deployment

This project is deliberately standalone. It can be deployed as a static PWA over HTTPS. `vercel.json` is included for a simple Vercel deployment.

Target production hostname: `emergency.nosmo.tech`.

## Release gates before public medical-use launch

1. Real-device installation / reopen / airplane-mode validation.
2. 360 px and Fold-class visual QA.
3. Final clinical review of safety-critical content.
4. Human review of all production translations.
5. HTTPS production deployment and final service-worker update test.
