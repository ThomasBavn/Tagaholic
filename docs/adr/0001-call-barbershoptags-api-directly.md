# 1. Call the barbershoptags.com API directly from the app

Date: 2026-11-12

## Status

Accepted

## Context

All Tags come from the barbershoptags.com API, which Tagaholic only reads. An Express server in `backend/` forwarded search requests to that API. It needed hosting, and the app reached it through a hardcoded LAN IP address. It also had bugs that corrupted queries: a missing `&` before `client=Tagaholic`, and a misspelled `minDownLoaded` parameter.

The API returns XML and sends `Access-Control-Allow-Origin: *`, so a browser build can call it as well as a phone build. In the MVP, a Singer's data (Sung Parts and Bookmarks) lives only on the device, so the app needs no server of its own.

## Decision

Remove `backend/`. The app calls the barbershoptags.com API directly, parses the XML on the device, and caches responses locally.

## Consequences

- There's no server to host, and no LAN IP to configure.
- The app must send `client=Tagaholic` itself and follow the API's terms of use.
- If barbershoptags.com ever needs an API key or blocks cross-origin requests, or if accounts and sync across devices arrive, this decision should be revisited.
