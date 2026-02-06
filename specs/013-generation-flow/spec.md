# Feature Specification: Generation Flow

**Feature Branch**: `013-generation-flow`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Frontend Generation Flow - Split view chat + config + preview with AI generation, deploy modal, and mobile adaptation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure and Launch AI Bot Generation (Priority: P1)

A user opens the generation page for their project and sees a split-screen interface. On the left panel, the system displays an AI welcome message and a dynamic configuration form based on the selected template. The user fills in the required parameters (bot name, target audience, functionality scope, etc.) and clicks "Generate". The system validates the form, checks the user's credit balance, and starts the AI generation process.

Alternatively, instead of filling out the structured form, the user can describe what they want in free text and submit that description for generation.

**Why this priority**: This is the core user action — configuring and launching generation is the primary purpose of the entire page. Without this, no generation can happen.

**Independent Test**: Can be fully tested by navigating to the generation page, filling in form fields, and clicking the generate button. Delivers value by enabling users to define their bot requirements and initiate creation.

**Acceptance Scenarios**:

1. **Given** the user is on the generation page with a template selected, **When** they fill in all required config fields and click "Generate", **Then** the system validates the form, deducts credits, and begins the generation process.
2. **Given** the user has not filled all required fields, **When** they click "Generate", **Then** the button remains disabled and required fields are highlighted.
3. **Given** the user has insufficient credits, **When** the generation page loads, **Then** the generate button shows "Insufficient credits" with a link to top up.
4. **Given** the user prefers free text input, **When** they write a description and submit it, **Then** the system uses that description for generation instead of form fields.

---

### User Story 2 - Monitor Real-Time Generation Progress (Priority: P1)

After launching generation, the right panel automatically switches to a progress view. The user sees a step-by-step list of generation stages (analyzing template, generating architecture, writing code, code review, testing, finalizing). Each step shows its status (pending, in progress, completed) with elapsed time. A progress bar shows overall completion. Animated code snippets appear as they are generated, giving the user a live feel of the process.

**Why this priority**: Users need immediate feedback that generation is working. Without progress visibility, users would have no confidence in the process and may abandon the page.

**Independent Test**: Can be tested by initiating generation and observing the progress panel updates. Delivers value by keeping users informed and engaged during the generation process.

**Acceptance Scenarios**:

1. **Given** generation has started, **When** the user watches the preview panel, **Then** they see steps completing one by one with elapsed time for each step.
2. **Given** generation is in progress, **When** a step is currently running, **Then** it shows an animated indicator and a progress bar.
3. **Given** generation is in progress, **When** code is being written, **Then** animated code snippets appear in the preview area.

---

### User Story 3 - Review Generated Code and Take Action (Priority: P1)

After generation completes, the code tab automatically activates. The user sees the full generated code in a code editor with a file tree on the left and the editor on the right. Below the editor, an action bar presents three options: deploy the bot, download the code as a ZIP archive, or preview the bot. The user can browse files, review the code, and decide on next steps.

**Why this priority**: The generated code output is the primary deliverable of the entire flow. Users must be able to review and act on the results.

**Independent Test**: Can be tested by completing a generation and interacting with the code viewer, file tree, and action buttons. Delivers value by letting users verify and use their generated bot code.

**Acceptance Scenarios**:

1. **Given** generation is complete, **When** the preview panel updates, **Then** the code tab activates automatically showing the full generated code.
2. **Given** the code viewer is displayed, **When** the user clicks a file in the file tree, **Then** the editor shows that file's content.
3. **Given** the code is displayed, **When** the user clicks "Download ZIP", **Then** the system downloads an archive of the generated code.

---

### User Story 4 - Deploy Generated Bot (Priority: P2)

The user clicks the "Deploy" button in the action bar. A modal appears with a multi-phase flow: first, the user enters their Telegram Bot Token and any additional environment variables. After clicking "Deploy", the modal transitions to a progress view showing deployment steps (creating repository, pushing code, connecting to hosting, building container, starting bot, health check). On success, the modal shows a celebration with bot details and a link to open the bot in Telegram. On failure, the user sees error details with options to retry or download the code.

**Why this priority**: Deployment is the second most important action after code generation — it makes the bot live. However, users can still derive value from downloading the code without deploying.

**Independent Test**: Can be tested by clicking Deploy, entering credentials, and observing the deploy flow through all phases. Delivers value by enabling one-click bot deployment.

**Acceptance Scenarios**:

1. **Given** the user clicks "Deploy", **When** the modal opens, **Then** they see a form requesting the Telegram Bot Token and relevant environment variables.
2. **Given** the user enters a valid bot token and clicks "Deploy", **When** deployment starts, **Then** the modal transitions to a progress view with step-by-step updates.
3. **Given** deployment succeeds, **When** the success state appears, **Then** the user sees a celebration animation, bot username, status, and a link to open in Telegram.
4. **Given** deployment fails, **When** the error state appears, **Then** the user sees error details with options to retry or download the code.
5. **Given** the user does not want to deploy, **When** they click "Download ZIP" in the modal, **Then** the code archive downloads without deploying.

---

### User Story 5 - Handle Generation Errors Gracefully (Priority: P2)

If the generation process encounters an error, the preview panel shows a clear error state. The user sees an error icon, an explanation message, expandable error details, and a reassurance that credits were not deducted. Two actions are available: retry generation with the same parameters, or go back to modify the configuration.

**Why this priority**: Error handling is essential for user trust. Users must know what happened and that they won't be charged for failed generations.

**Independent Test**: Can be tested by triggering an error scenario and verifying the error state display and action buttons. Delivers value by maintaining user confidence and providing recovery paths.

**Acceptance Scenarios**:

1. **Given** generation fails, **When** the error state displays, **Then** the user sees an error message with a reassurance that credits were not deducted.
2. **Given** an error has occurred, **When** the user clicks "Retry", **Then** the generation process restarts with the same parameters.
3. **Given** an error has occurred, **When** the user clicks "Modify parameters", **Then** the left panel form becomes editable again with previously entered values preserved.

---

### User Story 6 - Use Generation Flow on Mobile Devices (Priority: P3)

On mobile devices, the split-view layout transforms into a tabbed interface. The user sees bottom tabs to switch between "Chat" (configuration panel) and "Preview" (progress/code panel). The generate button appears as a floating bar at the bottom. The deploy modal becomes a full-screen sheet that slides up from the bottom. All interactive elements have touch-friendly sizes.

**Why this priority**: Mobile support broadens the user base but is not critical for the initial desktop-focused workflow. Most bot development is expected to happen on desktop.

**Independent Test**: Can be tested by opening the generation page on a mobile viewport and verifying tab navigation, floating button, and full-screen modals. Delivers value by enabling mobile users to generate and deploy bots.

**Acceptance Scenarios**:

1. **Given** the user opens the generation page on a mobile device, **When** the page loads, **Then** they see a tabbed layout instead of split view with bottom navigation.
2. **Given** the user is on the chat tab on mobile, **When** they fill in the form and tap "Generate", **Then** the view automatically switches to the preview tab showing progress.
3. **Given** deployment is triggered on mobile, **When** the deploy modal opens, **Then** it appears as a full-screen sheet sliding up from the bottom.

---

### Edge Cases

- What happens when the user navigates away during active generation? The system should warn the user and offer to continue in the background.
- What happens when the user's credits run out mid-session (e.g., credits were used elsewhere)? The generate button should update to reflect insufficient credits before they click.
- What happens if the user resizes the browser window below minimum panel widths? The layout should gracefully collapse to a single-panel tabbed view.
- What happens if the template has no config fields? The form area should show only the free text input option.
- What happens when the code editor tries to load a very large generated file? The editor should handle files gracefully without freezing the browser.
- What happens if the user double-clicks the generate button? The system should prevent duplicate generation requests.
- What happens if the deploy modal is dismissed during the deployment progress phase? The system should warn that deployment is still in progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a split-view layout with a chat/configuration panel on the left (40% default) and a preview/progress panel on the right (60% default).
- **FR-002**: System MUST provide a draggable divider between panels that allows users to resize the split ratio, with minimum widths of 320px for chat and 400px for preview.
- **FR-003**: System MUST persist the user's split ratio preference across sessions.
- **FR-004**: System MUST display a compact navigation bar (48px height) showing the project name, credit balance, and a back button.
- **FR-005**: System MUST render a dynamic configuration form based on the selected template's field definitions, supporting text, textarea, select, multiselect, and number field types.
- **FR-006**: System MUST validate all form fields (required fields, format validation) and disable the generate button until the form is valid.
- **FR-007**: System MUST check the user's credit balance and display an "Insufficient credits" message with a top-up link when the balance is too low.
- **FR-008**: System MUST provide a free text input as an alternative to the structured form for describing generation requirements.
- **FR-009**: System MUST display real-time generation progress through a step-by-step list with status indicators (pending, running, completed, error) and elapsed time per step.
- **FR-010**: System MUST show an overall progress bar during generation.
- **FR-011**: System MUST display animated code snippets during the "writing code" generation phase.
- **FR-012**: System MUST automatically activate the code tab upon generation completion, showing generated code in a code editor with a file tree.
- **FR-013**: System MUST provide post-generation actions: deploy, download ZIP, and preview.
- **FR-014**: System MUST present a multi-phase deploy modal: configuration input (bot token, env vars), deployment progress, and success/failure states.
- **FR-015**: System MUST display a celebration animation upon successful deployment with bot details and a direct link.
- **FR-016**: System MUST show clear error states for both generation and deployment failures, with retry options and reassurance about credit non-deduction.
- **FR-017**: System MUST prevent duplicate generation requests (e.g., double-click protection).
- **FR-018**: System MUST warn users attempting to navigate away during active generation or deployment.
- **FR-019**: System MUST transform the split-view into a tabbed interface on mobile viewports with bottom navigation.
- **FR-020**: System MUST display the generate button as a floating bar at the bottom on mobile devices.
- **FR-021**: System MUST render the deploy modal as a full-screen bottom sheet on mobile devices.
- **FR-022**: All interactive elements MUST have a minimum tap target size of 44px on mobile.
- **FR-023**: System MUST display an AI welcome message when the user first opens the generation page.
- **FR-024**: System MUST show template information (name, emoji, credit cost) in a collapsible header.

### Key Entities

- **GenerationSession**: Represents a single generation attempt for a project. Attributes: status (idle, generating, complete, error), progress percentage, current step, list of generation steps, generated code output, error details.
- **GenerationStep**: A single phase in the generation pipeline. Attributes: name, status (pending, running, done, error), elapsed duration.
- **GeneratedCode**: The output of a successful generation. Attributes: collection of files (name, content, language), file tree structure.
- **DeploymentSession**: Represents a deployment attempt. Attributes: status (config, deploying, success, failure), deployment steps, bot details (username, URL), error details.
- **ConfigField**: A template-defined form field. Attributes: field type (text, textarea, select, multiselect, number), label, placeholder, required flag, validation rules, options (for select/multiselect).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full generation flow (open page, fill form, generate, review code) in under 3 minutes (excluding AI generation time).
- **SC-002**: 95% of users see generation progress updates within 1 second of each step transition.
- **SC-003**: The generation page loads and becomes interactive within 2 seconds on standard broadband connections.
- **SC-004**: 90% of users successfully complete their first generation attempt without abandoning the page.
- **SC-005**: The split-view divider responds to drag interactions within 16ms (60fps smooth resizing).
- **SC-006**: The deploy flow (from clicking Deploy to seeing success/failure) completes within 90 seconds for standard-sized bots.
- **SC-007**: Mobile users can complete the same generation flow as desktop users with no loss of functionality.
- **SC-008**: All form validation errors are visible within 200ms of user interaction.
- **SC-009**: The code editor displays generated files without visible delay or jank when switching between files.

## Assumptions

- The user has already created a project and selected a template before reaching the generation page.
- Credit balance information is available from the existing credits module.
- Template configuration field definitions are available from the existing templates module.
- For the MVP, generation progress is simulated on the client side. Real-time backend integration will replace the simulation in a future iteration.
- For the MVP, deployment progress is simulated. Real deployment integration will be added in a future iteration.
- The code editor component from the project detail page can be reused for displaying generated code.
- The download ZIP functionality will be implemented as client-side file packaging for the MVP.
