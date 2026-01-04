import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let db: MySql2Database<typeof schema>;

export async function initializeDatabase(): Promise<MySql2Database<typeof schema>> {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema, mode: 'default' });

  console.log('Database connection established');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export { db };
