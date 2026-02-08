#!/usr/bin/env node

/**
 * Heap Snapshot Analyzer
 * 
 * Analyzes Chrome DevTools .heapsnapshot files to identify memory usage by JavaScript libraries.
 * 
 * Usage:
 *   node analyze-heap-snapshot.js <snapshot-file.heapsnapshot>
 * 
 * Output:
 *   - Console: Top 10 libraries by retained memory
 *   - File: heap-analysis-report.json
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
}

function parseHeapSnapshot(filePath) {
  log('\n🔍 Parsing heap snapshot...', 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Error: File not found: ${filePath}`, 'red');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  let snapshot;
  try {
    snapshot = JSON.parse(fileContent);
  } catch (error) {
    log(`❌ Error: Invalid JSON in snapshot file: ${error.message}`, 'red');
    process.exit(1);
  }

  log('✅ Snapshot parsed successfully', 'green');
  return snapshot;
}

function analyzeSnapshot(snapshot) {
  log('\n📊 Analyzing memory usage...', 'cyan');

  const { nodes, edges, strings } = snapshot.snapshot;
  const nodeFields = snapshot.snapshot.meta.node_fields;
  const edgeFields = snapshot.snapshot.meta.edge_fields;
  
  // Field indices
  const nodeTypeIdx = nodeFields.indexOf('type');
  const nodeNameIdx = nodeFields.indexOf('name');
  const nodeSelfSizeIdx = nodeFields.indexOf('self_size');
  const nodeEdgeCountIdx = nodeFields.indexOf('edge_count');
  const nodeFieldCount = nodeFields.length;
  
  const edgeTypeIdx = edgeFields.indexOf('type');
  const edgeNameIdx = edgeFields.indexOf('name_or_index');
  const edgeToNodeIdx = edgeFields.indexOf('to_node');
  const edgeFieldCount = edgeFields.length;

  // Library detection patterns
  const libraryPatterns = [
    { name: 'monaco-editor', pattern: /monaco|monaco-editor/i },
    { name: '@sentry/browser', pattern: /sentry|__SENTRY__|@sentry/i },
    { name: 'posthog-js', pattern: /posthog|__POSTHOG__/i },
    { name: 'react-query', pattern: /react-query|QueryClient|@tanstack/i },
    { name: 'zustand', pattern: /zustand|useStore/i },
    { name: 'next', pattern: /next|__NEXT__|_next/i },
    { name: 'react', pattern: /^react$|React|ReactDOM/i },
    { name: 'lucide-react', pattern: /lucide/i },
    { name: '@radix-ui', pattern: /radix-ui|@radix/i },
    { name: 'framer-motion', pattern: /framer|motion/i },
    { name: 'zod', pattern: /^zod$|ZodError|ZodSchema/i },
    { name: 'react-hook-form', pattern: /react-hook-form|useForm/i },
    { name: 'ky', pattern: /^ky$|KyRequest/i },
    { name: 'sonner', pattern: /sonner|toast/i },
  ];

  const libraryMemory = {};
  libraryPatterns.forEach(lib => {
    libraryMemory[lib.name] = { size: 0, objects: 0, pattern: lib.pattern };
  });
  libraryMemory['other'] = { size: 0, objects: 0 };

  // Analyze nodes
  let totalSize = 0;
  let totalObjects = 0;

  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const nodeType = nodes[i + nodeTypeIdx];
    const nodeName = strings[nodes[i + nodeNameIdx]];
    const selfSize = nodes[i + nodeSelfSizeIdx];
    
    // Skip hidden/system nodes
    if (nodeType === 0 || nodeType === 1) continue;
    
    totalSize += selfSize;
    totalObjects++;

    // Match against library patterns
    let matched = false;
    for (const [libName, libData] of Object.entries(libraryMemory)) {
      if (libName === 'other') continue;
      
      if (libData.pattern.test(nodeName)) {
        libData.size += selfSize;
        libData.objects++;
        matched = true;
        break;
      }
    }

    if (!matched && selfSize > 0) {
      libraryMemory['other'].size += selfSize;
      libraryMemory['other'].objects++;
    }
  }

  log('✅ Analysis complete', 'green');

  return {
    totalSize,
    totalObjects,
    libraryMemory,
    metadata: {
      snapshotTitle: snapshot.snapshot.title || 'Unknown',
      nodeCount: nodes.length / nodeFieldCount,
      edgeCount: edges.length / edgeFieldCount,
      stringCount: strings.length,
    }
  };
}

function generateReport(analysis, outputPath) {
  log('\n📝 Generating report...', 'cyan');

  // Sort libraries by size
  const sortedLibraries = Object.entries(analysis.libraryMemory)
    .map(([name, data]) => ({ name, ...data }))
    .filter(lib => lib.size > 0)
    .sort((a, b) => b.size - a.size);

  // Console output
  log('\n' + '='.repeat(80), 'bright');
  log('📊 TOP 10 LIBRARIES BY MEMORY USAGE', 'bright');
  log('='.repeat(80), 'bright');
  
  log(`\nTotal Heap Size: ${formatBytes(analysis.totalSize)}`, 'yellow');
  log(`Total Objects: ${analysis.totalObjects.toLocaleString()}`, 'yellow');
  log(`Snapshot Nodes: ${analysis.metadata.nodeCount.toLocaleString()}`, 'yellow');
  log('\n' + '-'.repeat(80), 'bright');
  
  const top10 = sortedLibraries.slice(0, 10);
  top10.forEach((lib, index) => {
    const percentage = ((lib.size / analysis.totalSize) * 100).toFixed(2);
    const color = index < 3 ? 'red' : index < 6 ? 'yellow' : 'green';
    
    log(
      `${index + 1}. ${lib.name.padEnd(30)} ${formatBytes(lib.size).padStart(12)} (${percentage}%)  ${lib.objects.toLocaleString()} objects`,
      color
    );
  });
  
  log('-'.repeat(80) + '\n', 'bright');

  // JSON report
  const report = {
    timestamp: new Date().toISOString(),
    metadata: analysis.metadata,
    summary: {
      totalSize: analysis.totalSize,
      totalSizeFormatted: formatBytes(analysis.totalSize),
      totalObjects: analysis.totalObjects,
    },
    libraries: sortedLibraries.map(lib => ({
      name: lib.name,
      size: lib.size,
      sizeFormatted: formatBytes(lib.size),
      objects: lib.objects,
      percentage: ((lib.size / analysis.totalSize) * 100).toFixed(2),
    })),
    top10: top10.map(lib => ({
      name: lib.name,
      size: lib.size,
      sizeFormatted: formatBytes(lib.size),
      objects: lib.objects,
      percentage: ((lib.size / analysis.totalSize) * 100).toFixed(2),
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  log(`✅ Report saved to: ${outputPath}`, 'green');

  return report;
}

function main() {
  log('\n' + '='.repeat(80), 'bright');
  log('🔬 CHROME HEAP SNAPSHOT ANALYZER', 'bright');
  log('='.repeat(80) + '\n', 'bright');

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('❌ Error: Missing snapshot file argument', 'red');
    log('\nUsage:', 'yellow');
    log('  node analyze-heap-snapshot.js <snapshot-file.heapsnapshot>', 'cyan');
    log('\nExample:', 'yellow');
    log('  node analyze-heap-snapshot.js heap-snapshot-dashboard-2026-02-08.heapsnapshot', 'cyan');
    process.exit(1);
  }

  const snapshotPath = path.resolve(args[0]);
  const outputPath = path.join(
    path.dirname(snapshotPath),
    'heap-analysis-report.json'
  );

  log(`📁 Snapshot file: ${snapshotPath}`, 'cyan');
  log(`📁 Output report: ${outputPath}`, 'cyan');

  try {
    const snapshot = parseHeapSnapshot(snapshotPath);
    const analysis = analyzeSnapshot(snapshot);
    const report = generateReport(analysis, outputPath);

    log('\n✅ Analysis complete!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Review top 10 libraries above', 'cyan');
    log('2. Check heap-analysis-report.json for detailed data', 'cyan');
    log('3. Compare with bundle analysis (npm run analyze)', 'cyan');
    log('4. Document findings in .tmp/current/heap-snapshot-analysis.md', 'cyan');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = { parseHeapSnapshot, analyzeSnapshot, generateReport };
