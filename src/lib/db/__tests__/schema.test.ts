import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

describe("Database Schema", () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(":memory:");
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Load and execute schema
    const schemaPath = join(process.cwd(), "src", "lib", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    db.exec(schema);
  });

  afterAll(() => {
    db.close();
  });

  it("should have all required tables", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("customers");
    expect(tableNames).toContain("quotations");
    expect(tableNames).toContain("quotation_revisions");
    expect(tableNames).toContain("activities");
    expect(tableNames).toContain("lookup_values");
    expect(tableNames).toContain("audit_log");
  });

  it("should have correct columns in users table", () => {
    const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("password_hash");
    expect(columnNames).toContain("full_name");
    expect(columnNames).toContain("role");
    expect(columnNames).toContain("is_active");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("updated_at");
  });

  it("should have correct columns in customers table", () => {
    const columns = db.prepare("PRAGMA table_info(customers)").all() as { name: string }[];
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("company_name");
    expect(columnNames).toContain("phone");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("assigned_user_id");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("potential");
  });

  it("should have correct columns in quotations table", () => {
    const columns = db.prepare("PRAGMA table_info(quotations)").all() as { name: string }[];
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("quote_no");
    expect(columnNames).toContain("customer_id");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("price");
    expect(columnNames).toContain("currency");
    expect(columnNames).toContain("revision_count");
  });

  it("should have required indexes", () => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[];
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain("idx_customers_assigned_user");
    expect(indexNames).toContain("idx_customers_status");
    expect(indexNames).toContain("idx_customers_company_name");
    expect(indexNames).toContain("idx_quotations_customer");
    expect(indexNames).toContain("idx_quotations_status");
    expect(indexNames).toContain("idx_activities_customer");
    expect(indexNames).toContain("idx_lookup_category");
    expect(indexNames).toContain("idx_audit_record");
  });

  it("should enforce foreign key constraints", () => {
    // This will throw if foreign keys aren't working
    expect(() => {
      db.prepare("INSERT INTO customers (company_name, phone, email, created_by) VALUES (?, ?, ?, ?)")
        .run("Test Company", "1234567890", "test@test.com", 99999);
    }).toThrow();
  });

  it("should enforce unique constraint on user email", () => {
    // Insert first user
    db.prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)")
      .run("unique@test.com", "hash", "Test", "user");

    // Try to insert duplicate
    expect(() => {
      db.prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)")
        .run("unique@test.com", "hash2", "Test2", "user");
    }).toThrow();
  });

  it("should enforce role check constraint", () => {
    expect(() => {
      db.prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)")
        .run("role@test.com", "hash", "Test", "invalid_role");
    }).toThrow();
  });
});

describe("Database Seed Data", () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const schemaPath = join(process.cwd(), "src", "lib", "db", "schema.sql");
    const seedPath = join(process.cwd(), "src", "lib", "db", "seed.sql");
    
    const schema = readFileSync(schemaPath, "utf-8");
    const seed = readFileSync(seedPath, "utf-8");
    
    db.exec(schema);
    db.exec(seed);
  });

  afterAll(() => {
    db.close();
  });

  it("should have transport modes", () => {
    const modes = db.prepare("SELECT * FROM lookup_values WHERE category = ?").all("transport_mode");
    expect(modes.length).toBeGreaterThan(0);
  });

  it("should have service types", () => {
    const types = db.prepare("SELECT * FROM lookup_values WHERE category = ?").all("service_type");
    expect(types.length).toBeGreaterThan(0);
  });

  it("should have incoterms", () => {
    const incoterms = db.prepare("SELECT * FROM lookup_values WHERE category = ?").all("incoterm");
    expect(incoterms.length).toBe(7);
  });

  it("should have currencies", () => {
    const currencies = db.prepare("SELECT * FROM lookup_values WHERE category = ?").all("currency");
    expect(currencies.length).toBe(3);
  });

  it("should have activity types", () => {
    const types = db.prepare("SELECT * FROM lookup_values WHERE category = ?").all("activity_type");
    expect(types.length).toBe(4);
  });
});
