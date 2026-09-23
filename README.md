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
Status: In progress — organization schema (myOrganization,
        createOrganization) and organization logo storage (S3 +
        Cognito Identity Pool) are configured in AWS; updateOrganization
        is not in the deployed schema yet, and incident data migration
        is still pending (see Multi-Tenancy below)

Signup & Email Verification
Status: Implemented locally — Cognito signup/verification is a separate
        flow from organization creation and does not require any
        AppSync/DynamoDB change; depends on Cognito Console settings
        (self-registration, email verification) being enabled — see
        Signup & Email Verification below
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

## Authenticated Application Flow

```text
Cognito Identity (signup / email verification / login)
        ↓
Application Authentication (src/lib/auth.js, src/app/(app)/layout.js session check)
        ↓
Organization Resolution (getMyOrganization(), src/app/(app)/layout.js)
    ├── organization exists  → Dashboard (/dashboard)
    └── organization is null → mandatory Organization Onboarding (no skip)
                                        ↓
                                createOrganization()
                                        ↓
                                getMyOrganization() re-fetched (source of truth,
                                not the mutation's own return value)
                                        ↓
                                    Dashboard
        ↓
Application Modules (currently: Incident Management, via Dashboard navigation)
```

**`/dashboard` is the authenticated application's entry point, not
`/incidents`.** Both `/login` and `/signup` redirect to `/dashboard`
after a successful sign-in (`src/app/login/page.js`,
`src/app/signup/page.js`); `/` (`src/app/page.js`) already redirected to
`/dashboard` before this change and still does. `/incidents`,
`/incidents/new`, and `/incidents/[id]` are unchanged and still fully
functional — they're reached through the shared header's navigation
(`NAV_LINKS` in `src/app/(app)/layout.js`) or Dashboard's "Incident
Management" module card, not by being the post-login landing page. The
header's organization name/logo is also a dropdown
(`OrganizationMenu.js`) with two destinations: **Organization**
(`/organization` — editable organization details, see
[Organization Details](#organization-details-editing)) and **My
Account** (`/account` — a static placeholder for now).

**One shared gate, not four separate checks.** `src/app/(app)/layout.js`
wraps every route under `(app)/` (`/dashboard`, `/incidents`,
`/incidents/new`, `/incidents/[id]`) and runs the session check +
`getMyOrganization()` call exactly once per mount, before rendering
whichever page was requested. This means the mandatory-onboarding rule
is enforced structurally — there is no route-specific bypass to
accidentally miss — rather than requiring the same check to be
duplicated on every page.

**`myOrganization`'s error is not "no organization."** The layout has
three distinct states after the session check: `no-organization` (a
*successful* `getMyOrganization()` call that returned `null` —
onboarding, mandatory), `organization-error` (the call *threw* —
network/GraphQL/auth failure — shows a message with a **Retry** button,
never onboarding), and `authenticated` (a membership was returned).
Collapsing the error case into "no organization" would incorrectly send
a user with an existing organization into the onboarding form during a
transient AppSync hiccup — this is deliberately guarded against.

**`OrganizationProvider`/`useOrganization()`**
(`src/components/organization/OrganizationContext.js`) makes the
current organization (`id`, `name`, `email`, `address`, `street`,
`state`, `country`, `logoKey`, plus the caller's `role`) and a
`refresh()` function available to `/dashboard` and any future module,
without re-querying `getMyOrganization()` from every page. It's the
**only** organization context in the app — reuse it rather than adding
a second one. It's deliberately shaped around a single "current
organization" today (matching the server's one-organization-per-user
enforcement — see `CLAUDE.md` → Multi-Tenancy Rules) but doesn't hard-code
that assumption into its shape, so a future organization switcher could
extend the same context (e.g. add `organizations`/`switchOrganization`)
without changing how `organization`/`role`/`refresh` are consumed by
existing code.

---

## Signup & Email Verification

```text
Status: Implemented locally (application code only). Depends on Cognito
        User Pool self-registration + email verification being enabled
        in the Console — not something this repo can turn on for you.
```

**Signup and organization creation are two separate, sequential flows —
this is deliberate, not an oversight.** Cognito signup only ever creates
a Cognito user; it never touches DynamoDB, AppSync, or the Organization
model.

```text
Cognito User (new)
    ↓ signUp()
Email verification code sent by Cognito
    ↓ confirmSignUp()
Cognito user CONFIRMED
    ↓ sign in (login())
Authenticated Cognito session
    ↓ (existing, unchanged) (app)/layout.js -> getMyOrganization()
myOrganization === null
    ↓ (existing, unchanged) create-organization onboarding
createOrganization({ name })
```

### What's implemented

- **`src/lib/auth.js`** — three new functions, following the same
  pattern as the existing `login`/`logout`/`getAuthSession`
  (`aws-amplify/auth` is only ever imported here, never from a page):
  - `signUp(email, password)` — creates the Cognito user
    (`username: email`, `options.userAttributes.email`). Does **not**
    create an Organization or Membership, and does not accept an
    `organizationId` parameter — there's nowhere to pass one.
  - `confirmSignUp(email, confirmationCode)` — confirms the account with
    the code Cognito emailed the user.
  - `resendSignUpCode(email)` — re-sends the verification code.
  - All three catch Cognito's raw errors, log them, and re-throw a
    friendlier message (mapped from `error.name` — e.g.
    `UsernameExistsException`, `InvalidPasswordException`,
    `CodeMismatchException`, `ExpiredCodeException`,
    `LimitExceededException`) without exposing internal Cognito details
    beyond what the message already needs to say.
- **`src/app/signup/page.js`** (new route, no auth required) — a small
  state machine with three states:
  1. **`signup`** — email / password / confirm-password form, validated
     client-side (required fields, email format, password match) before
     calling `signUp()`. Cognito's own password policy is not
     re-implemented here — Cognito rejects a weak password and the
     mapped error message is shown.
  2. **`verify`** — shown after `signUp()` succeeds with
     `nextStep.signUpStep === "CONFIRM_SIGN_UP"`. Has the code input,
     "Verify Email", "Resend Code", and "Back to sign up" actions, each
     with its own loading state.
  3. **`verified`** — shown only if automatic sign-in after confirmation
     doesn't complete (see below); a simple "Sign in" button to
     `/login`.
  - **Neither `createOrganization` nor `myOrganization` is called
    anywhere in this file** — confirmed by grep, not just by writing it
    that way.
- **`src/app/login/page.js`** — added a "Don't have an account? Sign
  up" link to `/signup`. `handleSubmit`, `login()`, the existing-session
  redirect, and all existing error/loading handling are unchanged.

### Post-confirmation sign-in

After `confirmSignUp()` succeeds, the signup page immediately calls the
**existing** `login(email, password)` (the same function `/login` uses)
with the credentials already entered on the signup form:

- If it returns `isSignedIn: true`, the user is redirected to
  `/dashboard` (the authenticated app's entry point — see
  [Authenticated Application Flow](#authenticated-application-flow)),
  where `src/app/(app)/layout.js` calls `getMyOrganization()` and —
  since a brand-new user has no membership — shows the existing
  create-organization onboarding instead of the Dashboard. No
  organization-detection logic was duplicated in the signup page; it
  relies entirely on the layout that already does this for `/login`.
- If sign-in doesn't complete for any reason (Cognito can require this
  depending on User Pool policy — e.g. MFA), the page falls back to the
  `verified` state and points the user at `/login` instead of retrying
  silently or swallowing the error.

### AWS Console steps required

Signup does not need any AppSync, DynamoDB, or GraphQL schema change —
it's pure Cognito, using the same User Pool and the same public app
client that login already uses. What needs to be verified/enabled in
the Console (I cannot check or change these — the local IAM user is
denied `cognito-idp:DescribeUserPoolClient` — so this is a checklist,
not a confirmed-done change):

1. **Cognito → User pools → your pool → "Sign-up experience"** — confirm
   **self-registration is enabled**. If it's off, `signUp()` fails
   (typically `NotAuthorizedException` or a message referencing
   self-service sign-up being disabled) — turn it on.
2. **Same tab → "Cognito-assisted verification and confirmation"** —
   confirm email is set up to auto-send a verification code on signup
   (this app calls no Lambda trigger and sends no email itself; it
   relies entirely on Cognito's built-in verification email). No SES
   configuration was added or changed by this work.
3. **App client settings** — confirm the same public app client already
   used for login has the auth flow `login()` depends on enabled
   (unchanged by this work; only relevant if signup surfaces an
   auth-flow error that login doesn't).
4. No new environment variables are required — signup uses the same
   `NEXT_PUBLIC_COGNITO_USER_POOL_ID` / `NEXT_PUBLIC_COGNITO_CLIENT_ID` /
   `NEXT_PUBLIC_COGNITO_REGION` already configured for login.

### Manual test checklist (not run by me — no test Cognito credentials)

1. `/login` shows a "Sign up" link; `/signup` loads without
   authentication.
2. Sign up with a new email + matching passwords → lands on the
   "Check your email" verification state.
3. Enter a wrong code → friendly "incorrect code" error, not a raw
   Cognito exception.
4. Click "Resend Code" → confirmation message shown, a new code
   arrives.
5. Enter the correct code → either lands directly on `/dashboard` with
   the create-organization form (first-time user), or shows "Email
   verified — Sign in" if automatic sign-in didn't complete.
6. Sign up again with the same email → "account already exists" error
   at the form step, not after submitting to Cognito twice.
7. Confirm in DynamoDB Console that **no** `Organization` or
   `OrganizationMembership` item was written by signup alone — only
   `createOrganization` (a separate, later user action) writes those.
8. Existing `/login` flow (email/password → `/dashboard`) still works
   unchanged for a pre-existing confirmed user.

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
                      (name, email, address, street, state, country,
                       logoKey — logoKey is an S3 object key reference
                       only, never image bytes/base64)
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

> **Correction found while implementing Organization Onboarding:**
> `infrastructure/appsync/` and `scripts/` existed as empty directories
> on disk — the schema SDL, `resolveCallerOrganization.function.js`,
> and `Mutation.createOrganization.js` this document referenced from
> earlier work were never actually saved, despite being described as
> done. They have been (re)created as part of this pass with the
> Organization Onboarding fields included from the start. **The
> incident-tenancy resolvers this document still references
> (`Query.myOrganization.js`, `Query.incidents.js`, `Query.incident.js`,
> `Mutation.createIncident.js`) and the migration script
> (`scripts/migrate-incidents-to-organizations.mjs`) are still missing
> and were out of scope for this task** — see
> [Known Issues](#known-issues-verified-in-current-code). Don't assume
> they exist just because earlier sections of this README describe
> them.

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
  `{ organization: { id, name, email, address, street, state, country,
  logoKey, createdAt, updatedAt }, role }` or `null` if the caller has
  no organization membership. Follows the same service-layer pattern as
  `src/lib/incidents.js` — no GraphQL strings or AWS details above this
  layer.
- `src/app/(app)/layout.js` — after confirming a Cognito session, loads
  the caller's organization and shows its name + logo in the header.
  Has three states beyond the normal authenticated view:
  **no-organization** (mandatory onboarding — see
  [Organization Onboarding](#organization-onboarding) below, no skip
  option), **organization-error** (network/GraphQL failure loading the
  org, distinct from a session failure), and the normal authenticated
  header once a membership exists.
- `/incidents`, `/incidents/new`, `/incidents/[id]` — **unchanged**.
  Tenant scoping happens entirely in the resolver; these pages already
  only call `src/lib/incidents.js`, so there was nothing for them to do
  differently.
- `infrastructure/appsync/schema-organizations.graphql`,
  `infrastructure/appsync/resolvers/resolveCallerOrganization.function.js`,
  `infrastructure/appsync/resolvers/Mutation.createOrganization.js` —
  the schema SDL and AppSync JS resolver code to paste into AWS
  Console (see below). Not deployed by this repo — there is no
  infrastructure-as-code wired up for this AppSync API.
- `scripts/migrate-incidents-to-organizations.mjs` — **referenced by
  this document but not present in the repo right now** — see the
  correction note above. Do not assume it exists; it needs to be
  (re)written before the DynamoDB migration in
  [Migration](#migration) can run.
- `src/graphql/mutations/createOrganization.js`, `src/lib/storage.js`,
  `src/components/organization/OrganizationOnboardingForm.js`,
  `src/components/organization/OrganizationLogo.js` — the full
  Organization Onboarding flow: a form collecting name, email, address,
  street, state, country (required) and a logo (optional, uploaded
  straight to S3 — never sent through GraphQL). The client only ever
  sends those business fields plus an S3 key reference; `id`, the
  creator's `OWNER` membership, and the GSI2 attributes are all
  generated server-side (see
  [Organization Onboarding](#organization-onboarding) below).
- `src/lib/amplify.js` — optionally configures Amplify `Storage` +
  `Auth.Cognito.identityPoolId` when the corresponding env vars are
  present, without touching the required Cognito User Pool config —
  login and AppSync keep working even if S3/Identity Pool haven't been
  set up yet.

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

**Current state (2026-09-23):** the deployed AppSync schema now has
`Organization`, `OrganizationMembership`, `MyOrganizationMembership`,
`CreateOrganizationInput`, `Query.myOrganization`, and
`Mutation.createOrganization` (and `Incident` now includes
`organizationId: ID!`), and step 6 (S3 + Identity Pool for logos) is
configured. `UpdateOrganizationInput`/`Mutation.updateOrganization` are
**not** in the deployed schema yet — saving on `/organization` will
fail until they're added (see
[Organization Details](#organization-details-editing)). These are the
manual steps — none of them can be performed from this repository.

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
   - **These four files do not currently exist in this repo** (see the
     correction note at the top of this section) — they need to be
     (re)written before this step can be completed. Only
     `resolveCallerOrganization.function.js` and
     `Mutation.createOrganization.js` (step 5) exist right now.
   - **Why:** these are the resolvers that actually enforce the tenant
     boundary — without this step, the schema/GSI changes above do
     nothing.
   - **Verify:** run the introspection/`curl` checks in
     [Manual verification](#manual-verification-still-required) below —
     don't just trust that the console accepted the paste.

5. **AppSync → Schema → add `createOrganization`.** Paste the
   `CreateOrganizationInput` input type, the extended `Organization`
   type, and the `createOrganization` field (added into your existing
   `type Mutation { ... }` block) from
   `infrastructure/appsync/schema-organizations.graphql`. Then attach a
   pipeline resolver on `Mutation.createOrganization`, runtime
   APPSYNC_JS, with:
   - Step 1: the **same** `resolveCallerOrganization` Function from
     step 3 (no new Function needed)
   - Step 2: `infrastructure/appsync/resolvers/Mutation.createOrganization.js`
   - **Why:** reusing `resolveCallerOrganization` here isn't just
     convenience — it's what lets step 2 detect "this caller already has
     an organization" and refuse to create a second one (this project is
     one-organization-per-user for now).
   - **Verify:** see [Organization Onboarding](#organization-onboarding)
     below for the full checklist.

6. **S3 + Cognito Identity Pool for logo uploads** — ✅ **configured**
   (2026-09-23). The Identity Pool's authenticated role is
   **`RiskLens_Auth_Role`**, and the bucket name/region are set in
   `.env` (see [Environment Variables](#environment-variables)). The
   steps below are kept as the record of what that setup must contain —
   see [Organization Onboarding](#organization-onboarding) for the full
   design/rationale:
   1. Create a **private** S3 bucket (block all public access —
      no public-read, no public-write). Note its name and region.
   2. Create a **Cognito Identity Pool**, with your existing Cognito
      User Pool + app client added as an authentication provider.
      Enable **"Attributes for access control"** (ABAC) on the Identity
      Pool with a **custom mapping**: map the `sub` claim to principal
      tag `sub`. This is what lets the S3 IAM policy and the AppSync
      resolver agree on the same identifier — see
      [Organization Onboarding](#organization-onboarding) for why this
      matters.
   3. On the Identity Pool's **authenticated** IAM role
      (`RiskLens_Auth_Role`), attach a policy scoped to the caller's own
      tag-derived prefix only:
      ```json
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::<BUCKET_NAME>/temporary/organizations/${aws:PrincipalTag/sub}/*"
          }
        ]
      }
      ```
   4. Set `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID`,
      `NEXT_PUBLIC_S3_BUCKET_NAME`, and `NEXT_PUBLIC_S3_REGION` in
      `.env` (done — all three are present) — see
      [Environment Variables](#environment-variables).
   - **Why an Identity Pool at all, when AppSync itself authorizes via
     the User Pool directly?** S3 has no equivalent of "Cognito User
     Pool authorization" the way AppSync does — browser-to-S3 uploads
     need real (temporary) AWS credentials, which only an Identity Pool
     can mint from a Cognito User Pool session. No static AWS keys are
     ever placed in the browser; Amplify Storage requests short-lived
     STS credentials scoped by the IAM policy above.
   - **Verify:** see the manual test checklist in
     [Organization Onboarding](#organization-onboarding).

**Not required:** a second DynamoDB table, a second Cognito User Pool,
API Gateway, or a Lambda function (see the note in
[Organization Onboarding](#organization-onboarding) about why the logo
key is never renamed/moved).

### Organization Onboarding

`createOrganization(input: CreateOrganizationInput!): Organization!` —
`CreateOrganizationInput` has exactly six required business fields
(`name`, `email`, `address`, `street`, `state`, `country`) plus one
optional `logoKey`. There is no way for the client to submit
`organizationId`, `userId`, `role`, `pk`/`sk`, or the GSI2 attributes —
the schema simply has no fields for them, so this isn't just a
resolver-side check, it's structurally impossible.

**Onboarding is mandatory, with no skip option.** `src/app/(app)/layout.js`
shows `src/components/organization/OrganizationOnboardingForm.js`
instead of Dashboard/Incidents whenever `myOrganization()` returns
`null` — there is no way to dismiss it or reach `/dashboard`,
`/incidents`, or any other authenticated route without completing it,
since the check happens once in the shared layout, not per-page. See
[Authenticated Application Flow](#authenticated-application-flow) for
the full picture and [How persistence works](#how-persistence-across-loginlogout-works)
below for why existing members skip straight past it every time.

#### Logo storage: why S3, and why not a straightforward "upload then move"

The logo is a real image file, so it cannot go through GraphQL as
base64/binary (bloats the DynamoDB item, no size limit enforcement,
and defeats the point of object storage) and cannot be written to
DynamoDB directly. It has to live in S3, referenced from DynamoDB by
key only (`logoKey`) — exactly as this document's DynamoDB section
shows.

The complication: `createOrganization` generates `organizationId`
**server-side**, so at the moment the browser needs to upload a logo,
no organization (and therefore no `organizations/<orgId>/...` key)
exists yet. The chosen design:

1. The browser uploads the logo **before** calling `createOrganization`,
   to a key scoped to the caller's own Cognito identity:
   `temporary/organizations/<cognito-sub>/<random-id>/<filename>`
   (`src/lib/storage.js`'s `uploadOrganizationLogo()`, via Amplify
   Storage — see below for how this is kept secure).
2. `createOrganization` receives that key as `logoKey`, validates it
   **starts with `temporary/organizations/<ctx.identity.sub>/`**
   (`Mutation.createOrganization.js`'s `validatedLogoKey()`) — a
   caller cannot point `logoKey` at another user's upload or an
   arbitrary S3 object — and stores it in the new `Organization` item
   as-is.
3. **The object is not physically renamed/moved to
   `organizations/<orgId>/logo/<filename>`.** Doing that for real
   (S3 `CopyObject` + `DeleteObject`) would need to run in the AppSync
   resolver, which only talks to the DynamoDB data source here — a
   real move would require a Lambda function, which this project
   doesn't have yet (Lambda is still "Planned", not built — see
   [Technology Stack](#technology-stack)). Building one was out of
   scope for this task ("don't make unrelated changes"). The `temporary/`
   prefix in the key is therefore misleading in the literal sense — the
   object stays there permanently once an Organization references it.
   This is a **documented, deliberate simplification**, not an
   oversight; if/when Lambda is introduced, moving the object to a
   cleaner `organizations/<orgId>/logo/<filename>` key (and updating
   `logoKey`) becomes straightforward.

**How the upload is kept secure (no backend server, no exposed
credentials):** the browser gets short-lived AWS credentials from a
**Cognito Identity Pool** (federated from the same Cognito User Pool
session already used for login) via Amplify Storage — never static
AWS access keys. The Identity Pool is configured with **ABAC
(Attributes for access control)** mapping the User Pool's `sub` claim
to a principal tag, so the S3 IAM policy can scope
`PutObject`/`GetObject`/`DeleteObject` to
`temporary/organizations/${aws:PrincipalTag/sub}/*` — the **same**
`sub` value AppSync's resolver reads from `ctx.identity.sub`. That's
deliberate: it means the S3-side access boundary and the
`Mutation.createOrganization.js` validation boundary are enforced
against the exact same identifier, not two identity systems that
merely happen to look similar. See AWS Console step 6 above for the
exact IAM policy and Identity Pool configuration this assumes — **it is
configured** (bucket, Identity Pool, and `RiskLens_Auth_Role`), so logo
upload is live. If those env vars are ever removed, `src/lib/storage.js`
falls back to a clear "not configured yet" error and the rest of
onboarding (all the required text fields) still works without a logo.

**Upload path (as configured):**

```text
OrganizationOnboardingForm / OrganizationDetailsForm
        ↓
uploadOrganizationLogo()          (src/lib/storage.js)
        ↓
Amplify Storage                   (aws-amplify/storage — uploadData)
        ↓
Cognito Identity Pool             (NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID —
        ↓                          short-lived STS credentials from the
        ↓                          User Pool session)
RiskLens_Auth_Role                (authenticated role — S3 access scoped
        ↓                          to the caller's own prefix)
S3                                (NEXT_PUBLIC_S3_BUCKET_NAME /
        ↓                          NEXT_PUBLIC_S3_REGION, private bucket)
        ↓
temporary/organizations/<cognito-sub>/<uuid>/<filename>
```

The resulting key is then passed as `logoKey` to
`createOrganization`/`updateOrganization` — only the key string goes
through AppSync/DynamoDB, never the image bytes. Displaying a logo goes
the other way: `OrganizationLogo` → `getOrganizationLogoUrl()` →
Amplify Storage `getUrl()` (a short-lived signed URL via the same
Identity Pool credentials).

**Flow:**
1. `resolveCallerOrganization` (pipeline step 1) looks up an existing
   membership. If one exists, step 2 refuses with
   `AlreadyHasOrganization` — this keeps the current one-org-per-user
   design intact (see below) rather than silently creating an orphaned
   second organization.
2. The resolver validates all six required fields (non-empty after
   trimming, length-capped) and the organization email
   (`name@domain.tld` shape), validates `logoKey` as described above if
   present, generates `organizationId` as `org-<8 random hex chars>`
   (server-side), and determines the creator from `ctx.identity.sub`.
3. It writes the `Organization` item (now including `email`, `address`,
   `street`, `state`, `country`, `logoKey`, `entityType`) and the
   creator's `OWNER` `OrganizationMembership` item (with
   `GSI2PK`/`GSI2SK` already set) using a single DynamoDB
   **`TransactWriteItems`** call — both items are written together or
   neither is. This is genuinely atomic (that's what
   `TransactWriteItems` guarantees), not an approximation of it.
4. Returns the new `Organization`.

If the DynamoDB write fails **after** a logo was already uploaded, the
onboarding form (`OrganizationOnboardingForm.js`) calls
`deleteUploadedLogo()` to clean up the now-orphaned S3 object on a
best-effort basis (failures there are logged, not surfaced — losing a
stray temp file isn't worth blocking the user's error message over),
and preserves everything the user typed so they don't have to retype it.

#### How persistence across login/logout works

**Because a user's Cognito identity (`sub`) doesn't change across
sessions, and membership is a persistent DynamoDB record**, a user who
creates an organization will resolve back to that same organization on
every future login automatically — `myOrganization`'s GSI2 lookup finds
the same membership row every time. No extra "remember my org" logic
was needed for this, and the onboarding form never appears again for
that user.

**One organization per user (for now):** `resolveCallerOrganization`'s
GSI2 query already takes only the first result (`limit: 1`). Multi-org
membership and org switching are explicitly **not** built — per
direction, this keeps Phase 2.2 focused. The data model doesn't block
adding it later: `OrganizationMembership` is already a many-to-many
join row (one Cognito user could have multiple `pk=ORG#.../sk=USER#<sub>`
rows across different orgs), so a future "switch organization" feature
would mean changing `myOrganization` to accept an org id and list all
of a user's memberships, rather than reshaping the stored data.

**Verification checklist (do this after completing steps 5–6 above):**
1. In AppSync Console, call `createOrganization(input: { name: "RiskLens
   Test Organization", email: "org@example.com", address: "123 Main
   Road", street: "Main Road", state: "Gujarat", country: "India" })` as
   an authenticated Cognito user with no existing membership (omit
   `logoKey` for this first check). It should return an `Organization`
   with a generated `id` like `org-xxxxxxxx`.
2. Call it again as the **same** user — it should fail with
   `AlreadyHasOrganization`, not create a second organization.
3. In DynamoDB Console, check the RiskLens table for
   `pk=ORG#<the-new-id>, sk=METADATA` — confirm `name`, `email`,
   `address`, `street`, `state`, `country`, `createdAt`, `updatedAt` are
   present and `logoKey` is absent/null.
4. Check for `pk=ORG#<the-new-id>, sk=USER#<your-sub>` — confirm
   `role=OWNER`, `organizationId` matches, and `GSI2PK=USER#<your-sub>`
   / `GSI2SK=ORG#<the-new-id>` are both present.
5. Query GSI2 directly (DynamoDB Console → Indexes → GSI2 → Query,
   `GSI2PK = USER#<your-sub>`) and confirm it returns that membership
   item.
6. Call `myOrganization` as that user — confirm it returns the same
   `id`, all the business fields, and `role: "OWNER"`.
7. Once the S3/Identity Pool steps are done: in the app, sign in as a
   user with no org → confirm the onboarding form appears with no skip
   option → fill in all required fields → select a PNG/JPEG/WebP logo
   → confirm it shows a preview and an "Uploading..."/uploaded state →
   submit → confirm `getMyOrganization()` is called again (not just the
   mutation's return value) → confirm redirect to `/dashboard` and the
   header (and Dashboard itself) show the new organization's name and
   logo → confirm Incidents is reachable from Dashboard's navigation.
8. In S3 Console, confirm the uploaded object exists at
   `temporary/organizations/<your-sub>/<random-id>/<filename>` in the
   configured bucket.
9. Refresh the page, and separately sign out and sign back in — confirm
   the same organization loads again immediately, with no re-prompt.
10. Try uploading a `.pdf` or a 20MB image — confirm both are rejected
    client-side with a clear message before any upload is attempted.

None of this has been run yet — it requires the AWS Console changes
above first, and I have no way to create a real Cognito-authenticated
GraphQL request or AWS credentials myself (no test user credentials, no
IAM permission to mint one).

### Organization Details (editing)

`updateOrganization(input: UpdateOrganizationInput!): Organization!` —
same six required business fields plus optional `logoKey` as
`createOrganization`, but for an **existing** organization. Reachable
from the header: click the chevron next to the organization
name/logo (`src/components/organization/OrganizationMenu.js`) →
"Organization" → `/organization`
(`src/app/(app)/organization/page.js`, form logic in
`src/components/organization/OrganizationDetailsForm.js`, pre-filled
with the current organization's data from `useOrganization()`). The
same dropdown has a "My Account" option → `/account` — currently a
static placeholder page, as requested; no account-management feature
exists yet.

**The organization being updated is always the caller's own — never a
client-supplied id.** `Mutation.updateOrganization.js` uses the same
`resolveCallerOrganization` pipeline Function as every other
organization-scoped resolver: it reads `ctx.stash.organizationId` (set
from the caller's `OrganizationMembership`, looked up via
`ctx.identity.sub`) and updates `pk=ORG#<that-id>/sk=METADATA` —
`UpdateOrganizationInput` has no `organizationId` field for the client
to submit in the first place. If the caller has no membership, the
resolver raises `NoOrganizationMembership` instead of creating or
updating anything.

Unlike `createOrganization` (which needs a real multi-item
`TransactWriteItems`), this is a single-item update, so the resolver
uses the `@aws-appsync/utils/dynamodb` `update()` helper directly
rather than a hand-built request — simpler and just as correct for a
single `UpdateItem` call. Logo replacement reuses the exact same
upload/validation path as onboarding
(`src/lib/storage.js`); the previously-saved logo is only deleted from
S3 **after** a successful save (never before), so a failed save or an
abandoned edit never destroys the organization's live logo.

**No role gating on who can edit organization details yet** — any
member can currently update it (in practice, currently always the
`OWNER`, since there's no invite flow to create `ADMIN`/`MEMBER`
members). This matches the project's existing "don't build role-gated
logic speculatively" rule — see `CLAUDE.md` → Multi-Tenancy Rules. If
member invitations are ever added, revisit this.

**"Create new organization" is intentionally a disabled, no-op
button** on `/organization` — multi-organization support isn't built
(see [Authenticated Application Flow](#authenticated-application-flow)
for `OrganizationContext`'s future-org-switcher-ready design). It's
there so the eventual org switcher has an obvious place to attach to,
without pretending the feature exists today.

**AWS Console step required (in addition to the ones above):** add
`UpdateOrganizationInput` and the `updateOrganization` field from
`infrastructure/appsync/schema-organizations.graphql` to your schema,
then attach a pipeline resolver on `Mutation.updateOrganization`
(runtime APPSYNC_JS): step 1 the same `resolveCallerOrganization`
Function already created, step 2
`infrastructure/appsync/resolvers/Mutation.updateOrganization.js`. Not
deployed or verified live — same caveat as every other AppSync change
in this document.

**Manual test checklist (not run by me):**
1. As a user with an existing organization, open `/organization` —
   confirm the form is pre-filled with the real saved values, not
   blank.
2. Change a field (e.g. name), save — confirm success message, confirm
   the header/Dashboard immediately reflect the new name (via
   `refresh()`, no manual page reload needed).
3. Replace the logo — confirm the old S3 object no longer resolves
   (best-effort delete) and the new one displays everywhere the
   organization's logo appears.
4. Remove the logo entirely and save — confirm `logoKey` becomes
   absent in DynamoDB (`REMOVE`, not stored as an empty string) and the
   header falls back to the initial-letter avatar.
5. Submit invalid data (empty field, malformed email) — confirm a
   clear client-side error, no request sent to AppSync.
6. Confirm the "+ Create new organization" button is disabled and does
   nothing when clicked.
7. Confirm `/account` loads its static placeholder and does not throw.

### Migration

Existing Incident records are in the OLD shape
(`pk=INCIDENT#<id>/sk=METADATA`) and will keep working as read/write
targets for the OLD resolvers right up until step 4 above is applied —
after that, the new resolvers only look under `ORG#<orgId>` partitions,
so old-shape items become invisible to the app until migrated.

Run `scripts/migrate-incidents-to-organizations.mjs` — **this file does
not currently exist in the repo** (see the correction note at the top
of [Multi-Tenancy](#multi-tenancy-phase-22)); the description below is
what it needs to do, not a description of working code. It is a **dry run by default**
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

# Organization logo uploads (Organization Onboarding/Details) — set in
# this project's .env. The app still works without these, just without
# logo upload. See Multi-Tenancy -> AWS Console step 6.
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
NEXT_PUBLIC_S3_BUCKET_NAME=your-s3-bucket-name
NEXT_PUBLIC_S3_REGION=your-s3-bucket-region
```

- Values above are **placeholders only** — never commit real values.
- `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID`, `NEXT_PUBLIC_S3_BUCKET_NAME`,
  and `NEXT_PUBLIC_S3_REGION` are all set in this project's `.env`, so
  logo upload is enabled. `src/lib/amplify.js` only configures Amplify
  `Storage` when all three are present — login/AppSync are completely
  unaffected if they're missing, and `src/lib/storage.js` throws a
  clear, catchable "not configured yet" error if a logo upload is
  attempted without them (the rest of onboarding still works — logo is
  optional).
- `.env` also contains unprefixed duplicates — `COGNITO_IDENTITY_POOL_ID`,
  `S3_BUCKET_NAME`, `S3_REGION` — that **no application code reads**
  (only the `NEXT_PUBLIC_*` versions are used, and only those reach the
  browser). They're harmless but can be removed to avoid confusion
  about which one is authoritative.
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
│   │   │   ├── layout.js                # auth guard + org gate + nav header + OrganizationProvider
│   │   │   ├── dashboard/page.js        # authenticated entry point — org summary + module nav (stats still hardcoded)
│   │   │   ├── account/page.js          # "My Account" — static placeholder, no functionality yet
│   │   │   ├── organization/page.js     # editable Organization Details page
│   │   │   └── incidents/
│   │   │       ├── page.js              # list — wired to getIncidents(), pagination
│   │   │       ├── new/page.js          # create form — wired to createIncident()
│   │   │       └── [id]/page.js         # detail — wired to getIncident(id)
│   │   ├── login/page.js                # sign-in form, uses src/lib/auth.js
│   │   ├── signup/page.js               # signup + email verification, uses src/lib/auth.js
│   │   ├── layout.js                    # root layout — mounts AmplifyProvider
│   │   ├── page.js                      # redirects to /dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── AmplifyProvider.js           # configures Amplify once, app-wide
│   │   ├── organization/
│   │   │   ├── OrganizationOnboardingForm.js  # mandatory onboarding form + logo upload (Phase 2.2)
│   │   │   ├── OrganizationDetailsForm.js     # editable form for an EXISTING organization
│   │   │   ├── OrganizationMenu.js      # header dropdown — My Account / Organization
│   │   │   ├── OrganizationLogo.js      # resolves logoKey -> signed URL, falls back to an initial avatar
│   │   │   └── OrganizationContext.js   # OrganizationProvider/useOrganization() — the only org context
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
│   │   ├── mutations/createOrganization.js  # CREATE_ORGANIZATION (Phase 2.2)
│   │   └── mutations/updateOrganization.js  # UPDATE_ORGANIZATION (Phase 2.2)
│   └── lib/
│       ├── amplify.js                   # configureAmplify() + isStorageConfigured()
│       ├── auth.js                      # login/logout/getAuthenticatedUser/getAuthSession/signUp/confirmSignUp/resendSignUpCode
│       ├── storage.js                   # uploadOrganizationLogo/deleteUploadedLogo/getOrganizationLogoUrl (Phase 2.2)
│       ├── incidents.js                 # service layer: getIncidents/getIncident/createIncident
│       ├── organization.js              # service layer: getMyOrganization/createOrganization/updateOrganization (Phase 2.2)
│       └── utils/                       # empty
├── infrastructure/appsync/              # Phase 2.2 — reference only, not deployed by this repo
│   ├── schema-organizations.graphql     # SDL to paste into AppSync Console
│   └── resolvers/
│       ├── resolveCallerOrganization.function.js  # shared pipeline step 1 — exists
│       ├── Mutation.createOrganization.js         # exists
│       ├── Mutation.updateOrganization.js         # exists
│       └── (Query.myOrganization.js, Query.incidents.js, Query.incident.js,
│            Mutation.createIncident.js — referenced elsewhere in this
│            document but NOT present; see Multi-Tenancy's correction note)
├── scripts/
│   └── migrate-incidents-to-organizations.mjs  # referenced but NOT present — see Multi-Tenancy
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
Phase 2.2 — Multi-Tenancy + Organization-aware Incident Management — 🔶 Organization schema + logo storage (S3/Identity Pool) configured in AWS; updateOrganization + migration pending; incident-tenancy resolvers + migration script still need to be (re)written — ⬅ next up
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
- **Incident-tenancy resolver files and the migration script are
  missing, despite being referenced throughout this document.**
  `infrastructure/appsync/resolvers/Query.myOrganization.js`,
  `Query.incidents.js`, `Query.incident.js`, `Mutation.createIncident.js`,
  and `scripts/migrate-incidents-to-organizations.mjs` do not currently
  exist in the repo (discovered while implementing Organization
  Onboarding — the directories that should hold them were empty). Only
  `resolveCallerOrganization.function.js`,
  `Mutation.createOrganization.js`, and `schema-organizations.graphql`
  exist right now. These missing files need to be (re)written before
  Phase 2.2 can be completed end-to-end — treat every reference to them
  elsewhere in this README as a description of required work, not
  confirmation they exist.
- **No update/delete:** the deployed AppSync API only exposes
  `createIncident`, `incident`, and `incidents` — there was never an
  edit/delete UI to migrate, and none has been invented. Planned for
  Phase 2.5 once the corresponding AppSync resolvers exist.
- **Route protection is client-side only**, by design for this
  architecture — see [Authentication](#authentication) for why
  Middleware doesn't fit here yet, and what would need to change for
  server-side enforcement.
- **Dashboard stats are still hardcoded:** `/dashboard` is now the
  authenticated app's entry point and shows the real organization
  name/logo/role, but its four stat cards still render `0` for every
  metric — wiring them to real `src/lib/incidents.js` data is planned
  for Phase 7, unrelated to it becoming the entry point.
- **Empty scaffolding:** `src/components/{incidents,layout,ui}/`,
  `src/config/`, and `src/lib/utils/` exist but contain no files yet.
- **No tests, no CI/CD:** deliberate for this project at this stage —
  no test framework or pipeline is configured, and none is currently
  planned.
- **Signup depends on unverified Cognito Console settings:** self-
  registration and email-verification-on-signup must be enabled on the
  User Pool for `/signup` to work; this hasn't been confirmed live (the
  local IAM user can't read User Pool config) — see
  [Signup & Email Verification](#signup--email-verification).
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
- **Organization logo objects are never moved out of `temporary/`:**
  see [Organization Onboarding](#organization-onboarding) — this is a
  deliberate simplification (no Lambda available to perform a real S3
  move), not a bug, but it means the `temporary/` prefix is misleading
  once an org exists. If a "move to a clean permanent key" feature is
  ever built, it needs a Lambda function, and `logoKey` would need to
  be updated after the move.
- **Organization logo IAM policy depends on Cognito Identity Pool ABAC
  (principal tags) being configured correctly** — a less common Console
  setting than the simpler `${cognito-identity.amazonaws.com:sub}`
  pattern. If it's misconfigured, uploads will fail with an
  access-denied error from S3 (not a RiskLens-specific error message) —
  double-check the ABAC custom mapping first if logo upload doesn't
  work after the Console steps.
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
| Environment configuration | **Needs Work** | `.env` correctly gitignored; env vars validated with clear errors; no `.env.example` yet; logo-upload vars (`NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID`, `NEXT_PUBLIC_S3_BUCKET_NAME`, `NEXT_PUBLIC_S3_REGION`) are set; unused unprefixed duplicates can be cleaned up |
| AWS integration readiness | **Needs Work** | AppSync/DynamoDB/Cognito integration for Incidents and authentication is working end-to-end on the currently-deployed schema; Phase 2.2's organization schema and S3/Identity Pool logo storage are deployed, `updateOrganization` and the incident migration are not yet; incident-tenancy resolvers + migration script still need to be (re)written; Lambda/Bedrock not yet integrated |
| Testing readiness | **Future** | No test framework configured — deliberate choice for this project; Phase 2.2 verification is a manual checklist (see Multi-Tenancy) instead |
| Scalability | **Needs Work** | Phase 2.2's tenant-scoped `incidents()` query (direct `ORG#<id>` partition query) fixes the old single shared `GSI1` "INCIDENTS" bucket pattern once deployed — not yet live |
| Maintainability | **Ready** | Clean UI → service layer → GraphQL client → AppSync separation; no GraphQL queries embedded in UI components |
| Documentation | **Ready** | README/CLAUDE.md/AGENTS.md reflect verified current vs. planned vs. future state as of Phase 1 completion |

This is Phase 1 and Phase 2 (both complete) of an evolving system, not a
production-ready system. Treat every "Planned"/"Future" item above as
not built until it is verified in code again.
