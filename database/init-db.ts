// Database initialization script
// Run this once to set up your database tables
// Usage: npx tsx database/init-db.ts

import { pool } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function initDatabase() {
  try {
    console.log('Initializing database...')
    
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement)
        console.log('✓ Executed:', statement.substring(0, 50) + '...')
      }
    }
    
    console.log('✅ Database initialized successfully!')
    await pool.end()
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    await pool.end()
    process.exit(1)
  }
}

initDatabase()

