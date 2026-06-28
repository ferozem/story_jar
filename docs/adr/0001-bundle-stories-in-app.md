# Bundle stories inside the app binary

Story content (text, illustrations, cover art) is shipped as static assets bundled with the app rather than fetched from a remote server. Adding or updating stories requires a new app store release. This was a deliberate call: the story library is small and stable, there is no backend to build or operate, and the app must work fully offline. The app store release cadence is acceptable given the infrequent content updates expected.

## Considered Options

- **Remote content API** — stories fetched at runtime, new content deployable without a release. Rejected: requires a backend, adds network dependency, breaks offline use.
- **Bundled assets (chosen)** — stories ship with the app. Fully offline, zero backend, at the cost of a release per content update.