import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// URL simples para Drizzle Kit
const getDatabaseURL = () => {
  return process.env.DATABASE_URL!;
};

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseURL(),
  },
});