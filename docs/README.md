# Viably documentation

Public-safe documentation index for the Viably platform.

## Start here

- `ARCHITECTURE.md` - system architecture
- `API.md` - API endpoints and examples
- `DATABASE.md` - database schema
- `DEPLOYMENT.md` - deployment notes
- `pricing-model.md` - credit model and billing logic

## Local development

```bash
git clone https://github.com/viably-labs/viably.git
cd viably
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
make dev
```

## Public safety

Documentation must use placeholders only. Production secrets, live hostnames, private deployment commands and customer data belong in private runbooks or server-local secret stores.
