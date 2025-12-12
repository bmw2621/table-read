# Feature Specification: Troupe and Script Data Models

**Feature Branch**: `002-troupe-script-models`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: "create a data model for a \"troupe\".  users belong to a troupe and can be in multiple troupes.  create a data model for a script, for now just give the script a title, we will expand on it later.  Scripts can belong to a user or a troupe.  If it belongs to a troupe, all users in the troupe can access it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Troupes (Priority: P1)

Users can create troupes and establish membership relationships. When a user creates a troupe, they become the "director" of that troupe. The director has exclusive management permissions including approving new members, removing members, and deleting the troupe. A user can belong to multiple troupes, enabling collaboration across different groups.

**Why this priority**: This is the foundational data model that enables all troupe-based features. Without troupes, users cannot organize into groups or share resources. Director permissions ensure proper governance and control over troupe resources.

**Independent Test**: Can be fully tested by creating a troupe, verifying the creator becomes the director, and testing director permissions for member management and troupe deletion.

**Acceptance Scenarios**:

1. **Given** a user exists in the system, **When** they create a troupe, **Then** the troupe is created with the user as the director and as a member
2. **Given** a troupe exists with a director, **When** the director approves a user to join the troupe, **Then** the user-troupe membership relationship is established
3. **Given** a troupe exists with a director, **When** a non-director user attempts to approve a new member, **Then** the system prevents the action
4. **Given** a troupe exists with a director, **When** the director removes a member from the troupe, **Then** the user-troupe membership relationship is removed
5. **Given** a troupe exists with a director, **When** a non-director user attempts to remove a member, **Then** the system prevents the action
6. **Given** a troupe exists with a director, **When** the director deletes the troupe, **Then** the troupe and all its memberships are removed
7. **Given** a troupe exists with a director, **When** a non-director user attempts to delete the troupe, **Then** the system prevents the action
8. **Given** a user belongs to multiple troupes, **When** the system queries their troupes, **Then** all troupes the user belongs to are returned
9. **Given** a troupe has multiple members, **When** the system queries troupe members, **Then** all users belonging to that troupe are returned
10. **Given** a troupe exists, **When** the system queries the troupe director, **Then** it returns the user who created the troupe

---

### User Story 2 - Create Scripts with Ownership (Priority: P2)

Users can create scripts that are owned either by themselves (personal scripts) or by a troupe they belong to (shared scripts). Scripts have a title attribute that identifies them.

**Why this priority**: Scripts are the core content entity. Users need to be able to create scripts before they can be shared or accessed through troupes.

**Independent Test**: Can be fully tested by creating scripts owned by a user and scripts owned by a troupe, then verifying the ownership relationships are correctly stored.

**Acceptance Scenarios**:

1. **Given** a user exists, **When** they create a script with a title, **Then** the script is created and associated with that user
2. **Given** a user belongs to a troupe, **When** they create a script owned by that troupe, **Then** the script is created and associated with the troupe
3. **Given** a script exists, **When** the system queries its owner, **Then** it returns either the user or troupe that owns it
4. **Given** scripts exist with different owners, **When** the system queries scripts by owner, **Then** it correctly filters scripts by user or troupe ownership

---

### User Story 3 - Access Scripts Through Troupe Membership (Priority: P3)

Users can access scripts that belong to troupes they are members of. When a script belongs to a troupe, all members of that troupe have access to it.

**Why this priority**: This enables the collaborative aspect of the feature - sharing scripts through troupes. However, it depends on both troupe membership (P1) and script creation (P2) being in place.

**Independent Test**: Can be fully tested by creating a troupe, adding users to it, creating a script owned by the troupe, and verifying all troupe members can access the script.

**Acceptance Scenarios**:

1. **Given** a script belongs to a troupe, **When** a user who is a member of that troupe requests access, **Then** the system grants access to the script
2. **Given** a script belongs to a troupe, **When** a user who is not a member of that troupe requests access, **Then** the system denies access to the script
3. **Given** a user belongs to multiple troupes, **When** they request all accessible scripts, **Then** the system returns scripts they own plus scripts from all troupes they belong to
4. **Given** a user leaves a troupe, **When** they request accessible scripts, **Then** scripts from that troupe are no longer included in the results

---

### Edge Cases

- What happens when a user who owns a script is deleted? [Assumption: Script ownership should be handled - either cascade delete or transfer ownership]
- What happens when a troupe is deleted? [Assumption: Scripts owned by the troupe should be handled - either cascade delete or transfer to user ownership]
- What happens when a troupe director is deleted? [Assumption: Troupe should be handled - either cascade delete troupe or transfer directorship to another member]
- What happens when a user tries to create a script for a troupe they don't belong to? [System should prevent this]
- What happens when a script has no title? [System should require a title]
- How does the system handle a user being removed from a troupe while they have scripts open? [Access should be revoked immediately]
- What happens if a user tries to join the same troupe twice? [System should prevent duplicate memberships]
- What happens if a director tries to remove themselves from a troupe? [System should prevent this - director must delete troupe or transfer directorship first]
- What happens if a director tries to approve a user who is already a member? [System should prevent duplicate memberships]
- What happens if a non-director user tries to delete a troupe they belong to? [System should prevent this - only director can delete]

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support creating troupes with a unique identifier
- **FR-002**: System MUST designate the user who creates a troupe as the "director" of that troupe
- **FR-003**: System MUST support many-to-many relationships between users and troupes (users can belong to multiple troupes, troupes can have multiple users)
- **FR-004**: System MUST allow only the director to approve new members to join a troupe
- **FR-005**: System MUST allow only the director to remove members from a troupe
- **FR-006**: System MUST allow only the director to delete a troupe
- **FR-007**: System MUST prevent non-director users from approving, removing, or deleting troupe memberships
- **FR-008**: System MUST support creating scripts with a title attribute
- **FR-009**: System MUST support scripts being owned by either a user or a troupe (mutually exclusive ownership)
- **FR-010**: System MUST allow users to access scripts they own directly
- **FR-011**: System MUST allow users to access scripts owned by troupes they belong to
- **FR-012**: System MUST prevent users from accessing scripts owned by troupes they do not belong to
- **FR-013**: System MUST prevent duplicate memberships (a user cannot be in the same troupe twice)
- **FR-014**: System MUST require scripts to have a title
- **FR-015**: System MUST prevent users from creating scripts for troupes they do not belong to

### Key Entities *(include if feature involves data)*

- **Troupe**: Represents a group that users can belong to. Has a unique identifier and a director (the user who created the troupe). The director has exclusive permissions to manage the troupe including approving members, removing members, and deleting the troupe. Users can belong to multiple troupes through a membership relationship.
- **Script**: Represents a script document with a title. Can be owned by either a single user (personal script) or a single troupe (shared script). Ownership is mutually exclusive - a script belongs to either a user OR a troupe, not both.
- **User-Troupe Membership**: Represents the many-to-many relationship between users and troupes. Enables users to belong to multiple troupes and troupes to have multiple members. Memberships are managed by the troupe director.
- **User**: Existing entity that represents system users. Users can own scripts directly, can belong to troupes to access troupe-owned scripts, and can be directors of troupes they create.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a troupe and become the director in under 5 seconds
- **SC-002**: Users can create a script with a title in under 3 seconds
- **SC-003**: System correctly identifies all scripts accessible to a user (personal scripts plus troupe scripts) with 100% accuracy
- **SC-004**: System prevents unauthorized access to troupe scripts with 100% accuracy (users not in troupe cannot access)
- **SC-005**: System supports users belonging to at least 50 troupes simultaneously without performance degradation
- **SC-006**: System supports troupes with at least 100 members without performance degradation
- **SC-007**: Users can query their accessible scripts (personal + troupe-owned) and receive results in under 1 second for up to 1000 scripts
- **SC-008**: Directors can approve or remove troupe members in under 2 seconds
- **SC-009**: System enforces director-only permissions with 100% accuracy (non-directors cannot manage troupe memberships or delete troupes)

## Assumptions

- Users already exist in the system (from existing authentication feature)
- Script titles are required and cannot be empty
- A script can only belong to one owner at a time (either a user OR a troupe, not both)
- Troupe membership is persistent until explicitly removed by the director
- When determining script access, the system checks current troupe membership status
- Script ownership can be established at creation time and may be changeable in the future (out of scope for this feature)
- Troupes have no additional attributes beyond an identifier and director at this time (may be expanded later)
- Scripts have no additional attributes beyond a title at this time (will be expanded later as stated in requirements)
- The director role is assigned to the troupe creator and cannot be changed in this feature (directorship transfer may be added in the future)
- Only the director can approve new members - there is no self-join or invitation system in this feature
- Directors cannot remove themselves from a troupe without first deleting the troupe or transferring directorship (transfer out of scope for this feature)
