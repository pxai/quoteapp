const express = require('express');
const cors = require('cors');
const pino = require('pino');
const { Pool } = require('pg');

const logger = pino();

function getenv(key, def) {
  const v = process.env[key];
  return v !== undefined && v.trim() !== '' ? v.trim() : def;
}

function createApp(pg) {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: getenv('CORS_ORIGIN', 'http://localhost:5173') }));

  async function getRandomQuote() {
    const client = await pg.connect();
    try {
      const quotes = await client.query('SELECT * FROM quotes ORDER BY random() LIMIT 1');
      return { quote: quotes.rows[0] };
    } finally {
      client.release();
    }
  }

  app.get('/healthz', (req, res) => res.send('ok\n'));
  app.get('/v', (req, res) => res.send({ version: '0.0.1' }));

  app.get('/', async (req, res) => {
    const start = Date.now();
    let result;
    try {
      result = await getRandomQuote();
    } catch (err) {
      logger.error({ err: err.message }, 'error on');
      return res.status(500).send({ error: err.message });
    }

    res.status(200).json({ quote: result.quote, version: '0.0.1' });
    logger.info({ method: 'GET', path: '/', status: 200, ms: Date.now() - start }, 'request');
  });

  return app;
}

if (require.main === module) {
  const pg = new Pool({
    connectionString: getenv('POSTGRES_DSN', 'postgres://postgres:postgres@localhost:5432/db?sslmode=disable'),
  });
  const app = createApp(pg);
  const server = app.listen(8080, () => logger.info({ addr: ':8080' }, 'Server listening'));

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      logger.info('shutting down');
      server.close(() => process.exit(0));
      pg.end();
    });
  }
}

module.exports = { createApp };
