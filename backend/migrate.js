const { Pool } = require('pg');

function getenv(key, def) {
  const v = process.env[key];
  return v !== undefined && v.trim() !== '' ? v.trim() : def;
}

async function migrate() {
  const pg = new Pool({
    connectionString: getenv('POSTGRES_DSN', 'postgres://postgres:postgres@localhost:5432/db?sslmode=disable'),
  });

  try {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        author TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const result = await pg.query('SELECT COUNT(*)::int AS total FROM quotes');
    if (Number(result.rows[0].total) === 0) {
      await pg.query(
        'INSERT INTO quotes (text, author) VALUES ($1, $2)',
        ['The best way to predict the future is to build it.', 'Peter Drucker'],
      );
    }

    console.log('Database migration completed');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  } finally {
    await pg.end();
  }
}

migrate();
