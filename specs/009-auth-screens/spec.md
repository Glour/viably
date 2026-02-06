# Feature Specification: Auth Screens

**Feature Branch**: `009-auth-screens`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Login, Register, Forgot Password pages with split layout: decorative panel on the left + form on the right"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing User Signs In (Priority: P1)

A returning user visits the platform and needs to sign in to access their dashboard. They see a visually appealing split-screen layout with a decorative branding panel on the left and a sign-in form on the right. The user enters their email and password, and upon successful authentication is redirected to their dashboard. If the user makes an error (wrong password, invalid email), they receive clear, immediate feedback.

**Why this priority**: Sign-in is the most frequently used auth flow. Without it, no existing user can access the platform. It's the gateway to all product functionality.

**Independent Test**: Can be fully tested by navigating to the login page, entering credentials, and verifying redirect to dashboard. Delivers immediate access to product for returning users.

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** they enter a valid email and password and click "Sign In", **Then** they see a loading state on the button and are redirected to the dashboard upon success.
2. **Given** a user is on the login page, **When** they enter an invalid email format, **Then** they see a validation error below the email field before submitting.
3. **Given** a user is on the login page, **When** they enter a password shorter than 8 characters, **Then** they see a validation error below the password field.
4. **Given** a user is on the login page, **When** they submit invalid credentials, **Then** they see a toast notification with an error message and the form fields highlight the errors with a shake animation.
5. **Given** a user is on the login page, **When** they click the password visibility toggle, **Then** the password field switches between masked and visible text.
6. **Given** a user is on the login page, **When** they click "Forgot password?", **Then** they are navigated to the forgot password page.
7. **Given** a user is on the login page, **When** they click "Don't have an account? Sign up", **Then** they are navigated to the registration page.
8. **Given** a user is on a mobile device (viewport < 768px), **When** they view the login page, **Then** only the form is visible at full width (decorative panel is hidden).

---

### User Story 2 - New User Creates Account (Priority: P2)

A new user wants to create an account on the platform. They navigate to the registration page, fill in their name, email, password (with real-time strength feedback), confirm password, and agree to terms. Upon successful registration, they are redirected to the dashboard.

**Why this priority**: Registration is essential for user acquisition. Without it, no new users can join. Slightly lower priority than login because sign-in serves the existing user base.

**Independent Test**: Can be fully tested by navigating to the registration page, filling all fields, agreeing to terms, and verifying redirect to dashboard. Delivers ability for new users to onboard.

**Acceptance Scenarios**:

1. **Given** a user is on the registration page, **When** they fill in all fields correctly and click "Create Account", **Then** they see a loading state and are redirected to the dashboard upon success.
2. **Given** a user is on the registration page, **When** they enter a name shorter than 2 characters or longer than 50, **Then** they see a validation error.
3. **Given** a user is on the registration page, **When** they type a password, **Then** a strength indicator updates in real-time showing 4 levels: Weak (1/4), Fair (2/4), Good (3/4), Strong (4/4).
4. **Given** a user is on the registration page, **When** the confirm password does not match the password, **Then** they see a "Passwords do not match" validation error.
5. **Given** a user is on the registration page, **When** they do not check the terms checkbox, **Then** the form cannot be submitted and they see a validation error.
6. **Given** a user is on the registration page, **When** they click "Already have an account? Sign in", **Then** they are navigated to the login page.
7. **Given** a user is on the registration page, **When** submission fails (e.g., email already taken), **Then** they see a toast notification with the error and relevant field is highlighted.

---

### User Story 3 - User Resets Forgotten Password (Priority: P3)

A user who has forgotten their password navigates to the password reset page. They enter their email address and receive confirmation that a reset link has been sent. If the email is not found, they receive appropriate feedback.

**Why this priority**: Password reset is a support/recovery flow. Important for user retention but used less frequently than sign-in or registration.

**Independent Test**: Can be fully tested by navigating to the forgot password page, entering an email, and verifying the success/error state. Delivers self-service password recovery without support intervention.

**Acceptance Scenarios**:

1. **Given** a user is on the forgot password page, **When** they enter a valid email and click "Send Reset Link", **Then** they see a loading state followed by a success message showing "Check your email! We sent a reset link to {email}".
2. **Given** a user is on the forgot password page, **When** they enter an email that has no associated account, **Then** they see an error message "No account found with this email".
3. **Given** a user is on the forgot password page, **When** they enter an invalid email format, **Then** they see a validation error below the email field.
4. **Given** a user is on the forgot password page, **When** they click "Back to Sign In", **Then** they are navigated to the login page.

---

### User Story 4 - Brand Experience via Auth Layout (Priority: P1)

All authentication pages share a consistent, visually engaging split-screen layout that reinforces the Viably brand. On desktop, a decorative panel occupies the left side with gradient background, animated glow orbs, an inspiring tagline, and a social proof stat. On mobile, the decorative panel is hidden and the form takes full width.

**Why this priority**: The auth layout is the foundation for all auth screens. Without it, none of the individual pages can be rendered correctly. Co-prioritized with P1 as an infrastructure dependency.

**Independent Test**: Can be tested by viewing any auth page on desktop and mobile viewports, verifying the split layout and responsive behavior.

**Acceptance Scenarios**:

1. **Given** a user visits any auth page on desktop, **When** the page loads, **Then** they see a split layout with a decorative panel (approximately 45% width) on the left and the form area (approximately 55% width) on the right.
2. **Given** a user visits any auth page on desktop, **When** the page loads, **Then** the decorative panel displays animated floating glow orbs, an inspiring tagline, and a social proof badge.
3. **Given** a user visits any auth page on mobile (< 768px), **When** the page loads, **Then** the decorative panel is hidden and the form occupies the full width.
4. **Given** a user visits any auth page, **When** the page loads, **Then** the form content (logo, fields, buttons) is vertically centered within the form area.

---

### User Story 5 - Social Login Buttons (Priority: P3)

Login and registration pages display social login options (Google, GitHub) as visual buttons. For MVP, these buttons are visual-only placeholders (no backend integration) to establish the UI pattern for future implementation.

**Why this priority**: Social login is a convenience feature. Visual presence establishes the pattern but backend integration is not required for MVP.

**Independent Test**: Can be tested by verifying the presence and styling of social login buttons on login and registration pages. Delivers visual completeness and sets up the UI for future integration.

**Acceptance Scenarios**:

1. **Given** a user is on the login or registration page, **When** the page loads, **Then** they see Google and GitHub social login buttons separated from the main form by a divider ("or").
2. **Given** a user clicks a social login button, **When** the click occurs, **Then** nothing happens (MVP: no backend action), but the button provides visual feedback (hover/active states).

---

### Edge Cases

- What happens when a user submits the login form while a previous request is still loading? The submit button should be disabled during loading to prevent duplicate requests.
- What happens when a user navigates between auth pages rapidly? Each page should render correctly regardless of navigation speed.
- What happens when a user pastes a very long string into an input field? Input should handle gracefully without layout breaking (truncation or scrolling).
- What happens when a user has JavaScript disabled? Forms should degrade gracefully (basic form submission without client-side validation).
- What happens when a user tries to access auth pages while already authenticated? They should be redirected to the dashboard.
- What happens when the password strength indicator encounters edge-case passwords (e.g., all special characters, Unicode characters)? The indicator should still compute and display a strength level.
- What happens when terms of service / privacy policy links are clicked? They should open the respective pages (or placeholders for MVP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a split-screen layout on all auth pages with a decorative branding panel on the left and form content on the right on desktop viewports.
- **FR-002**: System MUST hide the decorative panel on mobile viewports (< 768px) and display the form at full width.
- **FR-003**: Decorative panel MUST include animated glow orbs, a brand tagline ("Create anything. Ship instantly."), and a social proof stat ("1,200+ bots deployed").
- **FR-004**: Form area MUST vertically center all content (logo, heading, form fields, buttons, links).
- **FR-005**: Login page MUST include email and password inputs, a "Forgot password?" link, a "Sign In" button, social login buttons (Google, GitHub), and a "Sign up" navigation link.
- **FR-006**: Login form MUST validate email format and password minimum length (8 characters) on the client side before submission.
- **FR-007**: Login form MUST display field-level validation errors below each input with a shake animation on submission failure.
- **FR-008**: Login page MUST include a password visibility toggle that switches between masked and visible text.
- **FR-009**: Registration page MUST include name, email, password, confirm password inputs, a terms agreement checkbox, a "Create Account" button, social login buttons, and a "Sign in" navigation link.
- **FR-010**: Registration form MUST validate: name (2-50 characters), email (valid format), password (minimum 8 characters, at least one uppercase letter, one number, one special character), confirm password (must match), and terms checkbox (must be checked).
- **FR-011**: Registration page MUST display a real-time password strength indicator with 4 levels: Weak, Fair, Good, Strong, with corresponding visual representation.
- **FR-012**: Forgot password page MUST include an email input, a "Send Reset Link" button, and a "Back to Sign In" navigation link.
- **FR-013**: Forgot password page MUST display a success state showing the submitted email address when the reset request succeeds.
- **FR-014**: Forgot password page MUST display an error state when the email is not found in the system.
- **FR-015**: All auth forms MUST show a loading state on the submit button during form submission (visual shimmer effect + disabled state).
- **FR-016**: All auth forms MUST display error messages via toast notifications for server-side errors.
- **FR-017**: Login and registration pages MUST redirect to the dashboard upon successful authentication/registration.
- **FR-018**: Social login buttons (Google, GitHub) MUST be displayed on login and registration pages as visual placeholders for MVP (no backend action).
- **FR-019**: All navigation links between auth pages MUST work correctly (login ↔ register, login → forgot password, forgot password → login).
- **FR-020**: System MUST redirect authenticated users away from auth pages to the dashboard.
- **FR-021**: All auth pages MUST display the Viably logo (icon + text) at the top of the form area.

### Key Entities

- **Auth Form State**: Represents the current state of an auth form (field values, validation errors, submission status: idle/loading/error/success).
- **Password Strength**: A computed value (Weak/Fair/Good/Strong) derived from password content, based on length, uppercase letters, numbers, and special characters.
- **User Credentials**: Email and password pair used for authentication. Email must be valid format, password must meet minimum requirements.
- **Registration Data**: Name, email, password, confirm password, and terms acceptance. All fields are required with specific validation rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the sign-in flow (enter credentials and reach dashboard) in under 30 seconds.
- **SC-002**: Users can complete the registration flow (fill all fields and reach dashboard) in under 2 minutes.
- **SC-003**: 95% of users see validation feedback within 1 second of triggering a validation error.
- **SC-004**: All auth pages render correctly on viewports from 320px to 2560px wide.
- **SC-005**: The password strength indicator updates within 200ms of each keystroke.
- **SC-006**: All navigation links between auth pages load the target page within 1 second.
- **SC-007**: The split layout decorative panel is invisible on viewports narrower than 768px.
- **SC-008**: Loading states are displayed immediately upon form submission and persist until the operation completes or fails.

## Assumptions

- The design system from module 01-design-system is available and provides base components (buttons, inputs, toast notifications, etc.).
- Social login buttons are visual-only for MVP; backend integration will be a separate feature.
- The dashboard route (/dashboard) exists as a redirect target, even if it's a placeholder page.
- Terms of Service and Privacy Policy pages exist or will be created as placeholder pages.
- The backend authentication endpoints exist or will be mocked for frontend development.
- The font "Space Grotesk" is already configured in the design system.
- Toast notification component is available from the design system.
- Form state management and validation are handled client-side for MVP.
