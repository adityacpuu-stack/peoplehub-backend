# Architecture Decision Records

## Format
Each decision follows: **Context -> Decision -> Consequences**

---

### ADR-001: Express 5 + TypeScript
**Date:** Project inception
**Context:** Need a backend framework for HRIS with strong typing.
**Decision:** Express 5 with TypeScript, CommonJS modules.
**Consequences:** Good ecosystem, mature, but Express 5 still evolving. Using `ts-node` for dev, `tsc` for build.

---

### ADR-002: Prisma as ORM
**Date:** Project inception
**Context:** Need type-safe database access with PostgreSQL.
**Decision:** Prisma 5 with auto-generated client.
**Consequences:** Excellent DX and type safety. Schema-first approach. Migration support built-in.

---

### ADR-003: Zod for Validation
**Date:** Project inception
**Context:** Need request validation that integrates with TypeScript.
**Decision:** Zod 4 schemas with custom validate middleware.
**Consequences:** Type inference from schemas, reusable validators. Schemas defined in `src/validations/`.

---

### ADR-004: Typed Error Classes + asyncHandler
**Date:** 2026-02-22
**Context:** Controllers had repetitive try-catch blocks with fragile string-based error status mapping (`error.message.includes('not found') ? 404 : 500`). Error classes and asyncHandler already existed but weren't used.
**Decision:** Refactor to use `asyncHandler` wrapper + typed error classes (`NotFoundError`, `ForbiddenError`, `ConflictError`, etc.) thrown from services.
**Consequences:**
- Controllers reduced to ~5 lines each (vs 15-20 before)
- Consistent error response format across all endpoints
- No more string matching for error status codes
- Employee module refactored as reference; other modules to follow

---

### ADR-005: Multi-Company with Role-Based Scoping
**Date:** Project inception
**Context:** PFI Group has multiple subsidiaries. HR staff may manage multiple companies.
**Decision:** Company scoping built into auth context (`accessibleCompanyIds`). HR Staff assignments tracked in dedicated table.
**Consequences:** Every service must check company access. Super Admin and Tax roles bypass checks.

---

### ADR-006: Soft Delete Strategy
**Date:** Project inception
**Context:** Need to preserve historical data while allowing "deletion."
**Decision:** Mixed approach — some models use `deleted_at` timestamp, Employee uses `employment_status = 'terminated'`.
**Consequences:** All queries must filter soft-deleted records. Not perfectly consistent but matches business logic per entity.

---

*Add new decisions above this line.*
