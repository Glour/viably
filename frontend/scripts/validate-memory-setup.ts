#!/usr/bin/env tsx
/**
 * Validation script for memory testing setup
 *
 * Verifies that:
 * - Scripts are properly configured
 * - Required dependencies are available
 * - File structure is correct
 *
 * Usage:
 *   npx tsx scripts/validate-memory-setup.ts
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

interface ValidationResult {
  check: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: ValidationResult[] = []

function check(name: string, condition: boolean, message: string, warnOnly = false): void {
  results.push({
    check: name,
    status: condition ? 'pass' : (warnOnly ? 'warn' : 'fail'),
    message,
  })
}

async function validateSetup(): Promise<void> {
  console.log('🔍 Validating memory testing setup...\n')

  // Check test scripts exist
  const testFiles = [
    'scripts/test-memory-concurrent.ts',
    'scripts/test-memory-stores.ts',
    'scripts/README-MEMORY-TESTS.md',
  ]

  testFiles.forEach(file => {
    const fullPath = resolve(process.cwd(), file)
    check(
      `File: ${file}`,
      existsSync(fullPath),
      existsSync(fullPath) ? `✓ Found` : `✗ Missing`
    )
  })

  // Check package.json scripts
  const pkg = await import('../package.json')
  check(
    'NPM script: test:memory',
    'test:memory' in pkg.scripts,
    'test:memory' in pkg.scripts ? '✓ Configured' : '✗ Not configured'
  )
  check(
    'NPM script: test:memory:stores',
    'test:memory:stores' in pkg.scripts,
    'test:memory:stores' in pkg.scripts ? '✓ Configured' : '✗ Not configured'
  )

  // Check dependencies
  const hasTsx = 'tsx' in (pkg.devDependencies || {})
  check(
    'Dependency: tsx',
    hasTsx,
    hasTsx ? '✓ Installed' : '✗ Missing (run: npm install -D tsx)'
  )

  const hasPlaywright = '@playwright/test' in (pkg.devDependencies || {})
  check(
    'Dependency: @playwright/test',
    hasPlaywright,
    hasPlaywright ? '✓ Installed' : '✗ Missing'
  )

  // Check output directory
  const tmpDir = resolve(process.cwd(), '.tmp/current')
  check(
    'Output directory: .tmp/current',
    existsSync(tmpDir) || true, // Will be created on first run
    existsSync(tmpDir) ? '✓ Exists' : '⚠ Will be created on first run',
    true
  )

  // Check for memory API availability
  const hasMemoryAPI = typeof process !== 'undefined' && !!process.memoryUsage
  check(
    'Node.js memory API',
    hasMemoryAPI,
    hasMemoryAPI ? '✓ Available' : '✗ Not available'
  )

  // Check store files
  const storeFiles = [
    'stores/projects.ts',
    'stores/generation.ts',
    'stores/templates.ts',
    'stores/auth.ts',
    'stores/settings.ts',
  ]

  storeFiles.forEach(file => {
    const fullPath = resolve(process.cwd(), file)
    check(
      `Store: ${file}`,
      existsSync(fullPath),
      existsSync(fullPath) ? '✓ Found' : '✗ Missing',
      true // Warn only, not critical for basic tests
    )
  })

  // Print results
  console.log('Results:')
  console.log('─'.repeat(80))

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌'
    console.log(`${icon} ${result.check.padEnd(40)} ${result.message}`)
  })

  console.log('─'.repeat(80))
  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warned} warnings`)

  if (failed === 0) {
    console.log('\n✅ Setup validation passed! You can run the memory tests.')
    console.log('\nQuick start:')
    console.log('  1. Fast test (no server): npm run test:memory:stores')
    console.log('  2. Full test (needs server): npm run dev & npm run test:memory')
    console.log('\nSee scripts/README-MEMORY-TESTS.md for detailed instructions.')
  } else {
    console.log('\n❌ Setup validation failed. Please fix the issues above.')
    process.exit(1)
  }
}

validateSetup().catch(console.error)
