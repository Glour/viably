# Feature Specification: Settings Pages

**Feature Branch**: `014-settings-pages`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Settings pages: Profile, Billing/Credits, Plan, Theme with sidebar navigation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Settings Sections (Priority: P1)

A user clicks on "Settings" in the main application navigation. They see a settings page with a sidebar on the left listing four sections: Profile, Billing, Plan, and Theme. The currently active section is visually highlighted. The user clicks on different sections to navigate between them. On mobile devices, the sidebar transforms into horizontal tabs at the top of the page.

**Why this priority**: Navigation is the foundation — without a settings layout, no individual settings section can be accessed. This enables all other settings functionality.

**Independent Test**: Can be fully tested by opening settings and clicking each navigation item. Delivers value by providing organized access to all user settings.

**Acceptance Scenarios**:

1. **Given** the user is logged in, **When** they navigate to settings, **Then** they see a sidebar with Profile, Billing, Plan, and Theme links, with Profile selected by default.
2. **Given** the user is on the Profile settings page, **When** they click "Billing" in the sidebar, **Then** the content area updates to show the Billing section and the Billing link is highlighted.
3. **Given** the user is on a mobile device, **When** they open settings, **Then** they see horizontal tabs at the top instead of a sidebar.
4. **Given** the user navigates directly to a settings URL (e.g., /settings/theme), **When** the page loads, **Then** the corresponding section is active in the sidebar.

---

### User Story 2 - Update Profile Information (Priority: P1)

A user visits the Profile settings section. They see their current avatar (a circle image), name, and email address. The email field is read-only and grayed out. The user clicks on the avatar to upload a new photo (or drags and drops an image). They can also edit their name. After making changes, they click "Save Changes" and see a loading state followed by a success confirmation.

Below the profile information, there is a "Change Password" section where the user enters their current password, a new password (with a strength indicator), and confirms the new password. They click "Update Password" to save.

**Why this priority**: Profile management is a core user need — being able to update personal information and password is fundamental for any authenticated application.

**Independent Test**: Can be tested by uploading a new avatar, changing the name, and saving. Password change can be tested by entering current and new passwords. Delivers value by allowing users to manage their identity and security.

**Acceptance Scenarios**:

1. **Given** the user is on the Profile settings page, **When** the page loads, **Then** they see their current avatar, name, and email (email is read-only and grayed out).
2. **Given** the user clicks on the avatar area, **When** they select a new image file, **Then** a preview of the new avatar is displayed immediately.
3. **Given** the user drags an image file onto the avatar area, **When** the file is dropped, **Then** the avatar preview updates.
4. **Given** the user changes their name and clicks "Save Changes", **When** the save request is processing, **Then** the button shows a loading state, and on completion a success toast notification appears.
5. **Given** the user leaves the name field empty, **When** they try to save, **Then** a validation error message appears.
6. **Given** the user enters a new password, **When** they type, **Then** a password strength indicator shows the strength level (weak, medium, strong).
7. **Given** the user fills in current password, new password, and confirmation, **When** the new password and confirmation do not match, **Then** a validation error is displayed.
8. **Given** the user submits valid password fields, **When** the update succeeds, **Then** a success toast appears and the password fields are cleared.

---

### User Story 3 - View and Manage Credits (Priority: P1)

A user navigates to the Billing section. They see their current credit balance prominently displayed (large number with gradient text), their current plan badge, and daily bonus information (e.g., "+5 today, streak: 3 days"). A "Buy Credits" button is available.

When the user clicks "Buy Credits", a modal appears with predefined credit packages (50, 100, 250 credits at different prices), a custom amount input, and a payment method placeholder. Below the balance area, the user can view their transaction history — a list of credit additions and deductions with amounts, descriptions, dates, and filtering options (All, Earned, Spent, Purchased).

**Why this priority**: Credits are the monetization mechanism. Users need to see their balance, purchase more credits, and review their transaction history to manage their spending.

**Independent Test**: Can be tested by viewing the balance display, opening the buy credits modal, and filtering the transaction history. Delivers value by giving users full visibility and control over their credit balance.

**Acceptance Scenarios**:

1. **Given** the user opens the Billing section, **When** the page loads, **Then** they see their credit balance in large text, their plan badge, and daily bonus info.
2. **Given** the user clicks "Buy Credits", **When** the modal opens, **Then** they see three predefined packages with prices, a "popular" badge on the 100-credit package, and a "best value" badge on the 250-credit package.
3. **Given** the user is in the Buy Credits modal, **When** they click a package, **Then** it is visually selected and the total is shown.
4. **Given** the user wants a custom amount, **When** they enter a number in the custom input, **Then** the total adjusts accordingly.
5. **Given** the user views transaction history, **When** the list loads, **Then** each entry shows amount (color-coded: green for additions, red for deductions), description, and relative timestamp.
6. **Given** the user clicks "Earned" filter, **When** the filter is applied, **Then** only earned transactions (daily bonus, etc.) are displayed.
7. **Given** there are many transactions, **When** the user scrolls to the bottom of the list, **Then** more transactions load (pagination or infinite scroll).

---

### User Story 4 - View and Manage Subscription Plan (Priority: P2)

A user navigates to the Plan section. They see their current plan card with the plan name, a gradient badge for paid plans, a list of included features, usage statistics (projects used, credits remaining), and renewal date if applicable. Below, they see a plan comparison table showing all available plans with features and pricing, with their current plan highlighted. Upgrade and downgrade buttons are available. Enterprise plan shows a "Contact us" option.

**Why this priority**: Plan management is important for monetization and upselling but is less frequently accessed than profile or billing. Users already have a plan when they sign up; changing it is a secondary action.

**Independent Test**: Can be tested by viewing current plan details and interacting with upgrade/downgrade buttons. Delivers value by enabling users to understand and change their subscription.

**Acceptance Scenarios**:

1. **Given** the user opens the Plan section, **When** the page loads, **Then** they see their current plan with name, badge, features, usage stats, and renewal date.
2. **Given** the user scrolls to the plan comparison, **When** they view the plans, **Then** their current plan is visually highlighted and distinguishable from others.
3. **Given** the user is on a free plan, **When** they click "Upgrade" on a paid plan, **Then** they are directed to the checkout flow.
4. **Given** the Enterprise plan is displayed, **When** the user views it, **Then** they see a "Contact us" button instead of a price/upgrade button.

---

### User Story 5 - Change Application Theme (Priority: P2)

A user navigates to the Theme section. They see three theme options displayed as radio cards: Light ("Clean and bright", default), Dark ("Easy on the eyes"), and System ("Match your OS preference"). Each option shows a small preview of how the interface would look with that theme. The user selects a theme and it applies immediately with a smooth transition. The selection persists across browser sessions.

**Why this priority**: Theme customization enhances user comfort and accessibility but does not affect core functionality. It is a "nice to have" feature that improves the user experience.

**Independent Test**: Can be tested by selecting each theme option and verifying the visual change, transition animation, and persistence after page reload. Delivers value by letting users personalize their experience.

**Acceptance Scenarios**:

1. **Given** the user opens the Theme section, **When** the page loads, **Then** they see three theme options as radio cards with previews, and their current theme is selected.
2. **Given** the user clicks "Dark" theme, **When** the theme changes, **Then** the entire application switches to dark mode with a smooth transition.
3. **Given** the user selects "System" theme and their OS is in dark mode, **When** the theme applies, **Then** the application switches to dark mode.
4. **Given** the user has selected a theme, **When** they close the browser and return later, **Then** their selected theme is still active.

---

### Edge Cases

- What happens when the user uploads an avatar file that is too large? The system should display a file size limit warning and reject the upload.
- What happens when the user uploads a non-image file as an avatar? The system should validate the file type and show an error.
- What happens when the avatar upload fails due to a network error? The system should show an error toast and allow the user to retry.
- What happens when the user enters a very long name? The system should enforce a character limit on the name field.
- What happens when the current password is incorrect during password change? The system should display an appropriate error message.
- What happens when the transaction history is empty? The system should display an empty state message.
- What happens when the Buy Credits modal payment fails? For the MVP, the payment method is a placeholder, so this is handled in a future iteration.
- What happens when the user's session expires while on the settings page? The system should redirect to the login page.
- What happens when a system theme change occurs while the app is open and "System" theme is selected? The app should reactively switch theme.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a settings layout with a sidebar navigation (220px width) listing Profile, Billing, Plan, and Theme sections.
- **FR-002**: The active navigation item MUST be visually distinguished with a highlighted background and primary text color.
- **FR-003**: On mobile viewports, the sidebar MUST transform into horizontal tabs at the top of the page.
- **FR-004**: System MUST display the user's avatar as a circular image that supports click-to-change and drag-and-drop upload.
- **FR-005**: System MUST show an immediate preview of the uploaded avatar before saving.
- **FR-006**: System MUST validate avatar uploads for file type (images only) and file size (maximum 5 MB).
- **FR-007**: System MUST display the user's name as an editable text field.
- **FR-008**: System MUST display the user's email as a read-only, visually grayed-out field.
- **FR-009**: System MUST provide a "Save Changes" button for profile info that shows loading, success (toast), and error states.
- **FR-010**: System MUST provide a "Change Password" form with current password, new password (with strength indicator), and password confirmation fields.
- **FR-011**: System MUST validate that new password and confirmation match before allowing submission.
- **FR-012**: System MUST display a password strength indicator that updates in real time as the user types.
- **FR-013**: System MUST display the user's credit balance prominently with large text and gradient styling.
- **FR-014**: System MUST show the user's current plan badge next to the credit balance.
- **FR-015**: System MUST display daily bonus information including today's bonus and current streak.
- **FR-016**: System MUST provide a "Buy Credits" button that opens a modal with predefined credit packages (50, 100, 250 credits).
- **FR-017**: The Buy Credits modal MUST show a "popular" badge on the 100-credit package and a "best value" badge on the 250-credit package.
- **FR-018**: The Buy Credits modal MUST include a custom credit amount input option.
- **FR-019**: The Buy Credits modal MUST include a payment method section (placeholder for MVP).
- **FR-020**: System MUST display a transaction history list showing amount (color-coded: green for credits gained, red for credits spent), description, and relative timestamp.
- **FR-021**: System MUST provide transaction history filters: All, Earned, Spent, Purchased.
- **FR-022**: System MUST support pagination or infinite scroll for transaction history.
- **FR-023**: System MUST display the current plan card with plan name, badge (gradient for paid plans), included features, usage statistics, and renewal date.
- **FR-024**: System MUST display a plan comparison section showing all available plans with features and pricing.
- **FR-025**: The user's current plan MUST be visually highlighted in the plan comparison.
- **FR-026**: System MUST provide upgrade/downgrade buttons on plan cards (linking to checkout for MVP).
- **FR-027**: The Enterprise plan MUST display a "Contact us" option instead of a price.
- **FR-028**: System MUST display three theme options as radio cards: Light, Dark, and System.
- **FR-029**: Each theme option MUST include a small preview showing how the theme looks.
- **FR-030**: Theme selection MUST apply immediately with a smooth visual transition.
- **FR-031**: Theme selection MUST persist across browser sessions.
- **FR-032**: The "System" theme option MUST reactively follow the user's operating system theme preference.
- **FR-033**: System MUST validate the name field (required, maximum character limit).
- **FR-034**: System MUST clear password fields after a successful password update.

### Key Entities

- **UserProfile**: Represents the user's profile information. Attributes: avatar (image), display name, email address (read-only).
- **CreditBalance**: Represents the user's current credit state. Attributes: total credits, current plan name, daily bonus amount, streak days.
- **CreditTransaction**: A single credit movement. Attributes: amount (positive or negative), type (earned, spent, purchased), description, timestamp.
- **CreditPackage**: A purchasable credit bundle. Attributes: credit amount, price, badge label (popular, best value).
- **SubscriptionPlan**: A subscription tier. Attributes: plan name, price, included features, project limit, credit allowance, renewal period.
- **ThemePreference**: The user's chosen theme. Attributes: mode (light, dark, system).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all four settings sections in under 1 second per transition.
- **SC-002**: Users can update their profile (name + avatar) and save in under 30 seconds.
- **SC-003**: Users can complete a password change in under 1 minute.
- **SC-004**: 95% of users can find and access their credit balance within 5 seconds of opening settings.
- **SC-005**: The Buy Credits modal opens and displays all packages within 500ms of clicking the button.
- **SC-006**: Theme changes apply visually across the entire application within 500ms of selection.
- **SC-007**: Theme preference is preserved after closing and reopening the browser (100% persistence rate).
- **SC-008**: Mobile users can access all settings sections with the same functionality as desktop users.
- **SC-009**: 90% of users can successfully change their theme on their first attempt without confusion.

## Assumptions

- The user is authenticated and has an active session before accessing settings.
- User profile data (name, email, avatar) is available from the existing auth/users module.
- Credit balance and transaction history data is available from the existing credits module.
- Subscription plan data and plan comparison information is available from existing backend modules.
- For the MVP, the payment method in the Buy Credits modal is a placeholder UI — actual payment processing will be implemented in a future iteration.
- Avatar images will be resized client-side before upload for consistency (e.g., cropped to square, maximum dimension).
- Password strength indicator uses client-side logic (length, character diversity, common password checks).
- The settings page defaults to the Profile section when accessed without a specific subsection URL.
- Plan upgrade/downgrade buttons link to an external checkout page (e.g., Stripe) for the MVP.
