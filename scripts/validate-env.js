#!/usr/bin/env node

/**
 * NEXUS Platform - Environment Validation Script
 *
 * Run this script before starting the application to validate environment configuration.
 *
 * Usage:
 *   node scripts/validate-env.js                    # Use NODE_ENV or default to development
 *   node scripts/validate-env.js --env=production   # Validate for specific environment
 *   node scripts/validate-env.js --summary          # Show configuration summary
 *   node scripts/validate-env.js --required         # List required variables
 *   node scripts/validate-env.js --help             # Show help
 *
 * Exit codes:
 *   0 - Validation passed
 *   1 - Validation failed
 *   2 - Error running validation
 */

const path = require('path');
const fs = require('fs');

// Load .env file if it exists
function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Only set if not already set in environment
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    return true;
  }
  return false;
}

// Parse command line arguments
function parseArgs() {
  const args = {
    env: null,
    summary: false,
    required: false,
    help: false,
    verbose: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--env=')) {
      args.env = arg.substring(6);
    } else if (arg === '--summary') {
      args.summary = true;
    } else if (arg === '--required') {
      args.required = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    }
  }

  return args;
}

function showHelp() {
  console.log(`
NEXUS Platform - Environment Validation Script

Usage:
  node scripts/validate-env.js [options]

Options:
  --env=<environment>   Validate for specific environment (development, staging, production)
  --summary             Show configuration summary by category
  --required            List all required environment variables
  --verbose, -v         Show detailed output
  --help, -h            Show this help message

Examples:
  node scripts/validate-env.js                      Validate for current NODE_ENV
  node scripts/validate-env.js --env=production     Validate production configuration
  node scripts/validate-env.js --summary            Show config summary
  node scripts/validate-env.js --required --env=staging   List staging requirements

Exit Codes:
  0   Validation passed
  1   Validation failed (missing/invalid variables)
  2   Script error
`);
}

function printBox(title, content) {
  const width = 76;
  const border = '═'.repeat(width);

  console.log(`╔${border}╗`);
  console.log(`║ ${title.padEnd(width - 1)}║`);
  console.log(`╠${border}╣`);

  for (const line of content) {
    const truncated = line.length > width - 2 ? line.substring(0, width - 5) + '...' : line;
    console.log(`║ ${truncated.padEnd(width - 1)}║`);
  }

  console.log(`╚${border}╝`);
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Determine project root and load env files
  const projectRoot = path.resolve(__dirname, '..');

  // Try to load .env files in order of priority
  const envFiles = [
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env'),
  ];

  for (const envFile of envFiles) {
    if (loadEnvFile(envFile)) {
      if (args.verbose) {
        console.log(`Loaded environment from: ${envFile}`);
      }
      break;
    }
  }

  // Determine environment
  const environment = args.env || process.env.NODE_ENV || 'development';
  process.env.NODE_ENV = environment;

  // Import validation module
  let envModule;
  try {
    envModule = require(path.join(projectRoot, 'packages', 'config', 'env'));
  } catch (err) {
    console.error(`Error loading environment module: ${err.message}`);
    console.error('Make sure @nexus/config is installed and built.');
    process.exit(2);
  }

  const { validateEnv, getEnvSummary, getRequiredEnvVars } = envModule;

  console.log('');
  console.log(`NEXUS Platform - Environment Validation`);
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));
  console.log('');

  // Show required variables if requested
  if (args.required) {
    const required = getRequiredEnvVars(environment);

    console.log(`Required Environment Variables for ${environment.toUpperCase()}:`);
    console.log('');

    // Group by category
    const byCategory = {};
    for (const item of required) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push(item);
    }

    for (const [category, vars] of Object.entries(byCategory)) {
      console.log(`  ${category}:`);
      for (const v of vars) {
        const isSet = process.env[v.name] && process.env[v.name].trim() !== '';
        const status = isSet ? '[OK]' : '[MISSING]';
        console.log(`    ${status} ${v.name}`);
        if (args.verbose) {
          console.log(`         ${v.description}`);
        }
      }
      console.log('');
    }

    return;
  }

  // Show summary if requested
  if (args.summary) {
    const summary = getEnvSummary(environment);

    console.log('Configuration Summary:');
    console.log('');

    for (const [category, stats] of Object.entries(summary.categories)) {
      const requiredStatus = stats.requiredSet === stats.required ? 'OK' : 'MISSING';
      const coverage = Math.round((stats.set / stats.total) * 100);

      console.log(`  ${category}:`);
      console.log(`    Variables: ${stats.set}/${stats.total} set (${coverage}%)`);
      console.log(`    Required:  ${stats.requiredSet}/${stats.required} [${requiredStatus}]`);
      console.log('');
    }

    const overallStatus = summary.isReady ? 'READY' : 'NOT READY';
    console.log(`Overall Status: ${overallStatus}`);
    console.log('');

    process.exit(summary.isReady ? 0 : 1);
  }

  // Run validation
  const result = validateEnv(environment);

  if (result.isValid) {
    console.log('Environment validation PASSED');
    console.log('');

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
      console.log('');
    }

    console.log(`All required variables are set for ${environment} environment.`);
    console.log('');
    process.exit(0);
  } else {
    console.log('Environment validation FAILED');
    console.log('');

    // Group errors by category
    const byCategory = {};
    for (const error of result.errors) {
      if (!byCategory[error.category]) {
        byCategory[error.category] = [];
      }
      byCategory[error.category].push(error);
    }

    console.log('Missing or Invalid Variables:');
    console.log('');

    for (const [category, errors] of Object.entries(byCategory)) {
      console.log(`  ${category}:`);
      for (const error of errors) {
        console.log(`    - ${error.variable}: ${error.reason}`);
        if (args.verbose) {
          console.log(`      ${error.description}`);
        }
      }
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
      console.log('');
    }

    console.log('Please set the missing variables in your .env file.');
    console.log('Refer to .env.example for documentation.');
    console.log('');

    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(2);
});
