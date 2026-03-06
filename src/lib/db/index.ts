import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/nakliye-crm.db";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initDb(): void {
  const database = getDb();
  
  // Read and execute schema
  const schemaPath = join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  database.exec(schema);
  
  console.log("Database schema initialized successfully");
}

export function seedDb(): void {
  const database = getDb();
  
  // Check if lookups already exist
  const count = database.prepare("SELECT COUNT(*) as count FROM lookup_values").get() as { count: number };
  
  if (count.count > 0) {
    console.log("Lookup values already seeded, skipping...");
    return;
  }
  
  // Read and execute seed
  const seedPath = join(process.cwd(), "src", "lib", "db", "seed.sql");
  const seed = readFileSync(seedPath, "utf-8");
  database.exec(seed);
  
  console.log("Database seeded successfully");
}

// Helper function for parameterized queries with better-sqlite3
export function prepareQuery(sql: string) {
  return getDb().prepare(sql);
}
