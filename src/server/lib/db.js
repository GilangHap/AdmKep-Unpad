import sql from "mssql";

// SQL Server connection for the legacy komitik_backup database.
// Uses SQL login (DB_USER/DB_PASSWORD). Set DB_INSTANCE for a named instance
// (e.g. SQLEXPRESS) â€” it then overrides DB_PORT.
const config = {
  server: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || "komitik_backup",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== "false",
    instanceName: process.env.DB_INSTANCE || undefined,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

// Two additive changes only: a gender column used by the new registration form,
// and a table for email-activation tokens (the old app had neither).
const SCHEMA_SQL = `
IF COL_LENGTH('dbo.t_user', 'c_gender') IS NULL
  ALTER TABLE dbo.t_user ADD c_gender char(1) NULL;

IF OBJECT_ID(N'dbo.t_user_activation', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.t_user_activation (
    token_hash char(64) NOT NULL CONSTRAINT PK_t_user_activation PRIMARY KEY,
    email varchar(100) NOT NULL,
    expires_at datetime2 NOT NULL,
    used_at datetime2 NULL,
    created_at datetime2 NOT NULL CONSTRAINT DF_t_user_activation_created DEFAULT SYSDATETIME()
  );
  CREATE INDEX IX_t_user_activation_email ON dbo.t_user_activation(email, created_at);
END;

IF OBJECT_ID(N'dbo.t_user_password_reset', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.t_user_password_reset (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_t_user_password_reset PRIMARY KEY,
    email varchar(100) NOT NULL,
    reason varchar(100) NULL,
    matched bit NOT NULL,
    requested_at datetime2 NOT NULL CONSTRAINT DF_t_user_password_reset_at DEFAULT SYSDATETIME()
  );
  CREATE INDEX IX_t_user_password_reset_email ON dbo.t_user_password_reset(email, requested_at);
END;

-- t_user.c_group references the legacy authority/role table.
-- Skipped while legacy rows still hold a c_group value that no longer exists there.
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_t_user_c_group')
   AND NOT EXISTS (
     SELECT 1
     FROM dbo.t_user u
     LEFT JOIN dbo.tr_otoritas_user o ON o.id = u.c_group
     WHERE u.c_group IS NOT NULL AND o.id IS NULL
   )
BEGIN
  ALTER TABLE dbo.t_user WITH CHECK ADD CONSTRAINT FK_t_user_c_group
  FOREIGN KEY (c_group) REFERENCES dbo.tr_otoritas_user(id);
END;

-- Login sessions for the new portal. The legacy app used PHP sessions only,
-- so this table is additive and never touches legacy rows.
IF OBJECT_ID(N'dbo.t_user_session', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.t_user_session (
    token_hash char(64) NOT NULL CONSTRAINT PK_t_user_session PRIMARY KEY,
    user_id int NOT NULL,
    expires_at datetime2 NOT NULL,
    created_at datetime2 NOT NULL CONSTRAINT DF_t_user_session_created DEFAULT SYSDATETIME(),
    last_seen_at datetime2 NULL
  );
  CREATE INDEX IX_t_user_session_user ON dbo.t_user_session(user_id, expires_at);
END;
`;

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(async (pool) => {
        pool.on("error", (err) => console.error("SQL Server pool error:", err.message));
        await pool.request().batch(SCHEMA_SQL);
        return pool;
      })
      .catch((err) => {
        poolPromise = undefined;
        throw err;
      });
  }
  return poolPromise;
}
