# RiskLens

**RiskLens** is an AI-powered risk and incident intelligence platform being
built with Next.js and an AWS-first backend. It is intended to help
organizations log workplace/operational incidents, understand their risk
posture, and eventually use AI (AWS Bedrock) to summarize incidents,
classify risk, and suggest corrective actions.

- **What it is:** an incident logging and risk-intelligence web application.
- **Problem it solves:** incidents are often reported in spreadsheets or
  disconnected forms with no structured history, no consistent risk scoring,
  and no way to surface patterns across past incidents.
- **Who it's for:** safety/risk/operations teams that need a single place to
  record incidents, track their status, and (in later phases) get
  AI-assisted analysis instead of manually reviewing every report.
- **Why AI/Bedrock:** the long-term value of RiskLens is not just data entry
  — it's using AWS Bedrock to summarize incidents, flag severity/risk
  patterns, surface similar past incidents, and recommend corrective and
  preventive actions, backed by a knowledge base of policies and past
  incidents (RAG).

> This README distinguishes **Current** (verified in the codebase),
> **Planned** (near-term, designed but not built), and **Future** (product
> direction) capabilities. Nothing below is claimed as working unless it
> was verified directly in the code (and, for the AppSync integration,
> against the live AppSync API).

---

## Current Status

```text
Phase 1 — Foundation & AppSync/GraphQL Incident Integration
Status: Complete

Phase 2 — Cognito Authentication
Status: Complete

Phase 2.2 — Multi-Tenancy + Organization-aware Incident Management
Status: Local implementation done — AWS Console changes + data
        migration required before this phase is live (see
        Multi-Tenancy below)
```

The original 10-phase roadmap scoped "AppSync + GraphQL API layer" and
"Incident CRUD" as separate Phases 2 and 3. They shipped together as one
AppSync-backed MVP and are folded into Phase 1 here — see
[Development Roadmap](#development-roadmap) for the renumbered plan.

**Phase 2 status in detail:** Cognito User Pool authentication is fully
integrated end-to-end. Login, logout, session handling, the client-side
route guard, and Cognito-authenticated `GetIncidents`/`GetIncident`/
`CreateIncident` calls have all been verified working. The AppSync API
now enforces Cognito User Pool authorization (previously it only
accepted `x-api-key` — see [Authentication](#authentication) for how
this was confirmed). The frontend no longer depends on the AppSync API
key for authenticated Incident functionality.

Verified as implemented today:

- Next.js App Router project (JavaScript, no TypeScript), Tailwind CSS v4,
  ESLint flat config.
- A native-`fetch` GraphQL client (`src/graphql/client/appsync.js`) that
  posts to AWS AppSync with a Cognito ID token as the `Authorization`
  header, validates required env vars up front, and distinguishes
  network errors / HTTP errors / GraphQL errors.
- GraphQL operations matching the deployed AppSync schema exactly:
  `GetIncidents`, `GetIncident`, `CreateIncident`
  (`src/graphql/queries/`, `src/graphql/mutations/`).
- An application service layer (`src/lib/incidents.js`) exposing
  `getIncidents()`, `getIncident(id)`, `createIncident(input)` — no
  DynamoDB keys, table names, or GSI names appear anywhere above this
  layer.
- `/incidents` — list page wired to `getIncidents()`, with loading,
  error, and empty states, and "Load More" pagination that appends pages
  via AppSync's `nextToken` (never replaces existing items).
- `/incidents/new` — create form wired to `createIncident()`; on success
  it redirects to the new incident's detail page.
- `/incidents/[id]` — incident detail page wired to `getIncident(id)`,
  with loading, not-found, and error states.
- Cognito User Pool authentication (`src/lib/amplify.js`,
  `src/lib/auth.js`, `src/components/AmplifyProvider.js`) with a public
  app client (no client secret), login/logout, and a client-side route
  guard (`src/app/(app)/layout.js`) protecting `/dashboard` and all
  `/incidents*` routes.
- Verified against the **live AppSync API** (not mocked): both the
  Incident read/create flow and the Cognito authorization switch were
  confirmed with direct requests to the AppSync endpoint, not just code
  review; `npm run lint` and `npm run build` both pass.

Removed as part of this phase (superseded by AppSync):

- `src/app/api/incidents/route.js` — the old Next.js Route Handler (had
  a broken import and was never called by any UI).
- `src/lib/aws/dynamodb.js`, `src/lib/aws/incident.js` — direct DynamoDB
  access layer.
- `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` — uninstalled from
  `package.json`/`package-lock.json` (no longer used anywhere).
- `src/app/graphql-test/` — a scratch page used to manually verify the
  GraphQL client during development.

**Next.js no longer talks to DynamoDB directly for Incident
functionality.** The only data path is `Next.js → AppSync → GraphQL →
DynamoDB`.

Not yet implemented: Incident update/delete (AppSync doesn't expose
those operations yet), S3 attachments, Bedrock AI analysis, tests,
CI/CD, and infrastructure-as-code. See
[Development Roadmap](#development-roadmap).

---

## Technology Stack

| Technology | Status | Notes |
|---|---|---|
| Next.js (App Router, JavaScript) | **Implemented** | Next.js 16, React 19, `reactCompiler: true` enabled in `next.config.mjs` |
| Tailwind CSS | **Implemented** | Tailwind v4 via `@tailwindcss/postcss` |
| ESLint | **Implemented** | Flat config (`eslint.config.mjs`) extending `eslint-config-next` |
| AWS AppSync + GraphQL | **Implemented** | Primary API layer for Incident functionality; enforces Cognito User Pool authorization — see [Authentication](#authentication) |
| Amazon DynamoDB | **Implemented (via AppSync only)** | Single table `RiskLens` (`pk`/`sk` + `GSI1`), accessed exclusively through AppSync resolvers — no direct SDK usage remains in the app |
| Amazon Cognito | **Implemented** | User Pool + public app client (no secret); sign-in/sign-out work, and AppSync validates Cognito ID tokens for authenticated Incident operations |
| AWS Amplify (`aws-amplify`) | **Implemented** | `Auth` category only, configured once via `src/components/AmplifyProvider.js`; no other Amplify categories used |
| AWS Lambda | **Planned** | For business logic between AppSync and Bedrock/other services |
| AWS Bedrock | **Future** | AI summarization, risk scoring, RAG |
| Amazon S3 | **Future** | Incident attachments |
| OpenSearch | **Future** | Vector/similar-incident search |
| Testing framework | **Not configured** | No unit/integration/e2e test tooling present in `package.json` (deliberate choice for this project) |
| CI/CD | **Not configured** | No `.github/workflows` or other pipeline config present |

Do not treat Lambda, Bedrock, S3, or OpenSearch as already integrated —
none of them appear in `package.json` or the source tree. Cognito and
AppSync authorization are both real and enforced — see
[Authentication](#authentication).

---

## Architecture

### Current (verified) — Incident functionality

```mermaid
flowchart LR
    A[Next.js<br/>client components] -->|"Cognito ID token<br/>(Authorization header)"| B[AWS AppSync<br/>GraphQL API]
    B --> C[(DynamoDB<br/>RiskLens table<br/>pk / sk + GSI1)]
```

`src/graphql/client/appsync.js` fetches the current Cognito session via
`src/lib/auth.js` and posts to `NEXT_PUBLIC_APPSYNC_URL` with the ID
token as the `Authorization` header — no API key is sent by the app
anymore. `src/lib/incidents.js` is the only caller of that client; UI
pages call `src/lib/incidents.js`, never the GraphQL client, Amplify, or
AppSync directly. DynamoDB `pk`/`sk`/`GSI1PK`/`GSI1SK` values are
generated inside AppSync resolvers and are never constructed by the
frontend.

This is now the verified working state — see
[Authentication](#authentication) for how the AppSync-side Cognito
authorization was confirmed.

### Target architecture

```mermaid
flowchart TD
    A[Next.js<br/>JavaScript + App Router + Tailwind] -->|GraphQL + Cognito JWT| B[AWS AppSync<br/>GraphQL API]
    B --> C[(DynamoDB<br/>RiskLens table)]
    B --> D[AWS Lambda]
    B --> E[OpenSearch / Search]
    D --> F[AWS Bedrock]
    A --> G[Amazon Cognito<br/>User Pool]
    A -.future.-> H[Amazon S3]
```

Lambda, OpenSearch, Bedrock, and S3 are target/future components and are
not implemented yet. Cognito and the AppSync authorization link to it
(`A --> G`, and AppSync validating `G`'s tokens) are both real and
enforced today, not aspirational.

API Gateway is intentionally **not** part of the architecture and
should only be introduced later for a specific integration that
requires it (e.g. a webhook receiver).

---

## Authentication

Phase 2 is **complete**: Cognito User Pool authentication is integrated
with AppSync's Cognito User Pool authorization, and the full Incident
flow (list, detail, create, pagination) has been verified working
end-to-end for an authenticated user, alongside login, logout, session
handling, and route protection for unauthenticated access.

### What's implemented (verified)

- **Cognito User Pool + public app client** (no client secret) — created
  outside this repo; sign-in confirmed working before this migration
  started.
- **`src/lib/amplify.js`** — `configureAmplify()`, idempotent, validates
  `NEXT_PUBLIC_COGNITO_USER_POOL_ID` / `NEXT_PUBLIC_COGNITO_CLIENT_ID` /
  `NEXT_PUBLIC_COGNITO_REGION` with clear errors if missing.
- **`src/components/AmplifyProvider.js`** — mounted once, in
  `src/app/layout.js`, wrapping the whole app. It calls
  `configureAmplify()` directly during render (not inside a `useEffect`)
  specifically so Amplify is configured before any nested page's effects
  run — React fires child effects before parent effects, so an
  effect-based approach here would race. This was previously built but
  never mounted anywhere; fixed as part of this phase.
- **`src/lib/auth.js`** — the single authentication service:
  `login(email, password)`, `logout()`, `getAuthenticatedUser()`,
  `getAuthSession()`. This is the only file that imports from
  `aws-amplify/auth` directly; everything else (the login page, the
  route guard, the GraphQL client) goes through this file.
- **`/login`** (`src/app/login/page.js`) — email/password form using
  `src/lib/auth.js`, not Cognito APIs directly. Handles loading state,
  wrong-credential/missing-field errors (surfaced from Amplify's own
  error messages), and redirects already-authenticated visitors away
  from `/login`. No debug logging of session/token data (removed during
  this phase — the previous version logged the full sign-in result and
  session object, including raw JWTs, to the browser console).
- **Route protection** (`src/app/(app)/layout.js`) — `/dashboard`,
  `/incidents`, `/incidents/new`, and `/incidents/[id]` were moved into
  an `(app)` route group (a Next.js route group — it does not change any
  URL) with a shared client-side layout that checks for a Cognito
  session (via `getAuthSession()`) on mount, redirects to `/login` if
  there's no session, and renders a small header with a working
  "Sign out" button. **This is a UX guard, not a security boundary** —
  see the note below.
- **`src/graphql/client/appsync.js`** — calls `getAuthSession()`, reads
  `session.tokens.idToken`, and sends it as the `Authorization` header.
  If there's no session it throws `"No authenticated Cognito session
  found"` instead of an obscure `fetch` failure. Network errors, JSON
  parse errors, HTTP errors, and GraphQL errors are all handled and
  produce distinct messages (same layered error handling as Phase 1, now
  merged with the auth-session check).
- **ID token, not access token:** the client sends the Cognito **ID
  token**. This matches how Amplify's own AppSync integration behaves,
  and — unlike the access token — the ID token carries user attributes
  and `cognito:groups`, which the future roadmap's roles/organizations
  work will need.
- **AppSync now enforces Cognito User Pool authorization.** Confirmed
  working end-to-end: login → `/incidents` loading real data →
  `/incidents/new` creating a real incident → the new incident appearing
  in the list → `/incidents/[id]` loading it → sign out → protected
  routes requiring login again.
- **The frontend no longer depends on the AppSync API key for
  authenticated Incident functionality** — confirmed by repo-wide
  search: no application code sends `x-api-key` or reads
  `NEXT_PUBLIC_APPSYNC_API_KEY` anymore.

### How the AppSync-side switch was confirmed

This session independently re-checked AppSync's live behavior (not just
taking the AWS Console change on faith) and observed a clear before/after
change from the state recorded earlier in this project's history:

```text
Before (Phase 2 in progress):
  curl with only x-api-key         -> succeeded, returned real data
  curl with a well-formed fake JWT -> generic "Valid authorization header not provided"
                                       (identical to no header at all — AppSync wasn't
                                       attempting to validate a JWT at all)

Now (Phase 2 complete):
  curl with only x-api-key         -> {"errorType":"Unauthorized","message":
                                       "Not Authorized to access incidents on type Query"}
  curl with a well-formed fake JWT -> still the generic header error (a fake JWT
                                       correctly fails signature validation)
```

The `x-api-key`-only request now gets a **schema-level authorization
error specific to the `incidents` field**, rather than succeeding —
this is the behavior you'd expect once Cognito User Pool authorization
has been added to the API and the API key is no longer sufficient for
Incident operations on its own. (Confirming this precisely via `aws
appsync get-graphql-api` was attempted but denied — the local IAM user
doesn't have that read permission — so this is inferred from live
request/response behavior, consistent with the manual end-to-end browser
verification already performed.)

### Route protection: documented limitation

The `(app)` route-group guard is **client-side only** — it checks the
session after the page's JavaScript has loaded, using
`router.replace("/login")`. It does not use Next.js Middleware, because
Amplify Auth's default session storage in the browser is `localStorage`,
which Middleware (Edge runtime) cannot read — only cookies/headers on
the incoming request are visible there. Adding cookie-based
Middleware-enforced protection would require switching Amplify to
SSR/cookie-based session storage (`@aws-amplify/adapter-nextjs`), which
is a larger architectural change appropriate for a later phase, not a
one-line fix layered onto the current client-only setup.

**The real security boundary is AppSync itself**, now that Cognito User
Pool authorization is enforced there — a technical user could bypass the
client-side route guard, but they still couldn't get AppSync to return
data without a valid Cognito token. The route guard's job is UX
(redirecting people to `/login`, not letting a signed-out user see a
flash of protected UI), not access control. This limitation is still
current (unresolved by Phase 2) — see [Future Risks](#future-risks).

---

## DynamoDB Single Table Design

```text
Table: RiskLens
Partition Key (pk): string
Sort Key (sk): string
GSI1: GSI1PK / GSI1SK   — legacy, pre-multi-tenancy incident listing
GSI2: GSI2PK / GSI2SK   — Phase 2.2, Cognito user -> organization lookup
```

This design lives entirely behind AppSync. The application code does
**not** assume a plain `id` partition key, and does not construct `pk`,
`sk`, or any GSI key anywhere — those are backend persistence details
owned by the AppSync resolvers.

**Phase 1/2 shape (pre-multi-tenancy — still the live shape until the
Phase 2.2 migration below is actually run):**

```text
pk                    sk          Used by (via AppSync resolver)
──────────────────────────────────────────────────────────────
INCIDENT#<id>         METADATA    createIncident, incident(id)

GSI1PK                GSI1SK                       Used by
──────────────────────────────────────────────────────────────
INCIDENTS              CREATED#<timestamp>#<id>    incidents(limit, nextToken)
```

**Phase 2.2 target shape (multi-tenancy — designed and documented here;
requires the AWS Console changes and migration script in
[Multi-Tenancy](#multi-tenancy-phase-22) before it's the live shape):**

```text
pk                    sk                  Used by
────────────────────────────────────────────────────────────────
ORG#<orgId>           METADATA            myOrganization
ORG#<orgId>           USER#<cognitoSub>   myOrganization (via GSI2), future membership listing
ORG#<orgId>           INCIDENT#<id>       incidents, incident(id), createIncident

GSI2PK                 GSI2SK              Used by
────────────────────────────────────────────────────────────────
USER#<cognitoSub>      ORG#<orgId>         resolveCallerOrganization (reverse lookup: given a
                                            Cognito user, find their organization membership)
```

Once the Phase 2.2 migration runs, `GSI1` becomes unused (nothing
deletes it automatically — cleaning it up is optional later work) and
`incidents(limit, nextToken)` queries the caller's own `ORG#<orgId>`
partition directly instead of one shared `INCIDENTS` bucket — a
scalability improvement noted as a Future Risk in earlier phases,
resolved as a side effect of adding tenancy.

Do not create additional DynamoDB tables per entity — this project uses
single-table design on the existing `RiskLens` table, and do not change
`pk`/`sk`/`GSI1`/`GSI2` without an explicit, documented reason.

---

## Multi-Tenancy (Phase 2.2)

```text
Phase 2.2 — Multi-Tenancy + Organization-aware Incident Management
Status: Local implementation done. AWS Console changes + data migration
        NOT yet applied — this phase is not live until you complete the
        steps below.
```

### Architecture

```text
Cognito User (identity — ctx.identity.sub, never trusted from the client)
    ↓
OrganizationMembership (DynamoDB — pk=ORG#<orgId>, sk=USER#<sub>, role)
    ↓
Organization (DynamoDB — pk=ORG#<orgId>, sk=METADATA)
    ↓
Incidents (DynamoDB — pk=ORG#<orgId>, sk=INCIDENT#<id>)
```

**The frontend never supplies an organizationId, anywhere.** Every
organization-scoped GraphQL operation (`myOrganization`, `incidents`,
`incident`, `createIncident`) determines the caller's organization
entirely from their Cognito identity, server-side, in the resolver — the
GraphQL argument shapes for `incidents`/`incident`/`createIncident` are
**unchanged** from Phase 1.

### What's implemented locally (verified by lint/build, not yet live)

- `src/graphql/queries/organization.js` — `GetMyOrganization` query
  (no arguments).
- `src/lib/organization.js` — `getMyOrganization()`, returns
  `{ organization: { id, name, createdAt, updatedAt }, role }` or
  `null` if the caller has no organization membership. Follows the
  same service-layer pattern as `src/lib/incidents.js` — no GraphQL
  strings or AWS details above this layer.
- `src/app/(app)/layout.js` — after confirming a Cognito session, loads
  the caller's organization and shows its name in the header. Added two
  new states: **no-organization** (clear message + sign-out, for a
  Cognito user with no membership row yet) and
  **organization-error** (network/GraphQL failure loading the org,
  distinct from a session failure).
- `/incidents`, `/incidents/new`, `/incidents/[id]` — **unchanged**.
  Tenant scoping happens entirely in the resolver; these pages already
  only call `src/lib/incidents.js`, so there was nothing for them to do
  differently.
- `infrastructure/appsync/` — the exact schema SDL and AppSync JS
  resolver code to paste into AWS Console (see below). Not deployed by
  this repo — there is no infrastructure-as-code wired up for this
  AppSync API.
- `scripts/migrate-incidents-to-organizations.mjs` — dry-run-by-default,
  idempotent migration script. **Not executed** — it writes to the real
  DynamoDB table, so it's handed over for you to run deliberately (see
  [Migration](#migration) below).
- `src/graphql/mutations/createOrganization.js`,
  `src/lib/organization.js` (`createOrganization(name)`) — lets an
  authenticated user with no organization create one. The client only
  ever sends `name`; `id`, the creator's `OWNER` membership, and the
  GSI2 attributes are all generated server-side (see
  [Organization Creation](#organization-creation) below).
- `src/app/(app)/layout.js` — the **no-organization** state is now a
  real form (name input, Create button, loading/validation/GraphQL
  error states) instead of a dead end. On success it updates the header
  immediately and redirects to `/incidents`.

### Tenant isolation design

- **Membership, not a client-supplied id, decides access.** Every
  resolver runs a shared pipeline step
  (`resolveCallerOrganization.function.js`) that looks up the caller's
  `OrganizationMembership` via `ctx.identity.sub` (the Cognito user's
  stable identifier — never email, never anything from the request
  payload).
- **Cross-tenant reads fail by construction.** `incident(id)` always
  does `GetItem({pk: ORG#<callerOrg>, sk: INCIDENT#<id>})`. An incident
  in a different organization simply isn't at that key — DynamoDB
  returns nothing, and the caller gets the same "not found" as a
  nonexistent id. This is deliberate: it never confirms or denies that
  an id exists in someone else's organization.
- **No membership → no data, clearly.** `myOrganization` returns `null`
  (not an error) so the UI can show a specific message.
  `incidents`/`incident`/`createIncident` raise a specific
  `NoOrganizationMembership` error rather than silently returning empty
  results.
- Roles (`OWNER`/`ADMIN`/`MEMBER`) are stored on the membership record
  and returned by `myOrganization`, but nothing currently branches on
  role — no RBAC beyond membership-implies-access is implemented yet,
  per the original design ("do not implement complex RBAC yet unless
  required").

### AWS Console steps required

**Nothing above is live yet.** These are the exact manual steps —
none of them can be performed from this repository.

1. **DynamoDB → add GSI2** (RiskLens table → Indexes → Create index)
   - Partition key: `GSI2PK` (String)
   - Sort key: `GSI2SK` (String)
   - Projection: All attributes (simplest; the membership item is small)
   - **Why:** membership items are keyed `pk=ORG#<orgId>/sk=USER#<sub>`,
     which only supports "list members of an org I already know." There
     is no way to answer "which org is this Cognito user in" without
     either this reverse index or a second table (which is explicitly
     out of scope) — GSI2 is genuinely required, not optional.
   - **Verify:** after creating it, `aws dynamodb describe-table
     --table-name RiskLens` (or the Console's Indexes tab) shows `GSI2`
     as `ACTIVE`.

2. **AppSync → Schema → add types + field.** Open
   `infrastructure/appsync/schema-organizations.graphql` in this repo
   and paste its contents in: add `Organization`, `OrganizationMembership`,
   and `MyOrganizationMembership` as new top-level types, and add
   `myOrganization: MyOrganizationMembership` as a new field inside your
   *existing* `type Query { ... }` block (don't create a second `Query`
   type). Save.
   - **Why:** these types don't exist yet — confirmed via a live
     introspection query against the current API before writing any of
     this.
   - **Verify:** the schema saves without errors, and a fresh
     introspection query shows `Query.myOrganization` and the three new
     types.

3. **AppSync → Functions → create `resolveCallerOrganization`.** Runtime:
   **APPSYNC_JS**. Data source: the existing DynamoDB data source for
   the RiskLens table. Paste the code from
   `infrastructure/appsync/resolvers/resolveCallerOrganization.function.js`.
   - **Why:** this is the one place the "look up the caller's org from
     their Cognito identity" logic lives, shared as a pipeline step by
     all four operations below — avoids writing the same lookup four
     times.
   - **Verify:** the Function saves with no syntax errors reported by
     the console.

4. **AppSync → Schema → attach/replace resolvers, runtime APPSYNC_JS,
   each as a pipeline resolver with `resolveCallerOrganization` as step 1
   and the file below as step 2:**
   - `Query.myOrganization` (new) → `infrastructure/appsync/resolvers/Query.myOrganization.js`
   - `Query.incidents` (replace existing) → `infrastructure/appsync/resolvers/Query.incidents.js`
   - `Query.incident` (replace existing) → `infrastructure/appsync/resolvers/Query.incident.js`
   - `Mutation.createIncident` (replace existing) → `infrastructure/appsync/resolvers/Mutation.createIncident.js`
   - **Why:** these are the resolvers that actually enforce the tenant
     boundary — without this step, the schema/GSI changes above do
     nothing.
   - **Verify:** run the introspection/`curl` checks in
     [Manual verification](#manual-verification-still-required) below —
     don't just trust that the console accepted the paste.

5. **AppSync → Schema → add `createOrganization`.** Paste the
   `CreateOrganizationInput` input type and the `createOrganization`
   field (added into your existing `type Mutation { ... }` block) from
   the same `infrastructure/appsync/schema-organizations.graphql` file
   used in step 2. Then attach a **new** pipeline resolver on
   `Mutation.createOrganization`, runtime APPSYNC_JS, with:
   - Step 1: the **same** `resolveCallerOrganization` Function from
     step 3 (no new Function needed)
   - Step 2: `infrastructure/appsync/resolvers/Mutation.createOrganization.js`
   - **Why:** reusing `resolveCallerOrganization` here isn't just
     convenience — it's what lets step 2 detect "this caller already has
     an organization" and refuse to create a second one (this project is
     one-organization-per-user for now).
   - **Verify:** see [Organization Creation](#organization-creation)
     below for the full checklist.

**Not required:** a second DynamoDB table, a second Cognito User Pool,
API Gateway, or any change to Cognito itself (identity/authentication is
unchanged — only application-level authorization is new).

### Organization Creation

`createOrganization(input: CreateOrganizationInput!): Organization!` —
`CreateOrganizationInput` has exactly one field, `name`. There is no
way for the client to submit `organizationId`, `userId`, `role`, or the
GSI2 attributes — the schema simply has no fields for them, so this
isn't just a resolver-side check, it's structurally impossible.

**Flow:**
1. `resolveCallerOrganization` (pipeline step 1) looks up an existing
   membership. If one exists, step 2 refuses with
   `AlreadyHasOrganization` — this keeps the current one-org-per-user
   design intact (see below) rather than silently creating an orphaned
   second organization.
2. The resolver validates `name` (non-empty, ≤100 chars after
   trimming), generates `organizationId` as `org-<8 random hex chars>`
   (server-side — the client never generates or supplies it), and
   determines the creator from `ctx.identity.sub`.
3. It writes the `Organization` item and the creator's `OWNER`
   `OrganizationMembership` item (with `GSI2PK`/`GSI2SK` already set)
   using a single DynamoDB **`TransactWriteItems`** call — both items
   are written together or neither is. This is genuinely atomic (that's
   what `TransactWriteItems` guarantees), not an approximation of it.
4. Returns the new `Organization`.

**Because a user's Cognito identity (`sub`) doesn't change across
sessions, and membership is a persistent DynamoDB record**, a user who
creates an organization will resolve back to that same organization on
every future login automatically — `myOrganization`'s GSI2 lookup finds
the same membership row every time. No extra "remember my org" logic
was needed for this.

**One organization per user (for now):** `resolveCallerOrganization`'s
GSI2 query already takes only the first result (`limit: 1`). Multi-org
membership and org switching are explicitly **not** built — per
direction, this keeps Phase 2.2 focused. The data model doesn't block
adding it later: `OrganizationMembership` is already a many-to-many
join row (one Cognito user could have multiple `pk=ORG#.../sk=USER#<sub>`
rows across different orgs), so a future "switch organization" feature
would mean changing `myOrganization` to accept an org id and list all
of a user's memberships, rather than reshaping the stored data.

**Verification checklist (do this after completing step 5 above):**
1. In AppSync Console, use the query editor (or "Run a Query" test
   tool) to call `createOrganization(input: { name: "Test Org" })` as
   an authenticated Cognito user with no existing membership. It should
   return an `Organization` with a generated `id` like `org-xxxxxxxx`.
2. Call it again as the **same** user — it should fail with
   `AlreadyHasOrganization`, not create a second organization.
3. In DynamoDB Console, check the RiskLens table for
   `pk=ORG#<the-new-id>, sk=METADATA` — confirm `name`, `createdAt`,
   `updatedAt` are present.
4. Check for `pk=ORG#<the-new-id>, sk=USER#<your-sub>` — confirm
   `role=OWNER`, `organizationId` matches, and `GSI2PK=USER#<your-sub>`
   / `GSI2SK=ORG#<the-new-id>` are both present.
5. Query GSI2 directly (DynamoDB Console → Indexes → GSI2 → Query,
   `GSI2PK = USER#<your-sub>`) and confirm it returns that membership
   item.
6. Call `myOrganization` as that user — confirm it returns the same
   `id`, `name`, and `role: "OWNER"`.
7. In the app: sign in as a user with no org → confirm the create-org
   form appears → submit a name → confirm redirect to `/incidents` and
   the header shows the new organization's name → sign out, sign back
   in → confirm the same organization loads again (no re-prompt).

None of this has been run yet — it requires the AWS Console changes
above first, and I have no way to create a real Cognito-authenticated
GraphQL request myself (no test user credentials, no IAM permission to
mint one).

### Migration

Existing Incident records are in the OLD shape
(`pk=INCIDENT#<id>/sk=METADATA`) and will keep working as read/write
targets for the OLD resolvers right up until step 4 above is applied —
after that, the new resolvers only look under `ORG#<orgId>` partitions,
so old-shape items become invisible to the app until migrated.

Run `scripts/migrate-incidents-to-organizations.mjs` (see the header
comment in that file for exact commands). It is a **dry run by default**
— it prints its plan and writes nothing until you pass `--execute`, and
even then it never deletes the old items unless you also pass
`--delete-old`. It is idempotent — safe to run repeatedly, since every
write is conditioned on the target not already existing.

Recommended order:
1. Run without `--execute` first and read the plan output.
2. Run with `--execute` (no `--delete-old`) — this copies the
   Organization, Membership, and Incident items forward, leaving the old
   Incident items in place as a safety net.
3. Manually verify in the app (or via `curl`) that the new items look
   right.
4. Only then, run with `--execute --delete-old` to remove the old-shape
   Incident items and eliminate the duplicate source of truth.

This was **not run** as part of this implementation — it writes to your
real DynamoDB table and needs your Cognito test user's `sub` value,
which isn't something to fabricate or read without your involvement.

### Manual verification still required

Once you've completed the AWS Console steps and the migration, verify:

1. Sign in → the header shows your organization's name (not blank, not
   an error).
2. `/incidents` shows only that organization's incidents.
3. Load More pagination still works.
4. `/incidents/new` creates an incident, and it appears in the list
   without an editable organization field anywhere in the form.
5. `/incidents/[id]` opens an incident you just created.
6. A user with no membership row sees the create-organization form, not
   a raw error or an empty incident list — see
   [Organization Creation](#organization-creation) for its own, more
   detailed checklist.
7. Sign out still works, and protected routes require login again.

None of this has been verified end-to-end yet — the resolver/schema
changes require the manual AWS Console steps above first.

---

## Local Development

Commands below are taken directly from `package.json` — no other scripts
exist.

```bash
npm install
npm run dev      # start the Next.js dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # ESLint
```

There is currently no `npm test` script — no test framework is
configured, and none is planned for this project at this time.

---

## Environment Variables

The application currently reads these environment variables (verified in
`src/graphql/client/appsync.js`, `src/lib/amplify.js`):

```env
NEXT_PUBLIC_APPSYNC_URL=your-appsync-endpoint
NEXT_PUBLIC_APPSYNC_API_KEY=your-appsync-api-key

NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REGION=your-region
```

- Values above are **placeholders only** — never commit real values.
- `.gitignore` ignores `.env*`, which covers `.env`, `.env.local`, and
  `.env.*.local`.
- Missing any of the Cognito variables produces a clear thrown error
  from `configureAmplify()`; a missing `NEXT_PUBLIC_APPSYNC_URL`
  produces a clear error from `executeGraphQL()` — neither fails with a
  confusing raw `fetch`/SDK error.
- `NEXT_PUBLIC_APPSYNC_API_KEY` is **no longer read by any application
  code** (confirmed — nothing in `src/` references `x-api-key` or this
  variable anymore), and the frontend no longer depends on it for
  authenticated Incident functionality now that Cognito authorization is
  enforced on AppSync. It's still present in `.env` — this is a
  documentation-only note, not a change made here — and is safe to
  retire from `.env` and any external tooling (`curl`/Postman scripts)
  that still uses it, at your convenience.
- **Never create `NEXT_PUBLIC_COGNITO_CLIENT_SECRET`** — the app client
  is a public browser client with no secret, and Amplify's browser SDK
  doesn't use one. No AWS IAM access key/secret/session-token variables
  are used by the app — the frontend never talks to AWS SDKs or
  DynamoDB directly.
- There is no `.env.example` file in the repo yet; consider adding one
  for onboarding (documentation-only suggestion, not created here).

---

## Project Structure

### Current (verified)

```text
risklens/
├── src/
│   ├── app/
│   │   ├── (app)/                       # route group — no effect on URLs
│   │   │   ├── layout.js                # client-side auth guard + sign-out header
│   │   │   ├── dashboard/page.js        # static stat cards (not yet migrated)
│   │   │   └── incidents/
│   │   │       ├── page.js              # list — wired to getIncidents(), pagination
│   │   │       ├── new/page.js          # create form — wired to createIncident()
│   │   │       └── [id]/page.js         # detail — wired to getIncident(id)
│   │   ├── login/page.js                # sign-in form, uses src/lib/auth.js
│   │   ├── layout.js                    # root layout — mounts AmplifyProvider
│   │   ├── page.js                      # redirects to /dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── AmplifyProvider.js           # configures Amplify once, app-wide
│   │   ├── incidents/                   # empty
│   │   ├── layout/                      # empty
│   │   └── ui/                          # empty
│   ├── config/                          # empty
│   ├── graphql/
│   │   ├── client/appsync.js            # executeGraphQL() — Cognito auth + error handling
│   │   ├── queries/incidents.js         # GET_INCIDENTS
│   │   ├── queries/incident.js          # GET_INCIDENT
│   │   ├── queries/organization.js      # GET_MY_ORGANIZATION (Phase 2.2)
│   │   ├── mutations/createIncident.js  # CREATE_INCIDENT
│   │   └── mutations/createOrganization.js  # CREATE_ORGANIZATION (Phase 2.2)
│   └── lib/
│       ├── amplify.js                   # configureAmplify()
│       ├── auth.js                      # login/logout/getAuthenticatedUser/getAuthSession
│       ├── incidents.js                 # service layer: getIncidents/getIncident/createIncident
│       ├── organization.js              # service layer: getMyOrganization/createOrganization (Phase 2.2)
│       └── utils/                       # empty
├── infrastructure/appsync/              # Phase 2.2 — reference only, not deployed by this repo
│   ├── schema-organizations.graphql     # SDL to paste into AppSync Console
│   └── resolvers/                       # AppSync JS resolver code to paste into AppSync Console
├── scripts/
│   └── migrate-incidents-to-organizations.mjs  # Phase 2.2 migration — not run automatically
├── public/
├── .env                                 # local only, gitignored
├── .gitignore
├── AGENTS.md                            # auto-generated by `next dev`, plus project notes
├── CLAUDE.md
├── README.md
├── package.json
└── package-lock.json
```

### Target (introduce gradually, do not create ahead of need)

```text
risklens/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── incidents/{new,[id]}/
│   │   ├── login/                       # once Cognito is added
│   │   └── api/                         # only if a specific integration requires it
│   ├── components/{layout,incidents,dashboard,ai,ui}/
│   ├── graphql/{queries,mutations,fragments,client}/
│   ├── lib/{auth,utils,validation}/
│   ├── services/{incidents,ai,users}/
│   ├── config/
│   └── types/
├── tests/{unit,integration,e2e}/
├── infrastructure/{appsync,dynamodb,lambda,s3,cognito,iam}/
└── public/
```

`src/graphql/` and the `src/lib/incidents.js` service-layer pattern are
now real, not aspirational — extend them (`src/lib/<entity>.js` per
entity) rather than inventing a different pattern. Each remaining
top-level folder above should only be created when the feature that
needs it is actually being implemented, not preemptively.

---

## Development Roadmap

```text
Phase 1 — Foundation & AppSync/GraphQL Incident Integration — ✅ Complete
Phase 2 — Cognito Authentication — ✅ Complete
Phase 2.2 — Multi-Tenancy + Organization-aware Incident Management — 🔶 Local implementation done, AWS Console + migration pending — ⬅ next up
Phase 2.5 — Incident Update/Delete (once AppSync exposes updateIncident/deleteIncident)
Phase 3 — S3 Attachments
Phase 4 — Bedrock AI Analysis (summarization, risk scoring)
Phase 5 — RAG / Knowledge Base (policies, procedures, historical incidents)
Phase 6 — Similar Incident Detection (embeddings + vector search)
Phase 7 — Dashboard & Analytics (wire /dashboard to real AppSync data)
Phase 8 — Production Hardening (CI/CD, observability, IAM review)
```

(Renumbered from the original 10-phase plan: "AppSync + GraphQL API
layer" and "Incident CRUD" were originally separate Phases 2–3; they
shipped as one unit and are now folded into Phase 1.)

---

## Known Issues (verified in current code)

- **Phase 2.2 (multi-tenancy) is designed and implemented locally, but
  not live.** The AppSync schema/resolvers still run the pre-tenancy
  logic (confirmed via live introspection before this phase started —
  no `Organization`/`OrganizationMembership` types or `myOrganization`
  field exist yet), and no incident data has been migrated. See
  [Multi-Tenancy](#multi-tenancy-phase-22) for the exact AWS Console
  steps and migration required.
- **No update/delete:** the deployed AppSync API only exposes
  `createIncident`, `incident`, and `incidents` — there was never an
  edit/delete UI to migrate, and none has been invented. Planned for
  Phase 2.5 once the corresponding AppSync resolvers exist.
- **Route protection is client-side only**, by design for this
  architecture — see [Authentication](#authentication) for why
  Middleware doesn't fit here yet, and what would need to change for
  server-side enforcement.
- **Dashboard not migrated:** `/dashboard` still renders hardcoded
  stat cards (`0` for every metric) — it was out of scope for the
  Incident-functionality migration and is planned for Phase 7.
- **Empty scaffolding:** `src/components/{incidents,layout,ui}/`,
  `src/config/`, and `src/lib/utils/` exist but contain no files yet.
- **No tests, no CI/CD:** deliberate for this project at this stage —
  no test framework or pipeline is configured, and none is currently
  planned.
- **`.gitignore` entries for `AGENTS.md`/`CLAUDE.md` are now
  effective:** both files were untracked from git (`git rm --cached`)
  during Phase 1, so the existing `.gitignore` rule for them now
  actually applies — they stay local-only going forward.

## Future Risks (not current bugs — considerations for later phases)

- **Server-side route protection:** the current client-side guard is a
  UX affordance, not a security control (see
  [Authentication](#authentication)). True server-enforced protection
  would need Amplify's SSR/cookie adapter
  (`@aws-amplify/adapter-nextjs`) plus Next.js Middleware — a real
  architectural change, not a drop-in addition to the current setup.
- **S3 attachments:** will require careful IAM scoping (pre-signed URLs,
  not direct client credentials) and virus/type validation before
  incidents can carry uploads.
- **Bedrock/RAG:** must not be called directly from the browser; route
  through Lambda/AppSync resolvers to avoid exposing model access or
  prompts to the client. Cost/latency of Bedrock calls should be
  considered before making them synchronous with user-facing requests.
- **OpenSearch:** introduces an additional stateful service to operate,
  secure, and keep in sync with DynamoDB — plan for eventual consistency
  between the two.
- **Multi-tenancy is now designed (Phase 2.2)** — see
  [Multi-Tenancy](#multi-tenancy-phase-22) — but until the AWS Console
  steps and migration are actually applied, this remains a risk, not a
  resolved concern: don't assume `ORG#` scoping is enforced just because
  the resolver code has been written.
- **Update/delete + multi-tenancy interaction:** once `updateIncident`/
  `deleteIncident` exist (Phase 2.5), they'll need the same
  `resolveCallerOrganization` pipeline step as `createIncident` — an
  incident update/delete must be scoped to the caller's org exactly like
  reads are, not just creates.
- **Roles are stored but unused:** `OrganizationMembership.role`
  (OWNER/ADMIN/MEMBER) exists and is returned by `myOrganization`, but
  no resolver currently branches on it — any member can create
  incidents in their org. Real RBAC (e.g. only OWNER/ADMIN can do X) is
  future work, not implemented now.
- **Update/delete concurrency:** once `updateIncident` exists, decide on
  an optimistic-locking or last-write-wins strategy before shipping it —
  not yet designed.

---

## Production Readiness Assessment

| Dimension | Status | Notes |
|---|---|---|
| Architecture | **Needs Work** | Incident read/create flow and Cognito authentication both correctly go through AppSync/GraphQL; Lambda/Bedrock/S3 layers not started |
| Security | **Needs Work** | Cognito login/logout/session work and AppSync enforces Cognito User Pool authorization for the currently-live schema; tenant isolation is designed (Phase 2.2) but not yet deployed; still no MFA, no server-side (cookie/Middleware) route protection, no RBAC |
| Repository structure | **Ready** | `src/graphql/` + `src/lib/{incidents,organization}.js` service-layer pattern is in place and matches the target structure; `infrastructure/appsync/` now holds the AppSync schema/resolver source-of-truth this project previously lacked |
| Environment configuration | **Needs Work** | `.env` correctly gitignored; env vars validated with clear errors; no `.env.example` yet for onboarding; no new env vars needed for Phase 2.2 |
| AWS integration readiness | **Needs Work** | AppSync/DynamoDB/Cognito integration for Incidents and authentication is working end-to-end on the currently-deployed schema; Phase 2.2's schema/resolver/GSI2 changes are written but not deployed; Lambda/Bedrock/S3 not yet integrated |
| Testing readiness | **Future** | No test framework configured — deliberate choice for this project; Phase 2.2 verification is a manual checklist (see Multi-Tenancy) instead |
| Scalability | **Needs Work** | Phase 2.2's tenant-scoped `incidents()` query (direct `ORG#<id>` partition query) fixes the old single shared `GSI1` "INCIDENTS" bucket pattern once deployed — not yet live |
| Maintainability | **Ready** | Clean UI → service layer → GraphQL client → AppSync separation; no GraphQL queries embedded in UI components |
| Documentation | **Ready** | README/CLAUDE.md/AGENTS.md reflect verified current vs. planned vs. future state as of Phase 1 completion |

This is Phase 1 and Phase 2 (both complete) of an evolving system, not a
production-ready system. Treat every "Planned"/"Future" item above as
not built until it is verified in code again.
