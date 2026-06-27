import mysql from "mysql2/promise";

// Create a connection pool for MariaDB database interaction
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectTimeout: 8000,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "5", 10),
  maxIdle: parseInt(process.env.DB_MAX_IDLE_CONNECTIONS || "1", 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_MS || "30000", 10),
  enableKeepAlive: false,
  queueLimit: 0,
});

export default pool;

// Generic promise execute query helper
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

// Health check to verify database connectivity status
export async function isDbConnected(): Promise<boolean> {
  const status = await getDbConnectionStatus();
  return status.connected;
}

export async function getDbConnectionStatus(): Promise<{
  connected: boolean;
  error?: string;
  code?: string;
}> {
  try {
    const conn = await pool.getConnection();
    conn.release();
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || "Unknown database connection error",
      code: err?.code,
    };
  }
}

export async function ensureColumn(table: string, column: string, definition: string) {
  const allowedTables = new Set([
    "users",
    "watchlists",
    "user_preferences",
    "portfolio_transactions",
    "portfolio_alerts",
    "portfolio_settings",
    "articles",
    "payments",
    "staff",
    "active_sessions",
    "comparison_sets",
    "newsletter_subscribers",
    "reviews",
    "article_view_counts",
    "article_view_events",
    "telegram_connections",
    "telegram_delivery_logs",
  ]);

  if (!allowedTables.has(table)) {
    throw new Error(`Unsafe table name for migration: ${table}`);
  }

  const existing = await query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  if (existing.length === 0) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

// Automated schema initializer for MariaDB tables
export async function initDatabase(): Promise<boolean> {
  try {
    // 1. Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        billing VARCHAR(50) DEFAULT 'monthly',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Watchlists table
    await query(`
      CREATE TABLE IF NOT EXISTS watchlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_symbol (user_email, symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. User preferences
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_email VARCHAR(255) PRIMARY KEY,
        theme VARCHAR(20) DEFAULT 'dark',
        lang VARCHAR(10) DEFAULT 'th',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS telegram_connections (
        user_email VARCHAR(255) PRIMARY KEY,
        telegram_chat_id VARCHAR(100),
        telegram_username VARCHAR(255),
        status VARCHAR(30) DEFAULT 'pending',
        connect_code_hash VARCHAR(128),
        connect_code_expires_at TIMESTAMP NULL,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        watchlist_digest_enabled BOOLEAN DEFAULT TRUE,
        watchlist_digest_frequency VARCHAR(20) DEFAULT 'daily',
        connected_at TIMESTAMP NULL,
        last_test_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_telegram_code (connect_code_hash, connect_code_expires_at),
        INDEX idx_telegram_chat (telegram_chat_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS telegram_delivery_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        delivery_type VARCHAR(50) NOT NULL,
        delivery_date VARCHAR(10) NOT NULL,
        status VARCHAR(30) DEFAULT 'sent',
        messages_sent INT DEFAULT 0,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_telegram_delivery (user_email, delivery_type, delivery_date),
        INDEX idx_telegram_delivery_date (delivery_type, delivery_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Portfolio transactions
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_transactions (
        id VARCHAR(64) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        action VARCHAR(10) NOT NULL,
        price DECIMAL(18,6) NOT NULL,
        shares DECIMAL(18,6) NOT NULL,
        trade_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_portfolio_user (user_email, trade_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Portfolio alerts
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_alerts (
        id VARCHAR(64) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(18,6) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_alert_user (user_email, symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5.1 Portfolio settings: user UI/workflow preferences only, not computed results
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        user_email VARCHAR(255) PRIMARY KEY,
        active_tab VARCHAR(50) DEFAULT 'ledger',
        backtest_symbol VARCHAR(50) DEFAULT 'PTT',
        backtest_years INT DEFAULT 3,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Articles table (Insights)
    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        read_time VARCHAR(50),
        summary TEXT,
        content TEXT,
        tag VARCHAR(100),
        lang VARCHAR(10) DEFAULT 'th',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS article_view_counts (
        slug VARCHAR(255) PRIMARY KEY,
        views INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS article_view_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL,
        visitor_id VARCHAR(96) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_article_visitor (slug, visitor_id),
        INDEX idx_article_view_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Payments table
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        plan VARCHAR(50) NOT NULL,
        billing VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'promptpay',
        transaction_ref VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Staff table
    await query(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'support',
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Active sessions: one live browser/device per member or staff account
    await query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        account_type VARCHAR(20) NOT NULL,
        account_key VARCHAR(255) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (account_type, account_key),
        INDEX idx_active_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Saved comparison sets: store user-selected tickers/preferences only
    await query(`
      CREATE TABLE IF NOT EXISTS comparison_sets (
        id VARCHAR(64) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        symbols TEXT NOT NULL,
        chart_metric VARCHAR(50) DEFAULT 'mos',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_comparison_user (user_email, updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Newsletter subscribers: marketing opt-in from public landing pages
    await query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        email VARCHAR(255) PRIMARY KEY,
        source VARCHAR(100) DEFAULT 'landing',
        lang VARCHAR(10) DEFAULT 'th',
        status VARCHAR(30) DEFAULT 'subscribed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. User reviews: one review per member, displayed only after admin approval
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        rating TINYINT NOT NULL DEFAULT 5,
        title VARCHAR(160),
        content TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        admin_note TEXT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_review_user (user_email),
        INDEX idx_reviews_status_created (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await ensureColumn("users", "email", "VARCHAR(255) UNIQUE NOT NULL");
    await ensureColumn("users", "name", "VARCHAR(255)");
    await ensureColumn("users", "plan", "VARCHAR(50) DEFAULT 'free'");
    await ensureColumn("users", "billing", "VARCHAR(50) DEFAULT 'monthly'");
    await ensureColumn("users", "joined_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("watchlists", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("watchlists", "symbol", "VARCHAR(50) NOT NULL");
    await ensureColumn("watchlists", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("portfolio_transactions", "id", "VARCHAR(64) PRIMARY KEY");
    await ensureColumn("portfolio_transactions", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("portfolio_transactions", "symbol", "VARCHAR(50) NOT NULL");
    await ensureColumn("portfolio_transactions", "action", "VARCHAR(10) NOT NULL");
    await ensureColumn("portfolio_transactions", "price", "DECIMAL(18,6) NOT NULL DEFAULT 0");
    await ensureColumn("portfolio_transactions", "shares", "DECIMAL(18,6) NOT NULL DEFAULT 0");
    await ensureColumn("portfolio_transactions", "trade_date", "DATE NOT NULL");
    await ensureColumn("portfolio_transactions", "fee", "DECIMAL(18,6) NOT NULL DEFAULT 0");
    await ensureColumn("portfolio_transactions", "currency", "VARCHAR(10) DEFAULT 'THB'");
    await ensureColumn("portfolio_transactions", "notes", "TEXT");
    await ensureColumn("portfolio_transactions", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("portfolio_alerts", "id", "VARCHAR(64) PRIMARY KEY");
    await ensureColumn("portfolio_alerts", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("portfolio_alerts", "symbol", "VARCHAR(50) NOT NULL");
    await ensureColumn("portfolio_alerts", "type", "VARCHAR(50) NOT NULL");
    await ensureColumn("portfolio_alerts", "value", "DECIMAL(18,6) NOT NULL DEFAULT 0");
    await ensureColumn("portfolio_alerts", "active", "BOOLEAN DEFAULT TRUE");
    await ensureColumn("portfolio_alerts", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("portfolio_settings", "user_email", "VARCHAR(255) PRIMARY KEY");
    await ensureColumn("portfolio_settings", "active_tab", "VARCHAR(50) DEFAULT 'ledger'");
    await ensureColumn("portfolio_settings", "backtest_symbol", "VARCHAR(50) DEFAULT 'PTT'");
    await ensureColumn("portfolio_settings", "backtest_years", "INT DEFAULT 3");
    await ensureColumn("portfolio_settings", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await ensureColumn("telegram_connections", "user_email", "VARCHAR(255) PRIMARY KEY");
    await ensureColumn("telegram_connections", "telegram_chat_id", "VARCHAR(100)");
    await ensureColumn("telegram_connections", "telegram_username", "VARCHAR(255)");
    await ensureColumn("telegram_connections", "status", "VARCHAR(30) DEFAULT 'pending'");
    await ensureColumn("telegram_connections", "connect_code_hash", "VARCHAR(128)");
    await ensureColumn("telegram_connections", "connect_code_expires_at", "TIMESTAMP NULL");
    await ensureColumn("telegram_connections", "notifications_enabled", "BOOLEAN DEFAULT TRUE");
    await ensureColumn("telegram_connections", "watchlist_digest_enabled", "BOOLEAN DEFAULT TRUE");
    await ensureColumn("telegram_connections", "watchlist_digest_frequency", "VARCHAR(20) DEFAULT 'daily'");
    await ensureColumn("telegram_connections", "connected_at", "TIMESTAMP NULL");
    await ensureColumn("telegram_connections", "last_test_at", "TIMESTAMP NULL");
    await ensureColumn("telegram_connections", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await ensureColumn("telegram_delivery_logs", "id", "INT AUTO_INCREMENT PRIMARY KEY");
    await ensureColumn("telegram_delivery_logs", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("telegram_delivery_logs", "delivery_type", "VARCHAR(50) NOT NULL");
    await ensureColumn("telegram_delivery_logs", "delivery_date", "VARCHAR(10) NOT NULL");
    await ensureColumn("telegram_delivery_logs", "status", "VARCHAR(30) DEFAULT 'sent'");
    await ensureColumn("telegram_delivery_logs", "messages_sent", "INT DEFAULT 0");
    await ensureColumn("telegram_delivery_logs", "error", "TEXT");
    await ensureColumn("telegram_delivery_logs", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("articles", "slug", "VARCHAR(255) UNIQUE NOT NULL");
    await ensureColumn("articles", "title", "VARCHAR(255) NOT NULL");
    await ensureColumn("articles", "category", "VARCHAR(100)");
    await ensureColumn("articles", "read_time", "VARCHAR(50)");
    await ensureColumn("articles", "summary", "TEXT");
    await ensureColumn("articles", "content", "TEXT");
    await ensureColumn("articles", "tag", "VARCHAR(100)");
    await ensureColumn("articles", "lang", "VARCHAR(10) DEFAULT 'th'");
    await ensureColumn("articles", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("payments", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("payments", "amount", "DECIMAL(10,2) NOT NULL DEFAULT 0");
    await ensureColumn("payments", "plan", "VARCHAR(50) NOT NULL DEFAULT 'pro'");
    await ensureColumn("payments", "billing", "VARCHAR(50) NOT NULL DEFAULT 'monthly'");
    await ensureColumn("payments", "status", "VARCHAR(50) DEFAULT 'pending'");
    await ensureColumn("payments", "payment_method", "VARCHAR(50) DEFAULT 'promptpay'");
    await ensureColumn("payments", "transaction_ref", "VARCHAR(255)");
    await ensureColumn("payments", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("staff", "username", "VARCHAR(100) UNIQUE NOT NULL");
    await ensureColumn("staff", "name", "VARCHAR(255) NOT NULL");
    await ensureColumn("staff", "role", "VARCHAR(100) DEFAULT 'support'");
    await ensureColumn("staff", "email", "VARCHAR(255)");
    await ensureColumn("staff", "status", "VARCHAR(50) DEFAULT 'active'");
    await ensureColumn("staff", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("active_sessions", "account_type", "VARCHAR(20) NOT NULL");
    await ensureColumn("active_sessions", "account_key", "VARCHAR(255) NOT NULL");
    await ensureColumn("active_sessions", "session_id", "VARCHAR(64) NOT NULL");
    await ensureColumn("active_sessions", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("active_sessions", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await ensureColumn("comparison_sets", "id", "VARCHAR(64) PRIMARY KEY");
    await ensureColumn("comparison_sets", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("comparison_sets", "name", "VARCHAR(255) NOT NULL");
    await ensureColumn("comparison_sets", "symbols", "TEXT NOT NULL");
    await ensureColumn("comparison_sets", "chart_metric", "VARCHAR(50) DEFAULT 'mos'");
    await ensureColumn("comparison_sets", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("comparison_sets", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await ensureColumn("newsletter_subscribers", "email", "VARCHAR(255) PRIMARY KEY");
    await ensureColumn("newsletter_subscribers", "source", "VARCHAR(100) DEFAULT 'landing'");
    await ensureColumn("newsletter_subscribers", "lang", "VARCHAR(10) DEFAULT 'th'");
    await ensureColumn("newsletter_subscribers", "status", "VARCHAR(30) DEFAULT 'subscribed'");
    await ensureColumn("newsletter_subscribers", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("newsletter_subscribers", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    await ensureColumn("reviews", "user_email", "VARCHAR(255) NOT NULL");
    await ensureColumn("reviews", "user_name", "VARCHAR(255) NOT NULL");
    await ensureColumn("reviews", "rating", "TINYINT NOT NULL DEFAULT 5");
    await ensureColumn("reviews", "title", "VARCHAR(160)");
    await ensureColumn("reviews", "content", "TEXT NOT NULL");
    await ensureColumn("reviews", "status", "VARCHAR(30) DEFAULT 'pending'");
    await ensureColumn("reviews", "admin_note", "TEXT");
    await ensureColumn("reviews", "approved_at", "TIMESTAMP NULL");
    await ensureColumn("reviews", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("reviews", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

    return true;
  } catch (err: any) {
    console.warn("Database auto-initialization skipped:", err.message);
    return false;
  }
}
