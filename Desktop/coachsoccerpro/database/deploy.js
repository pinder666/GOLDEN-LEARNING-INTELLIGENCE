const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://eufbzktzoaergssmqkvh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZmJ6a3R6b2Flcmdzc21xa3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk0Nzg2NCwiZXhwIjoyMDk4NTIzODY0fQ.-NbW7IzFAAfZ8LrYZCQnUuFZX-IsFAnbmGZw9MhqBc4';

async function executeSQL(sql) {
  const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'eufbzktzoaergssmqkvh.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Direct PostgreSQL query via PostgREST
async function runQuery(sql) {
  const url = `${SUPABASE_URL}/rest/v1/`;

  // Use the SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

async function main() {
  console.log('Reading schema file...');
  const schema = fs.readFileSync('./schema.sql', 'utf8');
  console.log('Schema loaded, length:', schema.length);
  console.log('\\nTo deploy, go to Supabase Dashboard > SQL Editor and paste the schema.');
  console.log('\\nSupabase project URL:', SUPABASE_URL);
}

main().catch(console.error);
