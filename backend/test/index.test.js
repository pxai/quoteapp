const request = require('supertest');
const { createApp } = require('../index');

describe('GET /', () => {
  let app;
  let database;
  let client;

  beforeEach(() => {
    client = {
      query: jest.fn(),
      release: jest.fn(),
    };
    database = {
      connect: jest.fn().mockResolvedValue(client),
    };
    app = createApp(database);
  });

  it('returns a random quote from the database', async () => {
    const quote = { id: 12, text: 'A test quote.', author: 'A. Writer' };
    client.query.mockResolvedValue({ rows: [quote] });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ quote, version: '0.0.1' });
    expect(client.query).toHaveBeenCalledWith('SELECT * FROM quotes ORDER BY random() LIMIT 1');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('returns an error response when the database query fails', async () => {
    client.query.mockRejectedValue(new Error('database unavailable'));

    const response = await request(app).get('/');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'database unavailable' });
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});