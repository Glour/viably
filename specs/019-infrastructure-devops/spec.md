# Feature Specification: Infrastructure & DevOps

**Feature Branch**: `019-infrastructure-devops`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Production deployment: domain, hosting, CI/CD, monitoring, backups, environment configuration. All needed for viably.dev to work in production."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Application via Production Domain (Priority: P1)

A user navigates to `viably.dev` in their browser and sees the application (landing page or dashboard). The API is accessible at `api.viably.dev`. All traffic is encrypted via HTTPS. Attempts to access via HTTP or `www.viably.dev` are automatically redirected to the canonical `https://viably.dev` address.

**Why this priority**: Without a working production deployment accessible via the domain, no other infrastructure work matters. This is the foundation for all other stories.

**Independent Test**: Can be fully tested by opening `viably.dev` in a browser and verifying the application loads, then calling `api.viably.dev/health` and verifying a successful response.

**Acceptance Scenarios**:

1. **Given** the infrastructure is deployed, **When** a user navigates to `https://viably.dev`, **Then** the frontend application loads successfully
2. **Given** the infrastructure is deployed, **When** a user navigates to `https://api.viably.dev/health`, **Then** the API responds with a healthy status
3. **Given** a user navigates to `http://viably.dev`, **When** the request is made, **Then** the user is redirected to `https://viably.dev`
4. **Given** a user navigates to `https://www.viably.dev`, **When** the request is made, **Then** the user is redirected to `https://viably.dev`

---

### User Story 2 - Automatic Deployment on Code Push (Priority: P2)

A developer pushes code to the `main` branch. The system automatically runs quality checks (linting, type checks, tests, build). If all checks pass, the application is deployed to production without manual intervention. If checks fail, the deployment is blocked and the developer is notified.

**Why this priority**: Automated deployment eliminates manual error-prone processes and enables rapid, reliable releases. It is the second most critical piece after having a working production environment.

**Independent Test**: Can be tested by pushing a commit to `main` and verifying that the application is updated in production within a reasonable time, and by pushing a failing commit and verifying deployment is blocked.

**Acceptance Scenarios**:

1. **Given** a developer pushes to `main`, **When** all quality checks pass, **Then** the application is automatically deployed to production
2. **Given** a developer pushes to `main`, **When** tests or type checks fail, **Then** the deployment is blocked and the developer sees the failure reason
3. **Given** a developer creates a pull request, **When** the PR is opened, **Then** automated checks run and a preview deployment is created for the frontend
4. **Given** a developer pushes to a feature branch, **When** the push occurs, **Then** only CI checks run (no production deployment)

---

### User Story 3 - Error Monitoring and Alerting (Priority: P3)

When an error occurs in the production application (frontend or backend), it is automatically captured, categorized, and reported. The development team receives notifications for critical errors. Application uptime is continuously monitored, and the team is alerted immediately when the service goes down.

**Why this priority**: Without monitoring, production issues go undetected. This story ensures the team can respond quickly to outages and bugs, maintaining user trust.

**Independent Test**: Can be tested by triggering a known error in production and verifying it appears in the error tracking system, and by simulating downtime and verifying an alert is sent.

**Acceptance Scenarios**:

1. **Given** an unhandled error occurs in the frontend, **When** the error is thrown, **Then** it is captured and reported to the error tracking system with stack trace and user context
2. **Given** an unhandled error occurs in the backend, **When** the error is thrown, **Then** it is captured and reported to the error tracking system with request context
3. **Given** the production service becomes unavailable, **When** the uptime monitor detects downtime, **Then** the team is notified via configured channels within 5 minutes
4. **Given** a critical error rate spike occurs, **When** the threshold is exceeded, **Then** an alert is sent to the development team

---

### User Story 4 - Database Backup and Recovery (Priority: P4)

Production data is automatically backed up on a daily schedule. Backups are retained for at least 7 days. In the event of data loss or corruption, the team can restore the database from a recent backup.

**Why this priority**: Data protection is essential but is less urgent than getting the application live and deployable. Once the system is running in production with real user data, backup reliability becomes critical.

**Independent Test**: Can be tested by verifying that automated backups are created daily, verifying a backup exists from the previous day, and performing a test restore to a non-production environment.

**Acceptance Scenarios**:

1. **Given** the production database is running, **When** 24 hours pass, **Then** an automatic backup is created
2. **Given** backups are being created daily, **When** more than 7 days of backups exist, **Then** backups older than 7 days are automatically removed
3. **Given** a data loss event occurs, **When** the team initiates a restore from backup, **Then** the database is restored to the state from the most recent backup

---

### User Story 5 - Usage Analytics and Funnel Tracking (Priority: P5)

Key user actions are tracked throughout the application: signups, project creation, generation starts and completions, deployments, and credit purchases. The team can view funnels (e.g., Landing -> Signup -> First Project -> Generation -> Deploy) to understand user behavior and identify drop-off points.

**Why this priority**: Analytics provide critical business insights but can be added incrementally after the core infrastructure is stable. The application functions without analytics; they enhance decision-making.

**Independent Test**: Can be tested by performing a sequence of key user actions and verifying that each event appears in the analytics dashboard with correct metadata.

**Acceptance Scenarios**:

1. **Given** a user signs up, **When** the signup completes, **Then** a "signup" event is recorded with timestamp and user identifier
2. **Given** a user creates a project, **When** the project is saved, **Then** a "project_created" event is recorded
3. **Given** the team opens the analytics dashboard, **When** they view the signup-to-deployment funnel, **Then** they see conversion rates at each step with the ability to filter by date range

---

### Edge Cases

- What happens when the deployment target (hosting provider) is temporarily unavailable during a push to `main`? The CI/CD pipeline should retry the deployment or notify the team of the failure without leaving the system in a partially deployed state.
- What happens when the database backup fails? The team should be alerted within 1 hour of a missed backup.
- What happens when the error tracking service itself is unreachable? Errors should be logged locally and retried when the service recovers.
- What happens when environment variables are missing or misconfigured in production? The application should fail fast at startup with a clear error message indicating which configuration is missing.
- What happens when SSL certificates expire? The system should use auto-renewal mechanisms and alert the team at least 14 days before expiration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve the frontend application at the `viably.dev` domain with HTTPS encryption
- **FR-002**: System MUST serve the backend API at the `api.viably.dev` domain with HTTPS encryption
- **FR-003**: System MUST redirect all HTTP requests to HTTPS automatically
- **FR-004**: System MUST redirect `www.viably.dev` to `viably.dev`
- **FR-005**: System MUST provide a health check endpoint at `api.viably.dev/health` that returns the current service status
- **FR-006**: System MUST run automated quality checks (linting, type checking, tests, build) on every push to any branch
- **FR-007**: System MUST automatically deploy to production when code is pushed to `main` and all checks pass
- **FR-008**: System MUST block production deployment when any quality check fails
- **FR-009**: System MUST create preview deployments for pull requests (frontend)
- **FR-010**: System MUST capture and report unhandled errors in both frontend and backend to an error tracking service
- **FR-011**: System MUST monitor uptime of `viably.dev` and `api.viably.dev/health` continuously
- **FR-012**: System MUST send alerts to the team when downtime is detected or critical error thresholds are exceeded
- **FR-013**: System MUST create automatic daily backups of the production database
- **FR-014**: System MUST retain database backups for at least 7 days
- **FR-015**: System MUST support database restoration from any retained backup
- **FR-016**: System MUST track key user events: signup, project_created, generation_started, generation_complete, deployed, purchased_credits
- **FR-017**: System MUST provide funnel visualization for the user journey (Landing -> Signup -> First Project -> Generation -> Deploy)
- **FR-018**: System MUST store all secrets and credentials as environment variables, never in source code
- **FR-019**: System MUST enforce rate limiting on authentication endpoints (60 requests per minute) and generation endpoints (30 requests per minute)
- **FR-020**: System MUST set secure cookie flags (httpOnly, secure, sameSite) in production
- **FR-021**: System MUST include security headers in all responses
- **FR-022**: System MUST produce structured logs from the backend service accessible via a centralized dashboard
- **FR-023**: System MUST run background workers (task queue) for asynchronous operations in production
- **FR-024**: System MUST provide a managed cache/message broker service in production

### Key Entities

- **Environment**: A named deployment target (production, staging, preview) with its own set of configuration values, domain bindings, and service instances
- **Deployment**: A versioned release of the application to a specific environment, including its build artifacts, timestamp, initiating commit, and success/failure status
- **Backup**: A point-in-time snapshot of the production database with creation timestamp, retention policy, and restore capability
- **Alert**: A notification triggered by a monitored condition (downtime, error spike, backup failure) with severity level, recipients, and delivery channel
- **Analytics Event**: A recorded user action with event type, timestamp, user identifier, and contextual metadata

## Assumptions

- The domain `viably.dev` is already purchased and DNS can be configured
- The team uses GitHub as the source code repository
- A free or low-cost tier of monitoring, analytics, and error tracking services is sufficient for initial launch
- The application is containerized for backend deployment
- Frontend is a static/SSR Next.js application suitable for edge/CDN deployment
- The team has fewer than 5 members initially, so notification channels can be simple (email, messaging)
- The production database is PostgreSQL
- Redis is used as the cache/message broker for background workers

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access the application at `viably.dev` with page load time under 3 seconds on a standard broadband connection
- **SC-002**: The API responds to health check requests within 500 milliseconds
- **SC-003**: Code pushed to `main` is live in production within 10 minutes when all checks pass
- **SC-004**: 100% of unhandled errors in production are captured and visible in the error tracking dashboard
- **SC-005**: Team is notified of production downtime within 5 minutes of occurrence
- **SC-006**: Database backups are created daily with 100% reliability over any 30-day period
- **SC-007**: Database can be restored from backup within 1 hour
- **SC-008**: All key user events are tracked with less than 1% data loss
- **SC-009**: Production uptime is at least 99.5% measured monthly
- **SC-010**: Zero secrets or credentials are stored in source code or version control
