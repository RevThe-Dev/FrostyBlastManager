// Simple script to create a default admin user
import { pool } from './server/db.js';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin exists
    const checkResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create the admin user
    const hashedPassword = await hashPassword('admin');
    
    await pool.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
      ['admin', hashedPassword, 'admin@frostys.com', 'Administrator', 'admin']
    );
    
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

createAdminUser();