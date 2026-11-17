@echo off
cd "%~dp0"
echo Checking PostgreSQL...
sc query postgresql
echo.
echo Checking pg_lsn...
where pg_lsclusters 2>nul || echo "pg_lsclusters not found"
where psql 2>nul || echo "psql not found"
echo.
set DATABASE_URL=
set | find "DATABASE_URL" && echo "DATABASE_URL already set" || echo "DATABASE_URL not set"