# Database Backup & Recovery

## Automatic Backups (Railway Managed PostgreSQL)

Railway's managed PostgreSQL service includes automatic backups:

- **Frequency**: Daily
- **Retention**: 7 days (configurable in Railway Pro plan)
- **Type**: Point-in-time recovery (PITR)
- **Storage**: Managed by Railway, no additional cost on paid plans

### Verify Backups

1. Go to Railway Dashboard → PostgreSQL service
2. Navigate to the "Backups" tab
3. Confirm daily backup entries with timestamps

## Pre-Deployment Manual Backup

Before major deployments or database migrations:

1. Go to Railway Dashboard → PostgreSQL service
2. Click "Create Backup" (manual snapshot)
3. Wait for backup to complete
4. Proceed with deployment

## Restore Procedure

### From Railway Dashboard

1. Go to Railway → PostgreSQL service → Backups
2. Select the backup point to restore from
3. Click "Restore"
4. Confirm the restore operation
5. Wait for restore to complete (time depends on database size)

### Verify After Restore

1. Check `https://api.viably.dev/health` returns `{"status": "healthy", "database": "ok"}`
2. Verify key data integrity (user accounts, projects, credit balances)
3. Monitor Sentry for any new errors

## Backup Failure Alerting

Railway sends email notifications for:
- Failed backup attempts
- Database service issues
- Storage capacity warnings

Ensure team email addresses are configured in Railway project settings → Notifications.

## Data Recovery Scenarios

| Scenario | Action |
|----------|--------|
| Accidental data deletion | Restore from most recent backup |
| Failed migration | Restore from pre-migration backup |
| Data corruption | Restore from last known good backup |
| Full disaster | Restore from backup + redeploy services |

## Best Practices

1. Always create manual backup before running Alembic migrations
2. Test restore procedure quarterly in a non-production environment
3. Verify backup exists after every migration
4. Keep Railway notifications enabled for the team
