# Feature Specification: E2E Testing & Polish

**Feature Branch**: `018-testing-polish`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "E2E Testing & Polish: Playwright e2e tests for critical flows, responsive polish across breakpoints, performance optimization, SEO meta tags, and final QA bug fixes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated E2E Testing of Critical User Flows (Priority: P1)

As a developer/QA engineer, I need automated end-to-end tests that verify the application's critical user journeys work correctly, so that regressions are caught before release and the product meets quality standards for launch.

The system should include automated test suites covering five key areas:
1. **Authentication flow** - registration, login, logout, redirect behavior
2. **Template-to-generation flow** - browsing templates, creating a project, configuring and triggering code generation, viewing results
3. **Deploy flow** - deploying generated bot code with a bot token, verifying deployment status
4. **Credits flow** - balance display, credit deduction on generation, daily bonus claiming
5. **Responsive behavior** - all critical flows function correctly on mobile viewport (375px)

**Why this priority**: E2E tests are the single most impactful quality gate for pre-launch. Without them, every deployment risks breaking critical user paths that directly impact revenue and user trust.

**Independent Test**: Can be fully tested by running the Playwright test suite against a running application instance. Each test suite is independently runnable and validates a complete user journey.

**Acceptance Scenarios**:

1. **Given** the test environment is running, **When** the auth test suite is executed, **Then** registration, login, dashboard redirect, navbar user display, logout, and re-login all pass
2. **Given** a logged-in test user, **When** the template-to-generation test suite runs, **Then** template selection, project creation, config form, generation trigger, and code display all pass
3. **Given** a project with generated code, **When** the deploy test suite runs, **Then** entering a bot token, triggering deployment, and verifying deployment info all pass
4. **Given** a user with known credit balance, **When** the credits test suite runs, **Then** balance check, generation deduction, and daily bonus claiming all pass
5. **Given** the mobile viewport (375px), **When** the responsive test suite runs, **Then** hamburger menu, single-column templates, tabbed generation view all function correctly

---

### User Story 2 - Responsive Polish Across All Breakpoints (Priority: P1)

As a user accessing Viably from any device (phone, tablet, desktop), I expect the interface to be fully usable and visually polished without layout issues, so that I can create and manage bots regardless of my screen size.

The application should be verified and polished across five breakpoints: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (iPad landscape), 1440px (desktop). Common issues to fix include text truncation, buttons overflowing the viewport, forms not being full-width on mobile, modals converting to full-screen sheets on mobile, absence of horizontal scroll, touch targets meeting minimum 44px, hamburger menu functionality, and generation split/tab switching.

**Why this priority**: A significant portion of users will access the platform from mobile devices. Broken layouts directly prevent users from completing core tasks and signal low quality.

**Independent Test**: Can be tested by manually or automatically loading each page at each breakpoint and verifying no layout issues exist.

**Acceptance Scenarios**:

1. **Given** any page at 375px viewport, **When** the user scrolls, **Then** no horizontal scrollbar appears
2. **Given** any interactive element on mobile, **When** the user taps it, **Then** the touch target is at least 44px in both dimensions
3. **Given** the navbar on a viewport below 768px, **When** the user views the page, **Then** the navigation collapses into a hamburger menu that opens and closes correctly
4. **Given** the generation page on mobile, **When** the user views code output and config, **Then** the split-panel layout switches to a tabbed interface
5. **Given** the templates page at 375px, **When** the user browses templates, **Then** templates display in a single column layout

---

### User Story 3 - Performance Optimization for Fast Loading (Priority: P2)

As a user, I expect pages to load quickly and animations to be smooth, so that the platform feels responsive and professional.

Key optimizations include: lazy-loading heavy components (code editor), analyzing and reducing bundle size, preloading fonts with display swap, prefetching data for predictable navigation, using GPU acceleration for animations, and disabling heavy visual effects on mobile devices.

**Why this priority**: Performance directly impacts user perception of quality and affects conversion rates. However, the application is already functional — this improves the experience rather than enabling it.

**Independent Test**: Can be tested by running a performance audit tool against each major page and measuring load times, bundle sizes, and render metrics.

**Acceptance Scenarios**:

1. **Given** the generation page is loaded, **When** the code editor appears, **Then** it is loaded lazily (not included in main bundle) with a skeleton placeholder during loading
2. **Given** a bundle analysis is run, **When** results are reviewed, **Then** no unexpected large dependencies exist beyond the code editor
3. **Given** the landing page on a mobile device, **When** the page loads, **Then** heavy decorative animations (glow orbs) are not rendered
4. **Given** any page on mobile, **When** performance is measured, **Then** the page achieves a score of 90+ in a standard performance audit

---

### User Story 4 - SEO & Meta Tags for Discoverability (Priority: P2)

As a potential user discovering Viably through search engines or social media, I expect to see informative, branded previews of the platform, so that I understand its value proposition before clicking.

The application should have proper metadata on all public pages including page-specific titles following a consistent template, Open Graph tags for social sharing previews, and a robots.txt plus sitemap.xml for search engine crawlers.

**Why this priority**: SEO is important for organic growth but is not blocking the core user experience. It can be incrementally improved post-launch.

**Independent Test**: Can be tested by inspecting page source for meta tags, sharing URLs on social platforms to verify preview cards, and checking robots.txt/sitemap.xml accessibility.

**Acceptance Scenarios**:

1. **Given** the landing page URL, **When** shared on social media, **Then** a branded preview card appears with title, description, and site name
2. **Given** any public page, **When** its HTML is inspected, **Then** a unique, descriptive title following the "{Page Name} | Viably" pattern is present
3. **Given** the application root, **When** /robots.txt is requested, **Then** a valid robots file is returned
4. **Given** the application root, **When** /sitemap.xml is requested, **Then** a valid sitemap listing public pages is returned

---

### User Story 5 - Final QA & Bug Fixes (Priority: P1)

As a user about to experience the product for the first time at launch, I expect every interaction to work smoothly without errors, broken states, or confusing behavior, so that I trust the platform enough to invest time in it.

A comprehensive manual QA pass covers: all navigation flows, error states (network errors, API errors, validation), empty states (no projects, no credits, no search results), loading states (skeletons, spinners, button loading indicators), dark mode consistency, and toast notification behavior.

**Why this priority**: Uncaught bugs at launch destroy first impressions. This is the final quality gate before real users interact with the product.

**Independent Test**: Can be tested by following a structured QA checklist covering each page and interaction state.

**Acceptance Scenarios**:

1. **Given** the full QA checklist, **When** each item is tested, **Then** all critical and major items pass
2. **Given** a production build of the application, **When** the console is monitored during all flows, **Then** no errors appear
3. **Given** dark mode is enabled, **When** every page is visited, **Then** all text is readable, all components are properly themed
4. **Given** the network is temporarily unavailable, **When** the user performs any action, **Then** an appropriate error message is displayed (no blank screens or crashes)

---

### Edge Cases

- What happens when a test user's session expires mid-test? Tests should handle re-authentication gracefully.
- How does the system behave when WebSocket connections fail during generation tests? Tests should use mocked WebSocket responses for reliability.
- What happens on extremely narrow viewports below 320px? The application should remain usable without critical layout breaks.
- How does the application handle rapid theme switching between light and dark mode? No visual artifacts or layout shifts should occur.
- What happens when a user has zero credits and attempts generation? A clear error message should appear, not a silent failure.
- What happens when the daily bonus has already been claimed today? The claim button should be disabled with an appropriate message.
- How do performance optimizations affect accessibility? Lazy-loaded components must remain accessible to screen readers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST have an automated E2E test suite that covers the authentication flow (register, login, logout, session redirect)
- **FR-002**: System MUST have an automated E2E test that covers the template browsing to code generation flow (select template, create project, configure, generate, view code)
- **FR-003**: System MUST have an automated E2E test that covers the deployment flow (enter bot token, deploy, verify status)
- **FR-004**: System MUST have an automated E2E test that covers the credits flow (check balance, generate to deduct credits, claim daily bonus)
- **FR-005**: System MUST have an automated E2E test that verifies responsive behavior at mobile viewport (375px)
- **FR-006**: All pages MUST render correctly without horizontal scrollbar at viewports 375px, 390px, 768px, 1024px, and 1440px
- **FR-007**: All interactive elements MUST have a minimum touch target of 44x44 pixels on mobile viewports
- **FR-008**: Navigation MUST collapse into a hamburger menu on viewports below 768px
- **FR-009**: The generation page MUST switch from split-panel to tabbed layout on mobile viewports
- **FR-010**: The code editor component MUST be lazy-loaded and not included in the initial page bundle
- **FR-011**: Heavy decorative animations MUST be disabled on mobile devices (viewport below 768px)
- **FR-012**: All public pages MUST have unique, descriptive title meta tags following the "{Page Name} | Viably" template pattern
- **FR-013**: The landing page MUST include Open Graph and Twitter Card meta tags for social sharing
- **FR-014**: The application MUST serve a valid robots.txt file at the root
- **FR-015**: The application MUST serve a valid sitemap.xml listing all public pages
- **FR-016**: All pages MUST display correctly in both light and dark mode with readable text and properly themed components
- **FR-017**: All user-facing error states MUST show informative messages (no blank screens, raw error codes, or silent failures)
- **FR-018**: All loading states MUST show appropriate visual indicators (skeletons, spinners, or button loading states)
- **FR-019**: Empty states (no projects, no credits, no search results) MUST display helpful messages with clear next-action guidance
- **FR-020**: The production build MUST produce no console errors during normal user flows
- **FR-021**: Fonts MUST be preloaded with display:swap to prevent invisible text during loading

### Key Entities

- **Test Suite**: A grouping of related E2E test cases targeting a specific user flow (auth, generation, deploy, credits, responsive)
- **Breakpoint**: A specific viewport width at which the layout adapts (375px, 390px, 768px, 1024px, 1440px)
- **Page Metadata**: Title, description, Open Graph, and Twitter Card tags associated with each public page

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 E2E test suites pass consistently (100% pass rate on 3 consecutive runs)
- **SC-002**: Zero horizontal scroll detected on any page across all 5 tested breakpoints
- **SC-003**: Performance audit score of 90+ on mobile for all primary pages (landing, dashboard, templates, generation)
- **SC-004**: All public pages have complete meta tags verified by an automated check (title, description, Open Graph)
- **SC-005**: Zero console errors in production build during full QA flow execution
- **SC-006**: All QA checklist items pass (registration, login, template browsing, generation, deploy, credits, settings, dark mode, error states, empty states, loading states, navigation, toasts, mobile)
- **SC-007**: Code editor initial load does not block page render (loaded asynchronously after page is interactive)
- **SC-008**: robots.txt and sitemap.xml are accessible and valid

## Assumptions

- The application runs on a local development server for E2E testing; no cloud CI/CD integration is required for MVP
- WebSocket-based generation can be mocked in E2E tests for test reliability and speed
- "Performance audit score of 90+" refers to Lighthouse or equivalent tool measurement
- API responses in E2E tests may use mock/stub responses rather than requiring a running backend
- The 5 breakpoints listed (375px, 390px, 768px, 1024px, 1440px) represent the target device categories; exact pixel-perfect matching is not required
- SEO optimization is limited to static meta tags and basic files (robots.txt, sitemap.xml); no server-side rendering changes or structured data markup are in scope
- The QA checklist from the input document is the authoritative list of items to verify
- Font preloading applies to Space Grotesk and Inter as the primary application fonts
