// Migration script to add vehicle fields to the jobs table
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to use ws
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Starting migration to add vehicle fields to jobs table...');
    
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name IN ('vehicle_make', 'vehicle_model', 'registration_number')
    `);
    
    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Add columns that don't exist yet
    if (!existingColumns.includes('vehicle_make')) {
      console.log('Adding vehicle_make column...');
      await pool.query('ALTER TABLE jobs ADD COLUMN vehicle_make TEXT');
    }
    
    if (!existingColumns.includes('vehicle_model')) {
      console.log('Adding vehicle_model column...');
      await pool.query('ALTER TABLE jobs ADD COLUMN vehicle_model TEXT');
    }
    
    if (!existingColumns.includes('registration_number')) {
      console.log('Adding registration_number column...');
      await pool.query('ALTER TABLE jobs ADD COLUMN registration_number TEXT');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();