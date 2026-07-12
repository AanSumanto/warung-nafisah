# Sprint 2 — Core Domain Framework Implementation

**Document ID:** WN-IMPL-S2-001  
**Version:** 0.6.0  
**Date:** 2026-07-11  
**Status:** Complete — Awaiting Approval

---

## 1. Objective

Build reusable Core Domain Framework as foundation for all ERP modules.

**In scope:** DDD domain layer, application layer (CQRS), persistence contracts, shared types.  
**Out of scope:** Business modules, database implementations, Event Engine, Auth, BullMQ workers.

---

## 2. Deliverables

### Domain Layer (`src/domain/`)

| Component | Path | Alias | Status |
|-----------|------|-------|--------|
| Entity | `base/BaseEntity.ts` | `Entity` | ✅ |
| AggregateRoot | `base/AggregateRoot.ts` | — | ✅ |
| ValueObject | `base/ValueObject.ts` | — | ✅ |
| Identifier | `common/Identifier.ts` | — | ✅ |
| Result\<T\> | `common/Result.ts` | — | ✅ |
| Either | `common/Either.ts` | — | ✅ |
| BusinessRule | `common/BusinessRule.ts` | — | ✅ |
| DomainError | `errors/DomainError.ts` | — | ✅ |
| DomainException | `errors/DomainException.ts` | — | ✅ |
| Money | `value-objects/Money.ts` | — | ✅ |
| DateTime | `value-objects/DateTime.ts` | — | ✅ |
| DomainEvent | `events/IDomainEvent.ts` | `DomainEvent` | ✅ interface only |

### Application Layer (`src/application/`)

| Component | Path | Status |
|-----------|------|--------|
| BaseUseCase (+ Command/Query/Result variants) | `common/BaseUseCase.ts` | ✅ |
| ICommand | `commands/ICommand.ts` | ✅ |
| ICommandHandler | `commands/ICommandHandler.ts` | ✅ |
| IQuery | `queries/IQuery.ts` | ✅ |
| IQueryHandler | `queries/IQueryHandler.ts` | ✅ |
| BaseDTO | `common/BaseDTO.ts` | ✅ |
| BaseMapper | `common/BaseMapper.ts` | ✅ |
| Pagination | `common/Pagination.ts` | ✅ |
| CursorPagination | `common/CursorPagination.ts` | ✅ |
| Filter | `common/Filter.ts` | ✅ |
| Sort | `common/Sort.ts` | ✅ |

### Core Persistence (`src/core/persistence/`)

| Component | Path | Alias | Status |
|-----------|------|-------|--------|
| IRepository | `IBaseRepository.ts` | `IRepository` | ✅ |
| RepositoryContract | `RepositoryContract.ts` | — | ✅ |
| ISpecification | `Specification.ts` | — | ✅ |
| IUnitOfWork | `IUnitOfWork.ts` | — | ✅ |
| ITransaction | `ITransaction.ts` | — | ✅ |

### Shared (`src/shared/`)

| Component | Path | Alias | Status |
|-----------|------|-------|--------|
| ApiResponse | `http/GenericResponse.ts` | `ApiResponse` | ✅ |
| PageResult | `http/GenericPage.ts` | `PageResult` | ✅ |
| Metadata | `http/GenericMetadata.ts` | `Metadata` | ✅ |
| Common Types | `types/common.ts` | — | ✅ |
| Generic Utilities | `utils/index.ts` | — | ✅ |

---

## 3. Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| Clean Architecture | Domain has zero infrastructure imports |
| DDD | Entity, Aggregate, Value Object, Specification, Domain Events |
| CQRS | ICommand/IQuery + handlers, BaseUseCase variants |
| SOLID | Interface segregation (IRead/IWrite repository), dependency inversion |
| Type Safety | Strict TypeScript, branded Identifier, Result/Either |
| Reusability | Generic pagination, filter, sort, specification composites |

---

## 4. Excluded (By Design)

Mongo Repository, Redis Repository, Event Store, Event Bus, BullMQ Queue, Authentication, User, Organization, Inventory, Purchase, POS, Recipe, Finance, Kitchen.

---

## 5. Testing

| Suite | Tests |
|-------|-------|
| Result\<T\> | 7 |
| Either | 5 |
| Money | 9 |
| ValueObject | 5 |
| BaseEntity (Entity) | 3 |
| AggregateRoot | 3 |
| Sprint 1 regression (incl. Redis hotfix) | 24 |
| **Total** | **56** |

---

## 6. Self-Review

| Check | Result |
|-------|--------|
| Framework usable by future modules without major changes | ✅ |
| No business logic | ✅ |
| No infrastructure implementations | ✅ |
| Barrel exports (`domain/`, `application/`, `core/framework/`, `shared/`) | ✅ |
| Build PASS | ✅ |
| Tests PASS | ✅ 56/56 |

---

**STOP — Awaiting approval before Sprint 3.**
