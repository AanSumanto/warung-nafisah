.PHONY: help install verify format lint scaffold dev build test infra-up infra-down compose-config clean

help:
	@echo "Warung Nafisah ERP — Makefile"
	@echo ""
	@echo "  make install         npm install"
	@echo "  make verify          Full repository verification"
	@echo "  make build           Build backend + frontend"
	@echo "  make test            Run all workspace tests"
	@echo "  make format          Run Prettier"
	@echo "  make lint            ESLint on scripts/"
	@echo "  make scaffold        Regenerate folder skeleton"
	@echo "  make dev             Show dev server commands"
	@echo "  make infra-up        Start MongoDB + Redis (deployment/)"
	@echo "  make infra-down      Stop infrastructure"
	@echo "  make compose-config  Validate deployment/docker-compose.yml"

install:
	npm install

verify:
	npm run verify:repo

build:
	npm run build

test:
	npm run test

format:
	npm run format

lint:
	npm run lint

scaffold:
	npm run scaffold

dev:
	npm run dev

infra-up:
	docker compose -f deployment/docker-compose.yml up -d

infra-down:
	docker compose -f deployment/docker-compose.yml down

compose-config:
	docker compose -f deployment/docker-compose.yml config

clean:
	rm -rf node_modules backend/node_modules frontend/node_modules backend/dist frontend/.next
