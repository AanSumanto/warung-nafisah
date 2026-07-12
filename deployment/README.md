# Deployment — Local Infrastructure

Per **ADR-001**, application services run outside Docker:

| Service     | How to run                                                     |
| ----------- | -------------------------------------------------------------- |
| Backend API | `npm run dev --workspace=@warung-nafisah/backend` (port 5000)  |
| Frontend    | `npm run dev --workspace=@warung-nafisah/frontend` (port 3000) |
| MongoDB     | Docker (this folder)                                           |
| Redis       | Docker (this folder)                                           |

## Start infrastructure

```bash
docker compose -f deployment/docker-compose.yml up -d
```

## Stop infrastructure

```bash
docker compose -f deployment/docker-compose.yml down
```

Production VPS stack will be defined in the backend repository when deployment sprint begins.
