import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_8SrJL4iflFae@ep-damp-cake-a1yydf8f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: DATABASE_URL });

const createTables = async () => {
    try {
        // Create pdfs table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        page_count INTEGER NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        text_content TEXT
      );
    `);

        // Create chat_sessions table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pdf_id VARCHAR NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        // Create chat_messages table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await pool.end();
    }
};

createTables();