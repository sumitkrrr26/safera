const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const runMigrations = async () => {
  try {
    const migrationDir = path.join(__dirname, '../db/migrations');
    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
        await pool.query(sql);
        console.log(`✅ Completed: ${file}`);
      }
    }

    // Create additional tables needed for auth
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS otp_store (
        phone_number VARCHAR(20) PRIMARY KEY,
        otp VARCHAR(6),
        expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

runMigrations();
