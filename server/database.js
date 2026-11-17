const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    })
  : null;

function getSafeErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : "UNKNOWN";
}

// Keep this list in sync with server/scripts/migrate.js.
const EXPECTED_MIGRATIONS = [
  "001_initial_schema",
  "002_garden_rewards_legacy_import",
  "003_ban_columns"
];

const REQUIRED_TABLES_BY_MIGRATION = {
  "001_initial_schema": ["users", "sessions", "token_transactions", "theme_entitlements", "admin_audit_logs"],
  "002_garden_rewards_legacy_import": ["garden_sessions", "legacy_imports"]
};

const BAN_COLUMNS = ["ban_reason", "ban_started_at", "ban_expires_at"];

function safeSchemaIdentifier(value) {
  return typeof value === "string" && /^[A-Za-z0-9_]{1,64}$/.test(value) ? value : null;
}

// node-postgres does not always populate error.table/error.column, so fall back
// to the PostgreSQL message, e.g. 'relation "users" does not exist' or
// 'column u.ban_reason does not exist'.
function extractSchemaIdentifier(error, kind) {
  const direct = kind === "table" ? error?.table : error?.column;
  if (safeSchemaIdentifier(direct)) return direct;

  const message = typeof error?.message === "string" ? error.message : "";
  const pattern = kind === "table"
    ? /relation\s+"?([A-Za-z0-9_.]{1,128})"?\s+does not exist/
    : /column\s+"?([A-Za-z0-9_.]{1,128})"?\s+does not exist/;
  const match = pattern.exec(message);
  if (!match) return null;
  return safeSchemaIdentifier(match[1].split(".").pop());
}


/**
 * Classify a PostgreSQL schema error so callers can return an accurate message.
 * Returns null when the error is not a missing table/column error.
 */
function describeSchemaError(error) {
  const table = extractSchemaIdentifier(error, "table");
  const column = extractSchemaIdentifier(error, "column");

  if (error?.code === "42P01") {
    let migrationId = null;
    for (const [id, tables] of Object.entries(REQUIRED_TABLES_BY_MIGRATION)) {
      if (table && tables.includes(table)) {
        migrationId = id;
        break;
      }
    }
    if (table === "schema_migrations") migrationId = "migration_runner";

    const hint = migrationId === "migration_runner"
      ? "Bảng schema_migrations do migration runner tạo; hãy chạy npm run db:migrate trong thư mục server."
      : migrationId
        ? `Bảng ${table} thuộc migration ${migrationId}; hãy chạy npm run db:migrate trong thư mục server.`
        : `Không tìm thấy bảng ${table || "(không xác định)"} trong schema hiện tại.`;

    return {
      statusCode: 503,
      body: {
        error: `Schema PostgreSQL thiếu bảng. ${hint}`,
        code: "DATABASE_TABLE_MISSING",
        table,
        migration: migrationId
      }
    };
  }

  if (error?.code === "42703") {
    const migrationId = column && column.startsWith("ban_") ? "003_ban_columns" : null;
    const hint = migrationId
      ? `Cột ${column} thuộc migration 003_ban_columns; hãy chạy npm run db:migrate trong thư mục server.`
      : `Cột ${column || "(không xác định)"} chưa có trong schema hiện tại; hãy kiểm tra migration tương ứng.`;

    return {
      statusCode: 503,
      body: {
        error: `Schema PostgreSQL thiếu cột. ${hint}`,
        code: "DATABASE_COLUMN_MISSING",
        column,
        migration: migrationId
      }
    };
  }

  return null;
}

/**
 * Read-only schema inspection used by /auth/status and startup logging.
 * The server never applies migrations automatically.
 */
async function checkSchemaStatus() {
  const status = {
    databaseConfigured: Boolean(pool),
    databaseConnected: false,
    schemaTrackingTableExists: false,
    appliedMigrations: [],
    pendingMigrations: [...EXPECTED_MIGRATIONS],
    migrations: Object.fromEntries(EXPECTED_MIGRATIONS.map((id) => [id, false])),
    missingTables: [],
    missingColumns: [],
    // True when the users table and the ban columns required by auth exist.
    schemaReady: false,
    errorCode: null
  };

  if (!pool) return status;

  try {
    await pool.query("SELECT 1");
    status.databaseConnected = true;

    const requiredTables = [
      "schema_migrations",
      ...REQUIRED_TABLES_BY_MIGRATION["001_initial_schema"],
      ...REQUIRED_TABLES_BY_MIGRATION["002_garden_rewards_legacy_import"]
    ];
    const { rows: tableRows } = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name = ANY($1::text[])`,
      [requiredTables]
    );
    const existingTables = new Set(tableRows.map((row) => row.table_name));
    status.schemaTrackingTableExists = existingTables.has("schema_migrations");
    status.missingTables = requiredTables
      .filter((name) => name !== "schema_migrations")
      .filter((name) => !existingTables.has(name));

    if (status.schemaTrackingTableExists) {
      const { rows: migrationRows } = await pool.query(
        "SELECT migration_id FROM schema_migrations ORDER BY migration_id"
      );
      status.appliedMigrations = migrationRows.map((row) => row.migration_id);
    }

    status.migrations = Object.fromEntries(
      EXPECTED_MIGRATIONS.map((id) => [id, status.appliedMigrations.includes(id)])
    );
    status.pendingMigrations = EXPECTED_MIGRATIONS
      .filter((id) => !status.appliedMigrations.includes(id));

    if (!existingTables.has("users")) {
      status.missingColumns = BAN_COLUMNS.map((column) => `users.${column}`);
      return status;
    }

    const { rows: columnRows } = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'users'
         AND column_name = ANY($1::text[])`,
      [BAN_COLUMNS]
    );
    const existingColumns = new Set(columnRows.map((row) => row.column_name));
    status.missingColumns = BAN_COLUMNS
      .filter((column) => !existingColumns.has(column))
      .map((column) => `users.${column}`);
    status.schemaReady = status.missingColumns.length === 0;
    return status;
  } catch (error) {
    status.errorCode = getSafeErrorCode(error);
    return status;
  }
}

if (pool) {
  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", getSafeErrorCode(error));
  });
}

async function checkDatabaseConnection() {
  console.log("🔎 Checking PostgreSQL connection...");
  if (!pool) {
    console.error("⚠️ DATABASE_URL is not configured or is empty; PostgreSQL connection check skipped.");
    return false;
  }

  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected successfully");
    return true;
  } catch (error) {
    console.error(
      `❌ PostgreSQL connection failed (${getSafeErrorCode(error)}). Check DATABASE_URL, network access, and PostgreSQL availability. Backend will continue running.`
    );
    return false;
  }
}

async function checkInitialSchemaMigration() {
  const status = await checkSchemaStatus();
  return status.appliedMigrations.includes("001_initial_schema");
}

const appliedMigrations = new Set();

async function isMigrationApplied(migrationId) {
  if (!pool) return false;
  if (appliedMigrations.has(migrationId)) return true;
  try {
    const { rows } = await pool.query(
      `SELECT to_regclass('schema_migrations') IS NOT NULL AS tracking_table_exists`
    );
    if (rows[0]?.tracking_table_exists) {
      const { rows: appliedRows } = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE migration_id = $1",
        [migrationId]
      );
      if (appliedRows.length > 0) {
        appliedMigrations.add(migrationId);
        return true;
      }
    }
    // Fallback: check if the target tables exist directly
    if (migrationId === "002_garden_rewards_legacy_import") {
      const { rows: tableRows } = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = current_schema() AND table_name = 'garden_sessions'
         ) AS exists`
      );
      if (tableRows[0]?.exists) {
        // Schema exists but the marker is missing. Only the migration runner
        // writes schema_migrations, so report readiness without inserting here.
        console.warn(`Migration marker missing for ${migrationId}; schema objects exist.`);
        appliedMigrations.add(migrationId);
        return true;
      }
    } else if (migrationId === "001_initial_schema") {
      const { rows: tableRows } = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = current_schema() AND table_name = 'users'
         ) AS exists`
      );
      if (tableRows[0]?.exists) {
        appliedMigrations.add(migrationId);
        return true;
      }
    } else if (migrationId === "003_ban_columns") {
      const { rows: columnRows } = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'users'
           AND column_name = ANY($1::text[])`,
        [BAN_COLUMNS]
      );
      if (columnRows[0]?.count === BAN_COLUMNS.length) {
        appliedMigrations.add(migrationId);
        return true;
      }
    }
  } catch (err) {
    console.error("isMigrationApplied check error:", err.message);
  }
  return false;
}

function requireMigration(migrationId) {
  return (_req, res, next) => {
    isMigrationApplied(migrationId)
      .then((applied) => {
        if (applied) return next();
        res.status(503).json({
          error: "Cơ sở dữ liệu chưa được cập nhật cho chức năng này. Quản trị viên cần chạy npm run db:migrate.",
          code: "MIGRATION_REQUIRED"
        });
      })
      .catch(next);
  };
}

function requireDatabase(_req, res, next) {
  if (!pool) {
    return res.status(503).json({
      error: "PostgreSQL chưa được cấu hình. Hãy thêm DATABASE_URL trên Render.",
      code: "DATABASE_NOT_CONFIGURED"
    });
  }
  next();
}

async function withTransaction(work) {
  if (!pool) {
    const error = new Error("DATABASE_NOT_CONFIGURED");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("PostgreSQL rollback failed:", getSafeErrorCode(rollbackError));
    }
    throw error;
  } finally {
    client.release();
  }
}

async function closeDatabase() {
  if (pool) await pool.end();
}

module.exports = {
  pool,
  requireDatabase,
  withTransaction,
  closeDatabase,
  checkDatabaseConnection,
  checkInitialSchemaMigration,
  checkSchemaStatus,
  describeSchemaError,
  isMigrationApplied,
  requireMigration,
  EXPECTED_MIGRATIONS,
  REQUIRED_TABLES_BY_MIGRATION,
  BAN_COLUMNS
};
