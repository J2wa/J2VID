# Login and live activity

Before deploying this branch, configure the following **server-side** environment
variables on the `j2viddd` Vercel project. Configure `j2vid` too if deploying there.

| Variable | Value |
| --- | --- |
| `USER_PASSWORD` | The shared user password chosen by the owner |
| `ADMIN_PASSWORD` | The separate administrator password chosen by the owner |
| `UPSTASH_REDIS_REST_URL` | The connected Upstash Redis HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | The database's read/write REST token |

Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` are accepted aliases. Use a
database owned by the app owner. Set values for Production and, to validate a
branch deployment, Preview. Preview and production data use different prefixes.
Do not prefix any secret with `VITE_`, commit values, or use a read-only token.
Redis is accessed over HTTPS with no additional package required.

Any username of 1–40 characters is accepted. The password alone determines the
role; usernames are display labels, not verified identities. Each browser login
creates one opaque session. Multiple tabs share that browser session. Passwords
are checked only on the server; cookies are HttpOnly, Secure on Vercel, SameSite
Strict, and expire after 12 hours. Signing out revokes the token. Changing a role's
password invalidates its existing sessions on the next request.

The app sends a heartbeat every 30 seconds while visible. A session is online
when seen within two minutes; this is an estimate, not a unique-person count.
Public-to-signed-in-users responses contain session aliases, last-seen times, and
AI request counts. They never contain another user's username, role, IP, or event
log. An administrator sees full IPs, display usernames, current app sections, and
the latest 100 login/logout/section-change/AI-request events. No prompt, filename, media, or
annotation text is logged. At most 1,000 events are retained for up to 24 hours.
Presence metadata expires 24 hours after last activity. Auth records expire after
12 hours. Login rate limits use IP hashes and expire in 15 minutes.

Every AI endpoint requires a valid session and same-origin request headers.
Missing configuration or storage outages fail closed: no unauthenticated access,
fake counts, or process-local presence fallback. The UI reports unavailability.
Keep the existing production deployment until these variables and database are
ready, then deploy the branch and test both roles before promotion.

## Verification

Run `npm run build`, `npm run lint`, and
`node --import tsx --test tests/access.test.ts`.
Tests use synthetic credentials and a test-only Redis adapter; no live AI calls
or real user records are needed. Before production promotion, verify against the
connected database that two separate browsers see each other's sessions, regular
users receive no other users' IPs, and logout invalidates AI access.
