import { Pool } from 'pg';
import { hashPassword } from '../src/lib/auth/utils.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Users table created successfully');

    // Check if admin user exists
    const adminResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@nakliye.com']
    );

    if (adminResult.rows.length === 0) {
      // Create default admin user
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error('Error: DEFAULT_ADMIN_PASSWORD environment variable is required');
        process.exit(1);
      }
      const passwordHash = await hashPassword(adminPassword);
      
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@nakliye.com', passwordHash, 'Sistem Yöneticisi', 'admin', true]
      );

      console.log('Default admin user created:');
      console.log('Email: admin@nakliye.com');
      console.log('Password: [set via DEFAULT_ADMIN_PASSWORD env var]');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
