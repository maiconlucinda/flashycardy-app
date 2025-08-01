import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), 'rds-ca-2019-root.pem')).toString(),
    rejectUnauthorized: true // Agora podemos usar true com o certificado oficial
  }
});

export const db = drizzle(pool);