const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5
});

class EventStore {
  async saveEvent(event) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        'INSERT INTO events (type, data, created_at) VALUES (?, ?, NOW())',
        [event.type, JSON.stringify(event.data)]
      );
    } finally {
      if (conn) conn.release();
    }
  }

  async getEvents() {
    let conn;
    try {
      conn = await pool.getConnection();
      const events = await conn.query('SELECT * FROM events ORDER BY created_at ASC');
      return events.map(event => ({
        ...event,
        data: JSON.parse(event.data)
      }));
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = new EventStore(); 