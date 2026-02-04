# Feature Specification: Users Module

**Feature Branch**: `002-users-module`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "User profile management module - profile viewing/editing, credit balance, transaction history"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View My Profile (Priority: P1)

A logged-in user wants to see their profile information including their name, email, avatar, subscription plan, and credit balance to understand their current account status.

**Why this priority**: This is the foundational user journey - users need to see their account information before they can manage it. This provides immediate value and is required for all subsequent user stories.

**Independent Test**: Can be fully tested by authenticating a user and retrieving their profile data. Delivers value by showing users their complete account overview.

**Acceptance Scenarios**:

1. **Given** a user is authenticated with a valid token, **When** they request their profile, **Then** they see their id, email, full name, avatar URL, subscription plan, credit balance, referral code, verification status, registration date, and last login time
2. **Given** a user has an expired or invalid token, **When** they request their profile, **Then** they receive an authentication error
3. **Given** a user account has been deactivated, **When** they request their profile, **Then** they receive a forbidden error indicating the account is inactive

---

### User Story 2 - Update My Profile (Priority: P2)

A logged-in user wants to update their profile details (name and avatar) to personalize their account and keep information current.

**Why this priority**: Profile editing is essential for user personalization but depends on the profile viewing capability being in place first.

**Independent Test**: Can be fully tested by updating user profile fields and verifying the changes persist. Delivers value by allowing users to personalize their accounts.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they update their full name to "John Smith", **Then** their profile reflects the new name
2. **Given** a user is authenticated, **When** they update their avatar with a valid URL, **Then** their profile shows the new avatar URL
3. **Given** a user provides an invalid avatar URL (not a valid URL format), **When** they attempt to update their profile, **Then** they receive a validation error
4. **Given** a user provides a name exceeding 255 characters, **When** they attempt to update their profile, **Then** they receive a validation error
5. **Given** a user sends an update with no fields, **When** the request is processed, **Then** the profile remains unchanged

---

### User Story 3 - View Credit Balance (Priority: P2)

A logged-in user wants to see their current credit balance, subscription plan details, and daily bonus information to understand their available resources.

**Why this priority**: Credit balance is crucial for users to understand what actions they can take within the system, but profile viewing should work first.

**Independent Test**: Can be fully tested by retrieving credit balance for an authenticated user. Delivers value by showing users their available credits and bonus information.

**Acceptance Scenarios**:

1. **Given** a user is authenticated with a "starter" plan, **When** they view their credit balance, **Then** they see current credits, plan name, daily bonus information, and rollover limit (200)
2. **Given** a user is authenticated with a "free" plan, **When** they view their credit balance, **Then** they see rollover limit as 0
3. **Given** a user has claimed today's bonus, **When** they view credit balance, **Then** daily bonus shows next available time (00:00 UTC next day)

---

### User Story 4 - View Transaction History (Priority: P3)

A logged-in user wants to view their credit transaction history to track spending and understand how their credits have been used.

**Why this priority**: Transaction history is important for transparency but is a secondary feature after users can view their basic profile and balance.

**Independent Test**: Can be fully tested by retrieving paginated transaction history for an authenticated user. Delivers value by providing transparency into credit usage.

**Acceptance Scenarios**:

1. **Given** a user has transaction history, **When** they request transactions, **Then** they see a paginated list with transaction details (id, amount, balance after, type, description, project info, timestamp)
2. **Given** a user requests transactions with pagination parameters, **When** they specify page=2 and per_page=10, **Then** they receive the second page with up to 10 transactions
3. **Given** a user requests transactions filtered by type, **When** they filter by "daily_bonus", **Then** they only see daily bonus transactions
4. **Given** a user requests per_page exceeding maximum, **When** they specify per_page=150, **Then** the system caps at 100 items per page
5. **Given** a user has no transactions, **When** they request transaction history, **Then** they receive an empty list with pagination showing total=0

---

### Edge Cases

- What happens when a user requests a non-existent page of transactions? Return empty list with correct pagination metadata
- How does the system handle concurrent profile updates? Last write wins
- What happens when user's subscription plan changes mid-session? Credit balance and rollover limit reflect current plan immediately
- How does the system handle very long full_name values? Reject with validation error (max 255 characters)
- What happens if avatar_url points to a non-image resource? Accept the URL (validation is URL format only, not content)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to retrieve their complete profile information
- **FR-002**: System MUST allow authenticated users to update their full name (max 255 characters)
- **FR-003**: System MUST allow authenticated users to update their avatar URL (must be valid URL format)
- **FR-004**: System MUST display user's current credit balance upon request
- **FR-005**: System MUST display user's subscription plan name
- **FR-006**: System MUST display rollover limit based on user's plan (0 for free, 200 for starter, 600 for pro, 2000 for business)
- **FR-007**: System MUST display daily bonus information including amount (1 for free, 3 for starter, 5 for pro, 10 for business) and next available time
- **FR-008**: System MUST provide paginated credit transaction history
- **FR-009**: System MUST support pagination parameters (page, per_page with max 100)
- **FR-010**: System MUST support filtering transactions by transaction type
- **FR-011**: System MUST return 401 Unauthorized for requests without valid authentication
- **FR-012**: System MUST return 403 Forbidden for inactive user accounts
- **FR-013**: System MUST return 400 Bad Request for invalid input data (URL format, field length)
- **FR-014**: System MUST return 422 Unprocessable Entity for validation errors with detailed error messages in format: `{"detail": [{"loc": ["field"], "msg": "error message", "type": "error_type"}]}`
- **FR-015**: System MUST support partial profile updates (update only name OR only avatar in single request)
- **FR-016**: System MUST allow clearing optional profile fields by sending null values
- **FR-017**: System MUST return 422 for invalid transaction type filter parameter with list of valid types

### Non-Functional Requirements

- **NFR-001**: Avatar URL MUST be validated as valid HTTP/HTTPS URL format (scheme + host required)
- **NFR-002**: Pagination defaults: page=1, per_page=20
- **NFR-003**: All API responses MUST complete within 1 second under normal load (<100 concurrent users)
- **NFR-004**: Transaction history MUST support up to 10,000 records with response time <3 seconds

### Key Entities

- **User Profile**: Represents the user's public information - id, email, full name, avatar URL, plan, credits, referral code, verification status, timestamps
- **Credit Balance**: User's current credits with plan-specific rollover limit and daily bonus information
- **Credit Transaction**: Individual credit change record - amount, resulting balance, type (generation, daily_bonus, purchase, referral, adjustment), optional project reference, timestamp

### Transaction Types

| Type | Description | Amount |
|------|-------------|--------|
| generation | Credits spent on AI generation | Negative |
| daily_bonus | Daily login bonus | Positive |
| purchase | Credits purchased | Positive |
| referral | Referral bonus | Positive |
| adjustment | Manual admin adjustment | +/- |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their complete profile within 1 second of request
- **SC-002**: Profile updates are reflected in subsequent profile views within 100ms (same request cycle)
- **SC-003**: 100% of profile update requests with valid data succeed
- **SC-004**: 100% of profile update requests with invalid data return appropriate error messages
- **SC-005**: Credit balance displays accurate information including current credits, plan, and rollover limit
- **SC-006**: Transaction history returns within 2 seconds for users with up to 1000 transactions
- **SC-007**: All endpoints correctly reject unauthenticated requests (100% accuracy)
- **SC-008**: Pagination correctly handles edge cases (empty pages, max per_page exceeded)
- **SC-009**: Test coverage exceeds 90% for all module code

## Security Considerations

- **SEC-001**: All endpoints require valid JWT authentication (handled by Auth module middleware)
- **SEC-002**: Users can only access/modify their own profile data (no cross-user access)
- **SEC-003**: Email field is read-only (cannot be changed via profile update)
- **SEC-004**: Sensitive fields (password_hash) are never exposed in API responses

## Assumptions

- The Auth module is already implemented and provides JWT authentication middleware
- The User database model exists from the Auth module with required fields (id, email, full_name, avatar_url, plan, credits, referral_code, is_verified, is_active, created_at, last_login_at)
- Credit transactions are stored in a separate table with foreign key to users
- Daily bonus calculation logic exists or will be coordinated with the Credits module
- All timestamps are stored and returned in UTC
- Avatar URL validation checks URL format only, not image content accessibility
