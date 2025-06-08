import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Usar la conexión proporcionada por el usuario
const DATABASE_URL = "postgresql://neondb_owner:npg_qOIUAGwW4N9p@ep-cool-dust-a2xjgv3q-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });
