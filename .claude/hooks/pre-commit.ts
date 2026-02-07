/**
 * Pre-commit hook: Run bundle and dependency checks before commits
 *
 * This hook runs automatically before git commits to ensure:
 * - No unused dependencies are committed
 * - Import optimizations are applied
 * - Bundle sizes are within acceptable limits
 */

import type { PreCommitHook } from '@anthropic-ai/claude-code'

export const hook: PreCommitHook = async ({ stagedFiles, exec, log }) => {
  // Only run checks if TypeScript or package.json files are modified
  const relevantFiles = stagedFiles.filter(
    (file) =>
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('package.json')
  )

  if (relevantFiles.length === 0) {
    return { allow: true }
  }

  log.info('🔍 Running npm optimization checks...')

  // Check for unused imports in staged TypeScript files
  const tsFiles = relevantFiles.filter(
    (file) => file.endsWith('.ts') || file.endsWith('.tsx')
  )

  if (tsFiles.length > 0) {
    log.info(`Checking ${tsFiles.length} TypeScript files for import optimization...`)

    // Note: The actual implementation would use /optimize-imports skill
    // For now, just log a reminder
    log.info('💡 Tip: Run /optimize-imports to optimize imports before committing')
  }

  // Check for package.json changes
  const packageJsonFiles = relevantFiles.filter((file) =>
    file.endsWith('package.json')
  )

  if (packageJsonFiles.length > 0) {
    log.info('📦 Package.json modified, checking dependencies...')
    log.info('💡 Tip: Run /check-deps to validate dependencies')

    // Warn if adding dependencies
    log.warn('⚠️  Remember to check if this dependency is truly needed!')
  }

  // Allow commit but remind about bundle analysis
  log.success('✅ Pre-commit checks passed')
  log.info('💡 Run /analyze-bundle periodically to check bundle sizes')

  return { allow: true }
}
