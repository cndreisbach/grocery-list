## ADDED Requirements

### Requirement: Owner can delete a list
The system SHALL allow the owner of a list to permanently delete it, including all its items and memberships. Non-owners SHALL NOT have access to the delete action.

#### Scenario: Owner deletes a list from the dashboard
- **WHEN** a list owner clicks the delete button on a list row in the dashboard
- **THEN** an inline confirmation prompt replaces the row, asking the owner to confirm or cancel

#### Scenario: Owner confirms deletion
- **WHEN** the owner confirms deletion in the inline prompt
- **THEN** the system permanently deletes the list and all its items and memberships, and the list is removed from the dashboard

#### Scenario: Owner cancels deletion
- **WHEN** the owner clicks Cancel in the inline confirmation prompt
- **THEN** the list row is restored and no deletion occurs

#### Scenario: Non-owner cannot delete a list
- **WHEN** a member (non-owner) views the dashboard
- **THEN** no delete button is shown for lists where their role is not owner

#### Scenario: Backend rejects delete from non-owner
- **WHEN** a DELETE request is made to `/api/lists/:id` by a user who is not the list owner
- **THEN** the system returns 403 Forbidden

### Requirement: Active viewers are notified when a list is deleted
The system SHALL notify users currently viewing a deleted list via SSE so they see a coherent not-found state.

#### Scenario: Member is viewing the list when it is deleted
- **WHEN** the owner deletes a list while another member has it open in their browser
- **THEN** the member's client receives a `list_deleted` SSE event, invalidates the list query, and the page transitions to the existing "List not found" error state
