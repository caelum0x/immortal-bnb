# Disaster Recovery Procedures

This document outlines procedures for recovering from various disaster scenarios.

## Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 1 hour (last backup)

## Disaster Scenarios

### 1. Database Failure

**Symptoms:**
- Database connection errors
- API returning 500 errors
- Health check failing

**Recovery Steps:**

1. **Identify the issue:**
   ```bash
   # Check database connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Restore from backup:**
   ```bash
   # Find latest backup
   LATEST_BACKUP=$(ls -t backups/db_backup_*.sql.gz | head -1)
   
   # Restore
   ./scripts/restore.sh $LATEST_BACKUP
   ```

3. **Verify restoration:**
   ```bash
   # Check database
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Trade\""
   ```

4. **Restart services:**
   ```bash
   docker-compose restart backend
   ```

### 2. Complete Server Failure

**Recovery Steps:**

1. **Provision new server**
2. **Restore database:**
   ```bash
   ./scripts/restore.sh <backup_file>
   ```
3. **Restore configuration:**
   - Copy `.env` file
   - Restore SSL certificates
   - Restore API keys
4. **Deploy application:**
   ```bash
   docker-compose up -d
   ```
5. **Verify health:**
   ```bash
   curl http://localhost:3001/health
   ```

### 3. Data Corruption

**Recovery Steps:**

1. **Stop services:**
   ```bash
   docker-compose stop
   ```

2. **Restore from backup:**
   ```bash
   ./scripts/restore.sh <backup_file>
   ```

3. **Verify data integrity:**
   ```bash
   # Run data validation queries
   bun run scripts/validate-data.ts
   ```

4. **Restart services**

### 4. Security Breach

**Recovery Steps:**

1. **Immediately:**
   - Rotate all API keys
   - Revoke compromised credentials
   - Enable emergency pause

2. **Investigate:**
   - Review logs
   - Identify breach scope
   - Check for unauthorized transactions

3. **Remediate:**
   - Patch vulnerabilities
   - Update security configurations
   - Restore from clean backup if needed

4. **Resume operations:**
   - Only after security audit
   - With new credentials
   - Enhanced monitoring

## Backup Verification

### Daily Backup Check

```bash
# Verify latest backup exists and is valid
LATEST=$(ls -t backups/db_backup_*.sql.gz | head -1)
if [ -f "$LATEST" ]; then
  echo "✅ Latest backup: $LATEST"
  echo "   Size: $(du -h $LATEST | cut -f1)"
  echo "   Age: $(find $LATEST -printf '%Td days ago')"
else
  echo "❌ No backup found!"
fi
```

### Test Restore Procedure

**Monthly test restore:**

1. Create test database
2. Restore backup to test database
3. Verify data integrity
4. Document results

## Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Infrastructure Team**: [Contact Info]

## Post-Recovery Checklist

- [ ] Verify all services are running
- [ ] Check health endpoints
- [ ] Verify database integrity
- [ ] Check recent trades/logs
- [ ] Monitor for 24 hours
- [ ] Document incident
- [ ] Update runbooks if needed

