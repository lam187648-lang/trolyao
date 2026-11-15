# Backup and restore

## Browser data (available now)

1. Open `data-backup.html` from the same site/origin as the app.
2. Select **Tải bản sao lưu** and store the downloaded JSON in a private, preferably encrypted location.
3. Keep the original file unchanged until the restored data has been checked.
4. To restore on another browser profile or origin, open that origin's `data-backup.html`, choose **Khôi phục khóa còn thiếu**, and select the backup.
5. Check the displayed restored/skipped counts and verify the needed features manually.

The tool reads only the current origin's `localStorage` and `sessionStorage`. It does not upload data. Restore adds only keys that do not already exist; it does not overwrite or delete existing values. If a browser storage write fails, it attempts to roll back keys added during that restore. This is a browser-level recovery aid, not a database migration, and does not cover IndexedDB, cookies, or data on another device.

Browser backups may contain usernames, old password hashes, tokens, chat data, and game progress. Do not commit the file, attach it to an issue, or send it through chat. The application still relies on local browser storage for some account and game features; exporting a backup does not make those features server-synchronized.

## PostgreSQL backup and restore (future use only)

There is currently no PostgreSQL integration and no production `DATABASE_URL` consumed by this code. Do not run these commands against an unrelated database. Once PostgreSQL is implemented and a database is configured, use a PostgreSQL client installation and set `DATABASE_URL` through a secure local environment mechanism.

Create a custom-format backup:

```powershell
pg_dump --format=custom --no-owner --file .\trolyao-backup.dump "$env:DATABASE_URL"
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed; keep the source database unchanged." }
pg_restore --list .\trolyao-backup.dump
```

Restore into a **new, empty database** first. Set `RESTORE_DATABASE_URL` to that separate target; do not use `--clean` or point it at the production database:

```powershell
pg_restore --no-owner --dbname "$env:RESTORE_DATABASE_URL" .\trolyao-backup.dump
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed; retain both the backup and original database." }
```

Before any future migration, preserve the original database and browser backup. Validate row counts and representative account/game records in the restored target before switching traffic. Keep backups private and encrypted at rest. A tested migration and rollback procedure still needs to be implemented alongside the PostgreSQL integration.

