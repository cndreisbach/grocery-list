## ADDED Requirements

### Requirement: Request login OTP
The system SHALL allow any visitor to initiate login by submitting their email address. The system SHALL create a user record if one does not exist, generate a 6-digit OTP code valid for 10 minutes, and send it to the submitted email.

#### Scenario: Valid email submitted
- **WHEN** a visitor submits a valid email address on the login page
- **THEN** the system creates a user if none exists, sends a 6-digit OTP to that email, and shows the code-entry step

#### Scenario: Existing user submits email
- **WHEN** a returning user submits their email
- **THEN** the system sends a fresh OTP without creating a duplicate user

#### Scenario: Invalid email rejected
- **WHEN** a visitor submits a malformed email address
- **THEN** no OTP is sent and an inline validation error is displayed

#### Scenario: Rate limit enforced
- **WHEN** more than 3 OTP requests are made for the same email within 10 minutes
- **THEN** subsequent requests are rejected with an error and no email is sent

### Requirement: Verify OTP and create session
The system SHALL verify a submitted 6-digit code against the stored OTP for the user. On success it SHALL create a session valid for 1 year, set it as an HttpOnly cookie, mark the OTP as used, and redirect to the dashboard.

#### Scenario: Correct code submitted
- **WHEN** a user submits the correct 6-digit code within its 10-minute window
- **THEN** the system creates a session token, sets a `session` HttpOnly SameSite=Strict cookie with a 1-year expiry, marks the OTP used, and redirects to the dashboard

#### Scenario: Incorrect code submitted
- **WHEN** a user submits an incorrect code
- **THEN** the session is not created, the OTP is not consumed, and an error is shown

#### Scenario: Expired code submitted
- **WHEN** a user submits a code after its 10-minute TTL has elapsed
- **THEN** the session is not created and an expiry error is shown

#### Scenario: Already-used code rejected
- **WHEN** a user submits a code that has already been used
- **THEN** the session is not created and an error is shown

#### Scenario: Max attempts enforced
- **WHEN** a user submits 5 incorrect codes for the same OTP
- **THEN** the OTP is invalidated and further attempts are rejected

### Requirement: Session authentication
The system SHALL authenticate all protected API requests by reading the `session` cookie and resolving it to a user. Requests with a missing or invalid session SHALL receive a 401 response.

#### Scenario: Valid session cookie present
- **WHEN** a request arrives with a valid `session` cookie
- **THEN** the request proceeds with the resolved user identity

#### Scenario: Missing or invalid session cookie
- **WHEN** a request arrives with no cookie or an unrecognised token
- **THEN** the system returns 401 Unauthorized

### Requirement: Logout
The system SHALL allow an authenticated user to log out, which deletes the session record and clears the cookie.

#### Scenario: User logs out
- **WHEN** an authenticated user triggers logout
- **THEN** the session is deleted from the database, the cookie is cleared, and the user is redirected to the login page
