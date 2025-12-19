// Simple database initialization script
// Run: node scripts/init-db.js

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:JsKPmExZxXSNKEtCqtBYdotHDGLaHxcp@caboose.proxy.rlwy.net:32990/railway',
  ssl: {
    rejectUnauthorized: false
  }
})

async function initDatabase() {
  try {
    console.log('📦 Initializing database...')
    
    const schemaPath = path.join(__dirname, '../database/schema.sql')
    let schema = fs.readFileSync(schemaPath, 'utf-8')
    
    // Remove single-line comments
    schema = schema.replace(/--.*$/gm, '')
    
    // Handle dollar-quoted strings (for functions)
    const statements = []
    let currentStatement = ''
    let inDollarQuote = false
    let dollarTag = ''
    
    const lines = schema.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // Check for dollar-quoted strings
      const dollarMatches = trimmed.match(/\$([^$]*)\$/g)
      if (dollarMatches) {
        for (const match of dollarMatches) {
          if (!inDollarQuote) {
            // Starting a dollar quote
            dollarTag = match
            inDollarQuote = true
            currentStatement += line + '\n'
          } else if (match === dollarTag) {
            // Ending the dollar quote
            inDollarQuote = false
            currentStatement += line + '\n'
            dollarTag = ''
          } else {
            currentStatement += line + '\n'
          }
        }
        continue
      }
      
      if (inDollarQuote) {
        currentStatement += line + '\n'
        continue
      }
      
      // Regular statement
      currentStatement += line + '\n'
      
      if (trimmed.endsWith(';')) {
        const stmt = currentStatement.trim()
        if (stmt) {
          statements.push(stmt.slice(0, -1)) // Remove trailing semicolon
        }
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }
    
    console.log(`Found ${statements.length} statements to execute\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          await pool.query(statement)
          const preview = statement.substring(0, 80).replace(/\s+/g, ' ')
          console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`)
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists') || 
              err.message.includes('duplicate') ||
              err.code === '42P07' || // duplicate_table
              err.code === '42710') { // duplicate_object
            const preview = statement.substring(0, 80).replace(/\s+/g, ' ')
            console.log(`⚠ [${i + 1}/${statements.length}] Skipped (exists): ${preview}...`)
          } else {
            console.error(`\n❌ Error executing statement ${i + 1}:`)
            console.error(statement.substring(0, 300))
            console.error(`\nError: ${err.message}`)
            throw err
          }
        }
      }
    }
    
    console.log('\n✅ Database initialized successfully!')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    await pool.end()
    process.exit(1)
  }
}

initDatabase()

