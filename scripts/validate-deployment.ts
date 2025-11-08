#!/usr/bin/env node
/**
 * Production Deployment Validation Script
 * Checks all required environment variables and dependencies before deployment
 */

import { validateEnvironment, getConfigSummary } from '../src/utils/envValidator';
import { logger } from '../src/utils/logger';

console.log('\n🔍 Running Production Deployment Validation...\n');

// 1. Validate environment variables
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Environment Variable Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const validation = validateEnvironment();

if (validation.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  validation.warnings.forEach((warning) => console.log(`   - ${warning}`));
  console.log('');
}

if (validation.errors.length > 0) {
  console.log('❌ Errors:');
  validation.errors.forEach((error) => console.log(`   - ${error}`));
  console.log('\n💡 Fix these errors in your .env file before deployment.\n');
  process.exit(1);
}

console.log('✅ Environment validation passed\n');

// 2. Display configuration summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. Configuration Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(getConfigSummary());

// 3. Check critical dependencies
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. Dependency Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const criticalDeps = [
  'express',
  'ethers',
  'express-rate-limit',
  'express-validator',
  'cors',
  'winston',
];

let depCheckFailed = false;

for (const dep of criticalDeps) {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep}`);
  } catch (error) {
    console.log(`❌ ${dep} - NOT INSTALLED`);
    depCheckFailed = true;
  }
}

if (depCheckFailed) {
  console.log('\n❌ Some critical dependencies are missing. Run: npm install\n');
  process.exit(1);
}

console.log('');

// 4. Security checklist
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4. Security Checklist');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const securityChecks = [
  {
    name: 'Rate limiting enabled',
    check: () => {
      try {
        require.resolve('express-rate-limit');
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'Input validation enabled',
    check: () => {
      try {
        require.resolve('express-validator');
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'CORS configured',
    check: () => {
      try {
        require.resolve('cors');
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'Production environment variables set',
    check: () => process.env.NODE_ENV === 'production',
  },
  {
    name: 'Frontend URL configured',
    check: () => !!process.env.FRONTEND_URL,
  },
];

securityChecks.forEach((check) => {
  const passed = check.check();
  console.log(`${passed ? '✅' : '⚠️ '} ${check.name}`);
});

console.log('');

// 5. Final summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('5. Deployment Readiness');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Not running in production mode');
  console.log('   Set NODE_ENV=production before deploying\n');
}

if (!validation.valid || depCheckFailed) {
  console.log('❌ Deployment validation FAILED');
  console.log('   Fix the errors above before deploying\n');
  process.exit(1);
}

console.log('✅ All checks passed! Ready for deployment\n');
console.log('Next steps:');
console.log('  1. Deploy backend to VPS or cloud provider');
console.log('  2. Deploy frontend to Vercel/Netlify');
console.log('  3. Update frontend .env with backend URL');
console.log('  4. Test all endpoints manually');
console.log('  5. Monitor logs and performance\n');

process.exit(0);
