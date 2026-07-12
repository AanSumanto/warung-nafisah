# Persistence Framework — Database Architecture

**Document ID:** WN-DB-PERSIST-001  
**Version:** 0.8.0  
**Date:** 2026-07-11  
**Sprint:** 3B

---

## 1. Architecture Diagram

```mermaid
graph TB
  subgraph Presentation
    API[Express Routes]
  end

  subgraph Application
    UC[Use Cases / Handlers]
    FIL[Filter / Sort / Pagination]
  end

  subgraph Domain
    ENT[Entity / AggregateRoot]
    VO[Value Objects]
    SPEC[ISpecification]
  end

  subgraph Core
    IREPO[IRepository]
    IUOW[IUnitOfWork]
    ITXN[ITransaction]
  end

  subgraph Infrastructure
  subgraph Database
    CONN[MongoConnectionManager]
    SESS[MongoSessionManager]
    TXN[MongoTransactionManager]
    IDX[MongoIndexManager]
    HEALTH[MongoHealthChecker]
  end
  subgraph Persistence
    REPO[MongoRepository]
    MAP[MongoMapper]
    EVAL[MongoSpecificationEvaluator]
    QRY[Query Builders]
  end
  end

  API --> UC
  UC --> IREPO
  UC --> IUOW
  IREPO -.-> REPO
  IUOW -.-> TXN
  REPO --> MAP
  REPO --> EVAL
  REPO --> QRY
  MAP --> ENT
  EVAL --> FIL
  REPO --> CONN
  TXN --> SESS
  SESS --> CONN
```

---

## 2. Repository Flow

```mermaid
sequenceDiagram
  participant UC as Use Case
  participant R as MongoRepository
  participant M as MongoMapper
  participant DB as Mongoose Model

  UC->>R: findById(id)
  R->>DB: findOne({ _id })
  DB-->>R: document
  R->>M: toDomain(document)
  M-->>R: entity
  R-->>UC: entity | null

  UC->>R: save(entity)
  R->>M: toDocument(entity)
  M-->>R: document
  R->>DB: findByIdAndUpdate(upsert)
  DB-->>R: saved document
  R->>M: toDomain(saved)
  R-->>UC: entity
```

---

## 3. Transaction Flow

```mermaid
sequenceDiagram
  participant UC as Use Case
  participant UOW as MongoUnitOfWork
  participant TXN as MongoTransactionManager
  participant SESS as MongoSession
  participant R as MongoRepository

  UC->>UOW: execute(work)
  UOW->>TXN: begin()
  TXN->>SESS: startSession + startTransaction
  UOW->>R: save(entity) [with session]
  R->>SESS: findByIdAndUpdate(session)
  UOW->>TXN: commit()
  TXN->>SESS: commitTransaction
  alt Error
    UOW->>TXN: rollback()
    TXN->>SESS: abortTransaction
  end
```

---

## 4. Mapper Flow

```mermaid
flowchart LR
  E[Domain Entity] -->|toDocument| D[Mongo Document]
  D -->|Mongoose| DB[(MongoDB)]
  DB -->|lean/query| D2[Document]
  D2 -->|toDomain| E2[Domain Entity]
```

**Rules:**
- Mapper is injected per aggregate — no global mapping
- Domain types never import mongoose
- Documents live in infrastructure layer only

---

## 5. Unit Of Work Flow

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Active: begin() / execute()
  Active --> Committed: commit()
  Active --> RolledBack: rollback() / error
  Committed --> [*]
  RolledBack --> [*]
```

`MongoUnitOfWork.execute()` wraps work in begin → commit/rollback with session propagation to repositories.

---

## 6. Specification Flow

```mermaid
flowchart TD
  S[ISpecification] -->|toFilterGroup| FG[FilterGroup]
  FG --> FB[MongoFilterBuilder]
  FB --> MQ[MongoDB Query]
  MQ --> R[MongoRepository.findAll]
```

`FilterSpecification` bridges Sprint 2 `FilterObject` to `ISpecification` for MongoDB queries.

---

## 7. Dependency Graph

```mermaid
graph BT
  DOMAIN[domain/] 
  APP[application/]
  CORE[core/persistence/ interfaces]
  INFRA_DB[infrastructure/database/]
  INFRA_P[infrastructure/persistence/]
  CONFIG[config/database.ts]

  INFRA_P --> CORE
  INFRA_P --> APP
  INFRA_P --> INFRA_DB
  INFRA_DB --> CONFIG
  CORE --> DOMAIN
  CORE --> APP
  APP --> DOMAIN

  DOMAIN -.-x INFRA_P
  DOMAIN -.-x INFRA_DB
```

**Domain has NO dependency on MongoDB** (enforced).

---

## 8. Index Manager

| Type | Support |
|------|---------|
| Unique | `type: 'unique'` |
| Compound | multiple keys in `keys` |
| Text | text index keys |
| TTL | `expireAfterSeconds` |
| Partial | `partialFilterExpression` |

---

## 9. Base Document Hierarchy

```
BaseDocument (_id)
└── TimestampDocument (createdAt, updatedAt)
    ├── AuditDocument (+ createdBy, updatedBy)
    ├── SoftDeleteDocument (+ deletedAt, isDeleted)
    └── VersionedDocument (+ version)
```

---

## 10. Usage Pattern (Future Modules)

```typescript
class OrderRepository extends MongoRepository<Order, OrderDocument> {
  constructor(model: Model<OrderDocument>, mapper: OrderMapper, uow: MongoUnitOfWork) {
    super(model, mapper, { softDelete: true }, () => uow.getActiveSession());
  }
}
```

No business repositories created in Sprint 3B — pattern only.
