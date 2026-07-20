# Operations Runbook — Skarion-VETRO

## Deployment

### Prerequisites
- Node.js >= 20
- Neon PostgreSQL database with PostGIS
- Cloudflare Workers account (for worker sidecar)
- Vercel account (recommended) or Node.js server

### Environment variables (production)
```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<32+ byte random hex string>
NEXT_PUBLIC_APP_URL=https://your-domain.com
R2_ACCOUNT_ID=<Cloudflare R2 account>
R2_ACCESS_KEY=<R2 access key>
R2_SECRET_KEY=<R2 secret key>
R2_BUCKET=<R2 bucket name>
WORKER_ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

### Deploy Next.js (Vercel)
```bash
vercel --prod
```

### Deploy Worker
```bash
cd services/worker
npm run deploy
```

### Database migrations
```bash
DATABASE_URL=postgresql://... npx drizzle-kit push
```

Apply migrations in order: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008

### Post-deployment smoke test
```bash
# Health check
curl https://your-domain.com/api/health/live

# Login test
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@skarion.com","password":"dev"}'

# Curriculum page (public)
curl https://your-domain.com/curriculum
```

## Backup

### Database
```bash
# Export full database
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql

# Export schema only
pg_dump --schema-only "$DATABASE_URL" > schema-$(date +%Y%m%d).sql
```

### Object storage (R2)
```bash
# Sync R2 bucket to local
aws s3 sync s3://$R2_BUCKET ./r2-backup/ --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
```

### Restore
```bash
# Restore database
psql "$DATABASE_URL" < backup-20260720.sql

# Verify restore
psql "$DATABASE_URL" -c "SELECT count(*) FROM organizations; SELECT count(*) FROM users;"
```

## Monitoring

### Health endpoints
- `GET /api/health/live` — basic liveness (returns 200)
- `GET /api/health/ready` — readiness (checks database connectivity)

### Key metrics
- Test count floor: 227 (in `tests/.test-floor`)
- Build time budget: < 30s
- API P95 latency budget: < 500ms
- Database connection pool: monitor Neon dashboard

### Alert conditions
- Health check fails 3 consecutive times
- Test floor drops below 227
- Build fails in CI
- Database connection errors in logs

## Incident response

### Service down
1. Check Vercel deployment status
2. Check Neon database status
3. Verify environment variables
4. Check `npm run verify` locally
5. Roll back to last known good deployment

### Data corruption
1. Stop writes (set maintenance mode)
2. Restore from latest backup
3. Replay any transaction logs
4. Verify data integrity
5. Resume service

### Security incident
1. Rotate JWT_SECRET immediately
2. Revoke all active sessions
3. Audit auth_sessions table for anomalies
4. Check audit_log for unauthorized access
5. Rotate all service credentials
6. Deploy security patches

## Known limitations
- Vector tile service not yet implemented (parcels/addresses loaded as GeoJSON)
- No background import worker (imports process synchronously)
- No DXF/CAD export
- No certificate verification
- Accessibility: keyboard map alternatives not fully implemented
- Rate limiting is in-memory only (not distributed)
