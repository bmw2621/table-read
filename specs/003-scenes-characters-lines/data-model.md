# Data Model: Script Content Data Model

**Feature**: Script Content Data Model - Scenes, Characters, and Lines  
**Date**: 2025-12-12  
**Database**: PostgreSQL  
**ORM**: drizzle-orm

## Entities

### Scene

Represents a scene within a script. Scenes provide organizational structure for script content and serve as containers for dialogue lines.

**Table Name**: `scenes`

**Fields**:

- `id` (string, primary key) - Unique identifier for the scene (CUID2)
- `scriptId` (string, foreign key → scripts.id, not null) - Parent script that owns this scene
- `createdAt` (timestamp, default: now) - Scene creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:

- `scriptId` must reference a valid script
- Script must exist before creating scene
- User must have access to script before creating scene (application-level check)

**Relationships**:

- Many-to-one with `scripts` (many scenes belong to one script)
- One-to-many with `lines` (one scene contains many lines)

**State Transitions**:

- **Created**: Scene created and associated with script
- **Active**: Scene exists and can contain lines
- **Deleted**: Scene and all its lines removed (cascade behavior)

**Indexes**:

- `scriptId` - Index for fast scene queries by script (supports SC-004: <500ms for 100 scenes)
- Primary key index on `id`

**Cascade Behavior**:

- On script deletion: Cascade delete all scenes (FR-014)
- On scene deletion: Cascade delete all lines (FR-016)

---

### Character

Represents a character (persona or actor) within a script. Characters serve as speakers for dialogue lines.

**Table Name**: `characters`

**Fields**:

- `id` (string, primary key) - Unique identifier for the character (CUID2)
- `scriptId` (string, foreign key → scripts.id, not null) - Parent script that owns this character
- `createdAt` (timestamp, default: now) - Character creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:

- `scriptId` must reference a valid script
- Script must exist before creating character
- User must have access to script before creating character (application-level check)

**Relationships**:

- Many-to-one with `scripts` (many characters belong to one script)
- One-to-many with `lines` (one character speaks many lines)

**State Transitions**:

- **Created**: Character created and associated with script
- **Active**: Character exists and can have lines assigned
- **Deleted**: Character removed, lines referencing it have characterId set to null (FR-017)

**Indexes**:

- `scriptId` - Index for fast character queries by script (supports SC-005: <500ms for 50 characters)
- Primary key index on `id`

**Cascade Behavior**:

- On script deletion: Cascade delete all characters (FR-015)
- On character deletion: Set characterId to null for all lines (FR-017, handled via foreign key constraint)

---

### Line

Represents a single line of dialogue in a script. Each line is associated with a character (speaker) and belongs to a scene.

**Table Name**: `lines`

**Fields**:

- `id` (string, primary key) - Unique identifier for the line (CUID2)
- `text` (text, not null) - The dialogue text content (FR-010)
- `characterId` (string, foreign key → characters.id, nullable) - Character who speaks this line (FR-009, optional)
- `sceneId` (string, foreign key → scenes.id, not null) - Scene that contains this line (FR-007)
- `createdAt` (timestamp, default: now) - Line creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:

- `text` is required and cannot be empty (FR-010)
- `characterId` is optional - if provided, must reference a valid character
- `sceneId` must reference a valid scene
- When `characterId` is provided, character and scene must belong to the same script (FR-012, FR-013) - application-level check
- Scene must exist before creating line
- If `characterId` is provided, character must exist before creating line
- User must have access to parent script before creating line (application-level check)

**Relationships**:

- Many-to-one with `characters` (many lines spoken by one character)
- Many-to-one with `scenes` (many lines belong to one scene)

**State Transitions**:

- **Created**: Line created with text and scene association, optionally with character association
- **Active**: Line exists and is part of scene dialogue
- **Deleted**: Line removed (manually or via cascade on scene deletion)
- **Character Removed**: When character is deleted, line's characterId is set to null (FR-017)

**Indexes**:

- `sceneId` - Index for fast line queries by scene (supports SC-006: <1s for 500 lines, SC-012: up to 1000 lines per scene)
- `characterId` - Index for fast line queries by character (supports FR-021: query all lines for a character)
- Consider composite index on `(sceneId, characterId)` if query patterns require filtering by both

**Cascade Behavior**:

- On scene deletion: Cascade delete all lines (FR-016)
- On character deletion: Set characterId to null for all lines (FR-017, set null behavior)

---

## Schema Relationships

```
scripts (1) ──< (many) scenes
scripts (1) ──< (many) characters
scenes (1) ──< (many) lines
characters (1) ──< (many) lines
```

**Extended from existing schema**:

```
users (1) ──< (many) scripts
troupes (1) ──< (many) scripts
```

---

## Data Integrity Constraints

### Foreign Key Constraints

- `scenes.scriptId` → `scripts.id` (on delete: cascade - delete scenes when script deleted)
- `characters.scriptId` → `scripts.id` (on delete: cascade - delete characters when script deleted)
- `lines.characterId` → `characters.id` (on delete: set null - set characterId to null when character deleted)
- `lines.sceneId` → `scenes.id` (on delete: cascade - delete lines when scene deleted)

### Unique Constraints

None required - duplicates are allowed (e.g., multiple empty scenes, multiple characters with same name, multiple identical lines)

### Check Constraints (Application-Level)

- `lines`: When characterId is provided, character and scene must belong to the same script (FR-012, FR-013)
- `scenes`: User must have access to script before creating scene
- `characters`: User must have access to script before creating character
- `lines`: User must have access to script before creating line

**Note**: Cross-entity validation (lines referencing character/scene from same script when characterId is provided) cannot be enforced at database level, so application-level validation is required.

---

## Indexes Summary

**Performance Optimizations**:

- `scenes.scriptId` - Fast scene queries for a script (supports SC-004: <500ms for 100 scenes, SC-010: up to 200 scenes)
- `characters.scriptId` - Fast character queries for a script (supports SC-005: <500ms for 50 characters, SC-011: up to 100 characters)
- `lines.sceneId` - Fast line queries for a scene (supports SC-006: <1s for 500 lines, SC-012: up to 1000 lines per scene)
- `lines.characterId` - Fast line queries for a character (supports FR-021: query all lines for a character)

**Query Optimization Notes**:

- Scene/character queries will join with `scripts` for access control checks
- Line queries will join with `scenes` and `characters` for validation and display
- Consider composite indexes if query patterns show performance issues (e.g., filtering lines by scene AND character)

---

## Security Considerations

1. **Access Control**: Scene/character/line access inherits from script access - if user can access script, they can access its scenes/characters/lines
2. **Input Validation**: All inputs validated via Zod schemas
3. **SQL Injection**: Prevented via drizzle-orm parameterized queries
4. **Data Validation**: Application-layer validation before database operations (character/scene same script check)
5. **Audit Trail**: `createdAt` and `updatedAt` timestamps for all entities
6. **Referential Integrity**: Foreign key constraints prevent orphaned records

---

## Migration Strategy

1. Create `scenes` table with `scriptId` foreign key and cascade delete
2. Create `characters` table with `scriptId` foreign key and cascade delete
3. Create `lines` table with nullable `characterId` and `sceneId` foreign keys (characterId set null on delete, sceneId cascade delete)
4. Add indexes for performance (`scriptId` on scenes/characters, `sceneId`/`characterId` on lines)
5. Use drizzle-kit for migration generation and management
6. Test migrations on development database before production

---

## Edge Cases Handled

1. **Cascade Deletion**: Script deletion removes all scenes/characters/lines (FR-014, FR-015, FR-016). Character deletion sets characterId to null for all lines (FR-017)
2. **Cross-Script References**: Prevented by application-level validation (FR-012, FR-013)
3. **Empty Scenes/Characters**: Allowed - scenes can exist without lines, characters can exist without lines
4. **Duplicate Scenes/Characters**: Allowed - scripts can have multiple scenes/characters with same attributes
5. **Long Line Text**: PostgreSQL `text` type supports unlimited length
6. **Orphaned Lines**: Prevented by foreign key constraints - lines must have valid scene, characterId can be null
7. **Lines Without Characters**: Allowed - lines can exist without character association (characterId is nullable)
8. **Access Control Inheritance**: Scenes/characters/lines inherit access from parent script

---

## Future Considerations

- Scene attributes beyond identifier (title, description, location, etc.)
- Character attributes beyond identifier (name, description, role, etc.)
- Line attributes beyond text (stage directions, formatting, etc.)
- Line ordering/sequencing within scenes
- Scene ordering/sequencing within scripts
- Character ordering/sequencing within scripts
- Batch operations for creating multiple scenes/characters/lines
- Search/filter functionality for scenes/characters/lines
- Soft deletes for audit trail
- Version history for script content
