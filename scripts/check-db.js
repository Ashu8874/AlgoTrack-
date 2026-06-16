#!/usr/bin/env node

/**
 * Database Connection Checker (Simple JavaScript Version)
 * Run: npm run check-db
 * 
 * Quickly verifies MongoDB connection status without starting the dev server
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env file and parse it manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();
const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logBox(title, content) {
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
  content.forEach(line => console.log(line));
  console.log();
}

async function checkDatabase() {
  try {
    log(colors.blue, '🔍 Checking MongoDB Connection...\n');

    // Check if MONGODB_URI is set
    if (!MONGODB_URI) {
      logBox('❌ ERROR', [
        `${colors.red}MONGODB_URI is not set in .env file!${colors.reset}`,
        `\nAdd this to your .env file:`,
        `MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@cluster.xxx.mongodb.net/"`,
      ]);
      process.exit(1);
    }

    log(colors.yellow, '📡 Connection String Found');
    
    // Show masked connection string
    const maskedUri = MONGODB_URI.replace(/:[^@]*@/, ':****@');
    console.log(`   ${maskedUri}\n`);

    // Attempt connection
    log(colors.yellow, '⏳ Connecting to MongoDB...');
    
    const startTime = Date.now();
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    const connectionTime = Date.now() - startTime;

    // Connection successful
    logBox('✅ SUCCESS - Database Connected!', [
      `${colors.green}✓ MongoDB connection established${colors.reset}`,
      `${colors.green}✓ Connection time: ${connectionTime}ms${colors.reset}`,
      `${colors.green}✓ Database ready for use${colors.reset}`,
    ]);

    // Show database info
    const connection = mongoose.connection;
    console.log(`${colors.bright}Database Information:${colors.reset}`);
    console.log(`  Host:     ${connection.host}`);
    console.log(`  Port:     ${connection.port}`);
    console.log(`  Database: ${connection.name}`);
    console.log();

    // Get collection count
    try {
      const collections = await connection.db.listCollections().toArray();
      log(colors.green, `📦 Collections Found: ${collections.length}`);
      if (collections.length > 0) {
        collections.forEach(col => {
          console.log(`   • ${col.name}`);
        });
      }
    } catch (e) {
      // Skip collection listing if not available
    }

    // Disconnect
    await mongoose.disconnect();
    log(colors.cyan, '🔌 Connection closed\n');

  } catch (error) {
    const err = error;
    
    // Determine error type
    let errorType = '❌ Connection Failed';
    let details = [];

    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      errorType = '❌ DNS/Network Error';
      details = [
        'Could not resolve MongoDB hostname.',
        'Possible causes:',
        '  • Incorrect cluster URL in connection string',
        '  • Network/firewall blocking MongoDB connection',
        '  • MongoDB Atlas cluster not yet activated',
      ];
    } else if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
      errorType = '❌ Authentication Failed';
      details = [
        'MongoDB rejected your credentials.',
        'Possible causes:',
        '  • Wrong username or password',
        '  • Special characters in password not URL-encoded',
        '  • User account disabled in MongoDB Atlas',
      ];
    } else if (err.message.includes('ECONNREFUSED')) {
      errorType = '❌ Connection Refused';
      details = [
        'MongoDB server is not responding.',
        'Possible causes:',
        '  • MongoDB Atlas cluster is not running',
        '  • Your IP is not whitelisted',
        '  • Network timeout',
      ];
    } else if (err.message.includes('timeout')) {
      errorType = '❌ Connection Timeout';
      details = [
        'Connection took too long.',
        'Possible causes:',
        '  • MongoDB Atlas cluster is paused',
        '  • Network is too slow',
        '  • Your IP is not whitelisted',
      ];
    } else {
      errorType = `❌ ${err.name || 'Connection Error'}`;
      details = [err.message];
    }

    logBox(errorType, [
      `${colors.red}${details[0]}${colors.reset}`,
      ...details.slice(1),
    ]);

    // Show troubleshooting steps
    logBox('🔧 Troubleshooting Steps', [
      `${colors.cyan}1. Verify .env file has MONGODB_URI set${colors.reset}`,
      `   Check: ${process.cwd()}/.env`,
      `\n${colors.cyan}2. Verify MongoDB Atlas connection string is correct${colors.reset}`,
      `   • Login to https://www.mongodb.com/cloud/atlas`,
      `   • Go to Clusters → Connect`,
      `   • Copy the correct connection string`,
      `\n${colors.cyan}3. Check MongoDB Atlas Network Access${colors.reset}`,
      `   • Go to Network Access (left sidebar)`,
      `   • Add your current IP address`,
      `   • Or add 0.0.0.0/0 to allow all IPs`,
      `\n${colors.cyan}4. Verify credentials in connection string${colors.reset}`,
      `   • Username and password are correct`,
      `   • Special characters are URL-encoded`,
      `\n${colors.cyan}5. Test MongoDB Atlas cluster is running${colors.reset}`,
      `   • It might be paused - click "Resume"`,
    ]);

    process.exit(1);
  }
}

// Run the check
checkDatabase().catch((error) => {
  log(colors.red, `\n❌ Unexpected Error: ${error.message}`);
  process.exit(1);
});
