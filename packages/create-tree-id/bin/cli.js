#!/usr/bin/env node
// Entry point for the create-tree-id CLI
// Delegates to the compiled ESM bundle in dist/
import('../dist/index.js').then((m) => m.main()).catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
