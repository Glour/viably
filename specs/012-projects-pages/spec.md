# Feature Specification: Projects List & Detail Pages

**Feature Branch**: `012-projects-pages`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Frontend Projects List & Detail: grid/list view of user projects, project detail page with tabs (overview, code viewer, logs, settings)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Manage Projects List (Priority: P1)

A user navigates to the Projects page to see all their created bot projects. They can switch between a visual grid view and a compact list view, search for a specific project by name, filter by status (Draft, Deployed, etc.), and sort the list. From any project card, they can open a context menu to duplicate, download, or delete a project.

**Why this priority**: The projects list is the central hub of the platform. Without it, users cannot access, organize, or manage their bots. This is the primary navigation entry point for all project-related actions.

**Independent Test**: Can be fully tested by creating mock projects and verifying grid/list toggling, search filtering, sort ordering, and context menu actions. Delivers immediate value as the main project management interface.

**Acceptance Scenarios**:

1. **Given** a user has 5 projects, **When** they open the Projects page, **Then** they see all 5 projects in grid view (3 columns on desktop) with emoji, name, status badge, description, and last updated time.
2. **Given** a user is viewing the grid, **When** they click the list toggle, **Then** projects display as table-like rows with emoji+name, category, status badge, updated time, and action menu.
3. **Given** a user has 10 projects, **When** they type "shop" in the search input, **Then** only projects whose name or description contain "shop" are displayed (debounced input).
4. **Given** a user is viewing all projects, **When** they select the "Deployed" filter, **Then** only projects with "Deployed" status are shown.
5. **Given** a user is viewing projects, **When** they select "By name" sort, **Then** projects are reordered alphabetically by name.
6. **Given** a user clicks the action menu on a project card, **When** they select "Delete", **Then** a confirmation modal appears warning about permanent deletion.

---

### User Story 2 - View Project Details and Overview (Priority: P1)

A user clicks on a project from the list to open its detail page. They see the project header with name, emoji, status, category, and creation date. Below the header, tabs allow navigating between Overview, Code, Logs, and Settings. The Overview tab shows project configuration key-value pairs and deployment information.

**Why this priority**: The detail page is essential for understanding project state and accessing project management tools. Without it, users cannot inspect or interact with individual projects.

**Independent Test**: Can be tested by navigating to a project detail page, verifying header displays correct project info, tabs switch content via URL query parameters, and Overview tab shows configuration and deployment data.

**Acceptance Scenarios**:

1. **Given** a user is on the projects list, **When** they click a project card, **Then** they navigate to the project detail page showing project emoji, name, status badge, category, and creation date.
2. **Given** a user is on a project detail page, **When** they see the header, **Then** action buttons "Open in Telegram", "Redeploy", "Download ZIP", and "Settings" are visible.
3. **Given** a user is on the Overview tab, **When** the page loads, **Then** project configuration key-value pairs and deployment info (URL, bot username, status, uptime, cost estimate) are displayed.
4. **Given** a user clicks the "Code" tab, **When** the tab switches, **Then** the URL updates to `?tab=code` and the Code viewer content is displayed.
5. **Given** a user navigates directly to `/projects/[id]?tab=logs`, **When** the page loads, **Then** the Logs tab is active and its content is displayed.

---

### User Story 3 - View and Navigate Project Code (Priority: P2)

A user wants to inspect the generated code of their bot project. On the Code tab, they see a file tree on the left and a code editor on the right. Clicking a file in the tree loads its content in the read-only editor with syntax highlighting.

**Why this priority**: Code inspection is important for transparency and trust but is not required for basic project management. Users need to verify what was generated, but this can be deferred after the core list and detail views.

**Independent Test**: Can be tested by switching to the Code tab, clicking files in the tree, and verifying syntax-highlighted code appears in the read-only editor.

**Acceptance Scenarios**:

1. **Given** a user is on the Code tab, **When** the tab loads, **Then** a file tree panel (left) and a code editor panel (right) are displayed.
2. **Given** the file tree shows project files, **When** a user clicks "main.py", **Then** the editor loads main.py content with Python syntax highlighting.
3. **Given** the editor is displaying code, **When** a user tries to type, **Then** no changes are made (read-only mode).
4. **Given** the file tree has nested folders, **When** a user clicks a folder, **Then** it expands to show child files/folders.

---

### User Story 4 - Monitor Project Logs (Priority: P2)

A user wants to see the runtime logs of their deployed bot. On the Logs tab, they see a terminal-style viewer with color-coded log levels. They can filter logs by level and clear the log view.

**Why this priority**: Log monitoring is important for debugging deployed bots but not required for initial project management. Mock data suffices for MVP.

**Independent Test**: Can be tested by switching to the Logs tab, verifying terminal-style appearance, checking color coding per log level, and testing the level filter and clear button.

**Acceptance Scenarios**:

1. **Given** a user is on the Logs tab, **When** the tab loads, **Then** a dark terminal-style viewer displays log entries with colored timestamps and log levels.
2. **Given** logs are displayed, **When** new log entries appear, **Then** the viewer auto-scrolls to the bottom.
3. **Given** a user selects "Error" filter, **When** the filter is applied, **Then** only ERROR-level logs are shown.
4. **Given** a user clicks "Clear", **When** the action completes, **Then** all visible logs are removed from the viewer.

---

### User Story 5 - Manage Project Settings (Priority: P2)

A user wants to configure their project's environment variables, control the bot's running state, and access dangerous actions like project deletion. The Settings tab provides sections for environment variables editing, bot start/stop controls, and a danger zone.

**Why this priority**: Settings management is necessary for project lifecycle but can be developed after core views. Environment variables and bot control are operational features.

**Independent Test**: Can be tested by switching to the Settings tab, adding/removing environment variable rows, toggling bot start/stop, and verifying the delete confirmation flow.

**Acceptance Scenarios**:

1. **Given** a user is on the Settings tab, **When** they view the Environment Variables section, **Then** existing variables are shown with masked values and a show/hide toggle.
2. **Given** a user clicks "Add variable", **When** a new row appears, **Then** they can enter a key and value.
3. **Given** a user sees the Actions section, **When** they click the Start/Stop toggle, **Then** the toggle switches between green (running) and red (stopped) states.
4. **Given** a user clicks "Delete project" in the Danger Zone, **When** the confirmation modal appears, **Then** it warns that this action is permanent and will stop the deployed bot.

---

### User Story 6 - Empty State for New Users (Priority: P3)

A new user with no projects visits the Projects page. They see a friendly empty state with an illustration and two call-to-action buttons guiding them to either choose a template or create a project from scratch.

**Why this priority**: Important for onboarding but only relevant for new users. Returning users with projects will never see this state.

**Independent Test**: Can be tested by rendering the projects page with zero projects and verifying the empty state illustration, text, and both CTA buttons link to correct destinations.

**Acceptance Scenarios**:

1. **Given** a user has no projects, **When** they open the Projects page, **Then** a centered empty state is displayed with an illustration, heading, and subheading.
2. **Given** the empty state is displayed, **When** the user clicks "Choose template", **Then** they are navigated to `/templates`.
3. **Given** the empty state is displayed, **When** the user clicks "Create from scratch", **Then** they are navigated to `/projects/new`.

---

### Edge Cases

- What happens when a user searches for a project that doesn't exist? The list shows zero results with an inline "no results" message and a suggestion to clear filters.
- What happens when the project's generated code has no files? The Code tab shows an empty state: "No files available for this project."
- What happens when a user tries to delete the only running project? The confirmation modal still appears with the standard warning. No special case.
- What happens when a project is in "Generating" status? The status badge shows an animated pulse. Action menu items that require a completed project (e.g., "Open in Telegram", "Redeploy") are disabled.
- How does the list behave on mobile? Grid view switches to 1 column; list view becomes the default on small screens.
- What happens if environment variable keys contain special characters? Keys are validated to allow only alphanumeric characters, underscores, and hyphens.
- What happens when project description is very long? Description text is clamped to 2 lines with ellipsis overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all user projects in a grid layout (3 columns on desktop) by default.
- **FR-002**: System MUST provide a list view as an alternative display mode with table-like rows.
- **FR-003**: Users MUST be able to toggle between grid and list views, with the preference persisted during the session.
- **FR-004**: System MUST provide a debounced search input that filters projects by name and description.
- **FR-005**: System MUST provide a status filter dropdown with options: All, Deployed, Generated, Draft, Failed.
- **FR-006**: System MUST provide a sort dropdown with options: Newest first, Oldest first, By name.
- **FR-007**: Each project card/row MUST display: emoji icon, name, status badge, description (clamped to 2 lines), and last updated time.
- **FR-008**: Each project MUST have a context menu with actions: Open, Duplicate, Download (ZIP), and Delete (with confirmation).
- **FR-009**: Status badges MUST visually distinguish 6 states: Draft (neutral), Generating (info with pulse animation), Generated (amber), Deployed (success/green), Failed (error/red), Stopped (neutral dark).
- **FR-010**: System MUST display an empty state with illustration and two CTA buttons when user has no projects.
- **FR-011**: The projects list header MUST show the project count, plan limit, and current plan name.
- **FR-012**: System MUST display a project detail page accessible by clicking a project card.
- **FR-013**: The project detail page MUST have a header with project info (emoji, name, status, category, creation date) and action buttons.
- **FR-014**: The project detail page MUST have 4 tabs: Overview, Code, Logs, Settings, with URL-based navigation (?tab=).
- **FR-015**: The Overview tab MUST display project configuration as key-value pairs and deployment information.
- **FR-016**: The Code tab MUST display a file tree panel and a read-only code editor with syntax highlighting.
- **FR-017**: Clicking a file in the file tree MUST load its content in the code editor.
- **FR-018**: The Logs tab MUST display a terminal-style log viewer with color-coded log levels (INFO=green, WARNING=yellow, ERROR=red).
- **FR-019**: The Logs tab MUST provide log level filtering (All, Info, Warning, Error) and a clear button.
- **FR-020**: The Logs tab MUST auto-scroll to the most recent entry.
- **FR-021**: The Settings tab MUST provide an environment variables editor with add/remove rows and masked value toggle.
- **FR-022**: The Settings tab MUST provide a Start/Stop bot toggle and Redeploy button.
- **FR-023**: The Settings tab MUST include a Danger Zone section with a project deletion button and confirmation modal.
- **FR-024**: The project detail page MUST include a "Back to projects" breadcrumb link.
- **FR-025**: The grid view MUST be responsive: 3 columns on desktop, 2 on tablet, 1 on mobile.
- **FR-026**: On mobile devices, list view MUST be the default display mode.

### Key Entities

- **Project**: Represents a user's bot project. Attributes: unique identifier, name, emoji icon, description, status (Draft/Generating/Generated/Deployed/Failed/Stopped), category, creation date, last updated date, configuration key-value pairs, deployment information.
- **Project File**: A file within a project's generated code. Attributes: file path, file name, content, file type (folder/file).
- **Log Entry**: A runtime log message from a deployed bot. Attributes: timestamp, log level (INFO/WARNING/ERROR), message text.
- **Environment Variable**: A project configuration variable. Attributes: key, value (maskable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate a specific project from a list of 20+ projects within 10 seconds using search or filters.
- **SC-002**: Users can switch between grid and list views without page reload or data loss.
- **SC-003**: All 6 project statuses are visually distinguishable at a glance without reading text labels.
- **SC-004**: Users can navigate between all 4 project detail tabs without page reload.
- **SC-005**: New users see clear onboarding guidance (empty state) and can start project creation within 2 clicks.
- **SC-006**: The projects page renders within 2 seconds on standard connections with up to 50 projects.
- **SC-007**: Users can view project source code with syntax highlighting in a read-only editor.
- **SC-008**: Users can filter and review log entries by severity level.
- **SC-009**: Users can manage environment variables (add, remove, view/mask) without leaving the project detail page.
- **SC-010**: The delete project flow requires explicit confirmation before any destructive action is taken.

## Assumptions

- This is an MVP/frontend-only implementation using mock data. Real API integration will be added in a later phase.
- The code editor will use mock file data; actual project code retrieval will be implemented with the backend.
- Log data is mocked for MVP; real-time WebSocket log streaming will be added in a future phase.
- The "Duplicate" and "Download ZIP" actions in the context menu will show toast notifications for MVP (not functional backend calls).
- Project count limits and plan information are hardcoded for MVP (e.g., "5 of 10 projects, Free plan").
- The grid/list view preference is not persisted across sessions (session-only state).
- Mobile responsiveness follows standard breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px).
