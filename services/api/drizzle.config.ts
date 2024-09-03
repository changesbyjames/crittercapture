import { defineConfig } from 'drizzle-kit';

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const database = process.env.POSTGRES_DB;

if (!user || !password || !host || !database) {
  throw new Error('Missing database credentials');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    user,
    password,
    host,
    database
  }
});
