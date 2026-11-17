// Read-only schema diagnostic for production recovery.
// It never runs migrations and never writes to the database.
// It prints only schema state; DATABASE_URL, host, user and password are never printed.
//
// Usage (inside server/):
//   node scripts/schema-status.js
//
// Exit codes:
//   0 = schema ready and no pending migrations
//   1 = schema/migration work required (see "verdict")
//   2 = database not configured or connection/query failed

const {
  pool,
  closeDatabase,
  EXPECTED_MIGRATIONS,
  REQUIRED_TABLES_BY_MIGRATION,
  BAN_COLUMNS
} = require("../database");

const CORE_TABLES = [
  ...REQUIRED_TABLES_BY_MIGRATION["001_initial_schema"],
  ...REQUIRED_TABLES_BY_MIGRATION["002_garden_rewards_legacy_import"]
];

const NEXT_STEP = {
  READY: "Schema sẵn sàng; không cần chạy migration.",
  MIGRATION_003_REQUIRED: "Backup xong thì chạy: cd server && npm run db:migrate",
  MIGRATION_PENDING: "Có migration chưa ghi marker; backup xong thì chạy: cd server && npm run db:migrate",
  SCHEMA_MISSING: "Thiếu bảng lõi; xác minh backup và tình trạng database trước khi chạy migration.",
  SCHEMA_PARTIAL: "Marker đã đủ nhưng thiếu bảng; kiểm tra thủ công trước khi chạy migration.",
  CONNECTION_OR_QUERY_FAILED: "Kiểm tra DATABASE_URL và kết nối PostgreSQL; không chạy migration khi chưa rõ nguyên nhân.",
  DATABASE_NOT_CONFIGURED: "DATABASE_URL chưa được cấu hình trong môi trường này."
};

function print(key, value) {
  console.log(`${key}: ${value}`);
}

function safeErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : "UNKNOWN";
}

async function main() {
  if (!pool) {
    print("databaseConfigured", false);
    print("verdict", "DATABASE_NOT_CONFIGURED");
    print("nextStep", NEXT_STEP.DATABASE_NOT_CONFIGURED);
    process.exitCode = 2;
    return;
  }

  print("databaseConfigured", true);

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    print("databaseConnected", false);
    print("errorCode", safeErrorCode(error));
    print("verdict", "CONNECTION_OR_QUERY_FAILED");
    print("nextStep", NEXT_STEP.CONNECTION_OR_QUERY_FAILED);
    process.exitCode = 2;
    return;
  }

  let inTransaction = false;

  try {
    // Guarantees that any accidental write fails instead of modifying production.
    await client.query("BEGIN TRANSACTION READ ONLY");
    inTransaction = true;

    const info = await client.query(
      "SELECT current_database() AS database_name, current_schema() AS schema_name"
    );
    print("databaseConnected", true);
    print("database", info.rows[0].database_name);
    print("schema", info.rows[0].schema_name);

    const tableRows = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name = ANY($1::text[])`,
      [["schema_migrations", ...CORE_TABLES]]
    );
    const existingTables = new Set(tableRows.rows.map((row) => row.table_name));
    const trackingExists = existingTables.has("schema_migrations");
    print("schemaMigrationsTableExists", trackingExists);

    let appliedMigrations = [];
    if (trackingExists) {
      const markerRows = await client.query(
        "SELECT migration_id FROM schema_migrations ORDER BY migration_id"
      );
      appliedMigrations = markerRows.rows.map((row) => row.migration_id);
    }

    const migrations = Object.fromEntries(
      EXPECTED_MIGRATIONS.map((id) => [id, appliedMigrations.includes(id)])
    );
    const pendingMigrations = EXPECTED_MIGRATIONS.filter(
      (id) => !appliedMigrations.includes(id)
    );

    print("migrations", JSON.stringify(migrations));
    print("appliedMigrations", appliedMigrations.length ? appliedMigrations.join(",") : "(none)");
    print("pendingMigrations", pendingMigrations.length ? pendingMigrations.join(",") : "(none)");

    const usersExists = existingTables.has("users");
    print("usersTableExists", usersExists);

    let banColumns = {};
    if (usersExists) {
      const columnRows = await client.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'users'
           AND column_name = ANY($1::text[])`,
        [BAN_COLUMNS]
      );
      const existingColumns = new Set(columnRows.rows.map((row) => row.column_name));
      banColumns = Object.fromEntries(
        BAN_COLUMNS.map((column) => [column, existingColumns.has(column)])
      );
    } else {
      banColumns = Object.fromEntries(BAN_COLUMNS.map((column) => [column, false]));
    }
    const missingBanColumns = BAN_COLUMNS.filter((column) => !banColumns[column]);

    print("banColumns", JSON.stringify(banColumns));
    print("missingBanColumns", missingBanColumns.length ? missingBanColumns.join(",") : "(none)");

    const missingTables = CORE_TABLES.filter((table) => !existingTables.has(table));
    print("missingTables", missingTables.length ? missingTables.join(",") : "(none)");

    const schemaReady = usersExists && missingBanColumns.length === 0;
    print("schemaReady", schemaReady);

    let verdict = "READY";
    if (!usersExists) {
      verdict = "SCHEMA_MISSING";
    } else if (missingBanColumns.length > 0) {
      verdict = "MIGRATION_003_REQUIRED";
    } else if (pendingMigrations.length > 0) {
      verdict = "MIGRATION_PENDING";
    } else if (missingTables.length > 0) {
      verdict = "SCHEMA_PARTIAL";
    }

    print("verdict", verdict);
    print("nextStep", NEXT_STEP[verdict]);
    process.exitCode = verdict === "READY" ? 0 : 1;

    await client.query("ROLLBACK");
    inTransaction = false;
  } catch (error) {
    if (inTransaction) {
      await client.query("ROLLBACK").catch(() => {});
    }
    const code = safeErrorCode(error);
    print("databaseConnected", false);
    print("errorCode", code);
    print("verdict", "CONNECTION_OR_QUERY_FAILED");
    print("nextStep", NEXT_STEP.CONNECTION_OR_QUERY_FAILED);
    process.exitCode = 2;
  } finally {
    client.release();
  }
}

main()
  .catch(() => {
    // Never print error details that could include connection information.
    console.error("schema-status: unexpected failure");
    process.exitCode = 2;
  })
  .finally(closeDatabase);
