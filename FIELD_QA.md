# NOSMO Emergency Core — V1.0008 field QA

Automated CI verifies code-level PWA/offline requirements. The following items require a real Android device before calling the build pilot-ready.

## Samsung Galaxy Z Fold 5

1. Open the production URL in Chrome with network on.
2. Confirm the home screen still shows the original large rectangular SOS control.
3. If the browser exposes the install event, tap INSTALL and confirm the app launches from the home screen without browser chrome.
4. Close the installed app completely and reopen it.
5. Enable airplane mode, reopen the installed app, press SOS and confirm triage, adult CPR, severe bleeding, Site Card and language selection still work.
6. With network restored, tap LOCATION, allow precise location and confirm coordinates appear. Deny permission once and confirm emergency guidance still works.
7. Start an emergency session, rotate portrait -> landscape -> portrait and fold/unfold the device. Confirm no critical button leaves the viewport and the session is not reset.
8. Start adult CPR rhythm, background the app for 10 seconds and return. Confirm the emergency screen remains usable and no automatic call/dispatch claim appears.
9. Switch EN -> PL -> RO -> EN during an active session and confirm the incident is not reset.
10. Open Site Card, save test site details, close/reopen the app and confirm the local Site Card persists.
11. Open 999 HANDOVER and verify site, access point, casualty state and GPS are correct. CALL 999 / CALL 112 must only open the phone dialler.
12. Clear local Site Card data and confirm missing values are shown as NOT SET / NOT AVAILABLE, never invented.

## Pass criteria

- No crash, blank screen or reload during an active incident.
- No fake responder, dispatch, connected-call or monitoring claims.
- Core emergency guidance works with airplane mode after one successful online load/install.
- All critical controls remain reachable on Fold cover screen, inner screen, portrait and landscape.
- Real-device install, offline, GPS and dialler behaviour must be confirmed manually before pilot use.
