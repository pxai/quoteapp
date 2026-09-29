const express = require('express');
const cors = require('cors');
const pino = require('pino');
const { Pool } = require('pg');
const Redis = require('ioredis');

const logger = pino();

function getenv(key, def) {
  const v = process.env[key];
  return v !== undefined && v.trim() !== '' ? v.trim() : def;
}

const redis = new Redis(getenv('REDIS_ADDR', 'localhost:6379'), {
  password: getenv('REDIS_PASSWORD', ''),
});

function createApp(pg) {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: getenv('CORS_ORIGIN', 'http://localhost:5173') }));



  app.get('/healthz', (req, res) => res.send('ok\n'));
  app.get('/v', (req, res) => res.send({ version: '0.0.1' }));

  app.get('/', async (req, res) => {
    const start = Date.now();
    try {
      const cached = await redis.get('daily-quote').catch((err) => {
        logger.warn({ err: err.message }, 'redis get failed');
        return null;
      });
      const quote = cached ? JSON.parse(cached) : (await getRandomQuote(pg)).quote;

      res.status(200).json({ quote, version: '0.0.1' });
      logger.info({ method: 'GET', path: '/', status: 200, ms: Date.now() - start }, 'request');
    } catch (err) {
      logger.error({ err: err.message }, 'error on');
      return res.status(500).send({ error: err.message });
    }
  });


  return app;
}

async function getRandomQuote(pg) {
  const client = await pg.connect();
  try {
    const quotes = await client.query('SELECT * FROM quotes ORDER BY random() LIMIT 1');
    return { quote: quotes.rows[0] };
  } finally {
      client.release();
    }
}

async function fillCache(pg) {
  const client = await pg.connect();
  try {
    const ten_quotes = await client.query('SELECT * FROM quotes ORDER BY random() LIMIT 10');
    await redis.set('ten-quotes', JSON.stringify(ten_quotes.rows), 'EX', 60 * 60 * 24);

    const daily = await getRandomQuote(pg);
    await redis.set('daily-quote', JSON.stringify(daily.quote), 'EX', 60 * 60 * 24);

    logger.info({ quotes: ten_quotes.rows.length, daily: daily.quote }, 'cache filled');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const pg = new Pool({
    connectionString: getenv('POSTGRES_DSN', 'postgres://postgres:postgres@localhost:5432/db?sslmode=disable'),
  });
  const app = createApp(pg);
  fillCache(pg).catch(err => logger.error({ err: err.message }, 'Failed to fill cache'));
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
