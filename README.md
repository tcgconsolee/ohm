# Ohm - MVP

A power outage risk prediction app, built for small industrial businesses in Coimbatore, Tamil Nadu, as a concept for
Qutuhal InnovateX 2.0 (Frontier Innovators track).

Ohm takes live weather reports, local outage records, and self-reported infrastructure information and distills it into an easy-to-read Low / Elevated / High indicator.

## Status
This is a proof-of-concept MVP; the actual polished application has yet to be built

Currently implements a diagnostic view that represents a simplified version of the full data pipeline (weather fetch, outage feed fetch, risk calculation, local persistence, confirmation logic), rather than the full Home / Details / Accuracy / Settings / Action Plan UI seen in the mockups, which is implemented separately for now.

## Architecture

• All processing is done on the device; no backend is implemented or planned. User location, infrastructure information, and all analytics are local to the device.
• Heuristic, not ML: weather, history, and infrastructure factors are combined with hard-coded weights (see

core/riskEngine.ts)
rather than a trained model.
There is not yet enough data on local patterns to train something responsibly, and the long-term goal is to upgrade to something like
XGBoost after enough local history has been gathered.
• Generally falls back on cached data if a data source is unavailable, rather than failing catastrophically.
### Data sources
Source Description Notes
[Open-Meteo](https://open-meteo.com) Live weather report Shows hourly wind, precipitation, and storm chance. Free, requires no API key. Actual API.
[NammaMap outage feed](https://outage.nammamap.in) Scheduled TANGEDCO outages Unofficial; may be down or change formats unexpectedly. There is currently a reported bug (`fetch()` call from `expo start --web`) where this fails to load in a browser, but works when loaded directly in a browser tab - likely a CORS issue, and should behave normally on a native mobile build.
On-device confirmation log Past outage frequency for this device Always starts empty for a fresh install. Local to this device only; no backend to aggregate histories across users.
Self-reported infrastructure Feeder type, connection age, etc. Lowest priority factor, as this is the user-submitted data, and may be noisy.
## Known limitations
• Currently no official feed for Indian power outages; using an unofficial circular aggregator with no uptime guarantees.
Can only predict weather-related or pattern-based outages; not equipment failures, theft, or human error.
• Local history is per-device; there is no backend to let the app learn from other users' data, for privacy reasons.
This also means that a user's risk history only tracks their own outages, not regional ones they might be affected by.
• Only effective in Coimbatore; other regions in Tamil Nadu or India have not been considered.
The outage parser and threshold weights have only been tested in Coimbatore.
• The weights in
riskEngine.ts are not based on any research; the papers cited below only show that such a model could work, not how to implement it.
### Research grounding
Allcott et al (NBER / American Economic Review, 2016) - electricity shortages reduce average Indian plant revenue by 5-10%; businesses without backup generators are worst hit.
Lee et al (ORNL, IEEE IRI 2023) - machine learning can predict outage risk based on historical data (EAGLE-I database) + National Weather Service alerts. Shows that outage prediction is possible using pattern recognition; does not specify how to implement it.
Other references to India's electricity problems, blackout economics, small-business impacts - see the project's tech spec for a more detailed list.
## Project structure
```ts
App.tsx         # diagnostic MVP view - stitches together the whole pipeline
core/
weather.ts        # Open-Meteo fetch + fallback + risk scoring
outageFeed.ts       # NammaMap outage parser
historyFactor.ts      # history-based risk factor calculator
infrastructureFactor.ts  # infrastructure report parser
confirmationLog.ts     # persistent storage of risk windows + user confirmations
userSettings.ts      # persistent storage of current location + infrastructure
riskEngine.ts        # final risk calculation + tier assignment
notifications.ts      # app-level alerts + confirmation prompts
```

## Running it
```markup

npm install
npx expo start
```
Then scan the QR code with

Expo Go
on a phone,
or
type
w
in the terminal to test in a browser (note: reported issues with the outage feed fetcher in browser mode)
### Expo Go note

Make sure to use a recent Expo SDK version, as some mobile devices may refuse to load the project if your expo go app is too old.
If this happens, try installing the sdk-specific builds directly from
https://expo.dev/go?sdkVersion=&platform=android
or
ios
, rather than relying on the google play / app store listings, which may not always have the latest sdk.

## What's next?

• The actual designed UI (Home risk ring, Details, Accuracy, Settings, Action Plan) - currently only has the diagnostic view that stitches together the pipeline
• A real onboarding flow (Location → Infrastructure → Preferences → Disclosure), rather than having those forms inline with the diagnostic
• Verified notifications + confirmation logic; the code is there, but it cannot be easily tested on a desktop browser
