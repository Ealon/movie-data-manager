#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

interface Config {
  prodDbUrl: string;
  localDbUrl: string;
  envFile: string;
}

const config: Config = {
  prodDbUrl: process.env.PROD_DATABASE_URL || "postgresql://user:password@prod-host:5432/dbname",
  localDbUrl: process.env.LOCAL_DATABASE_URL || "postgresql://user:password@localhost:5432/dbname",
  envFile: ".env"
};

function log(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };

  const prefix = {
    info: '[INFO]',
    warning: '[WARNING]',
    error: '[ERROR]'
  };

  console.log(`${colors[type]}${prefix[type]}${colors.reset} ${message}`);
}

function backupEnvFile() {
  if (existsSync(config.envFile)) {
    copyFileSync(config.envFile, `${config.envFile}.backup`);
    log(`Backed up ${config.envFile} to ${config.envFile}.backup`);
  }
}

function restoreEnvFile() {
  if (existsSync(`${config.envFile}.backup`)) {
    copyFileSync(`${config.envFile}.backup`, config.envFile);
    log(`Restored ${config.envFile} from backup`);
  }
}

function setDatabaseUrl(url: string) {
  writeFileSync(config.envFile, `DATABASE_URL="${url}"\n`);
}

function runCommand(command: string) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    throw error;
  }
}

function pullFromProd() {
  log('Pulling schema from production database...');

  backupEnvFile();

  try {
    // 设置生产数据库 URL
    setDatabaseUrl(config.prodDbUrl);

    // 拉取 schema
    runCommand('npx prisma db pull');

    // 生成 client
    runCommand('npx prisma generate');

    // 恢复本地数据库 URL
    setDatabaseUrl(config.localDbUrl);

    log('Schema pulled successfully from production');
  } catch (error) {
    log('Failed to pull from production', 'error');
    restoreEnvFile();
    throw error;
  }
}

function pushToProd() {
  log('This will overwrite production database schema!', 'warning');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Are you sure? (y/N): ', (answer: string) => {
    rl.close();

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      log('Pushing schema to production database...');

      backupEnvFile();

      try {
        // 设置生产数据库 URL
        setDatabaseUrl(config.prodDbUrl);

        // 推送 schema
        runCommand('npx prisma db push --accept-data-loss');

        // 生成 client
        runCommand('npx prisma generate');

        // 恢复本地数据库 URL
        setDatabaseUrl(config.localDbUrl);

        log('Schema pushed successfully to production');
      } catch (error) {
        log('Failed to push to production', 'error');
        restoreEnvFile();
        throw error;
      }
    } else {
      log('Operation cancelled');
    }
  });
}

function showHelp() {
  console.log(`
Usage: tsx sync-db.ts [pull|push] [prod]

Commands:
  pull prod   - Pull schema from production to local
  push prod   - Push local schema to production
  help        - Show this help message

Examples:
  tsx sync-db.ts pull prod  # Pull from production to local
  tsx sync-db.ts push prod  # Push from local to production

Environment Variables:
  PROD_DATABASE_URL  - Production database URL
  LOCAL_DATABASE_URL - Local database URL
`);
}

// 主逻辑
const command = process.argv[2];
const target = process.argv[3];

switch (command) {
  case 'pull':
    if (target === 'prod') {
      pullFromProd();
    } else {
      log('Invalid target. Use "prod" for production database', 'error');
      showHelp();
      process.exit(1);
    }
    break;

  case 'push':
    if (target === 'prod') {
      pushToProd();
    } else {
      log('Invalid target. Use "prod" for production database', 'error');
      showHelp();
      process.exit(1);
    }
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    log('Invalid command', 'error');
    showHelp();
    process.exit(1);
}
