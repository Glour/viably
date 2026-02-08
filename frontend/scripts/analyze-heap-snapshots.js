#!/usr/bin/env node

/**
 * Heap Snapshot Analysis Script
 *
 * Analyzes Chrome DevTools heap snapshots to calculate memory release metrics
 * for Monaco Editor disposal verification.
 *
 * Usage:
 *   1. Take 3 heap snapshots in Chrome DevTools:
 *      - Snapshot 1: Baseline (no editor)
 *      - Snapshot 2: With Editor (editor loaded)
 *      - Snapshot 3: After Close + GC (editor disposed)
 *
 *   2. Export snapshots as .heapsnapshot files:
 *      Right-click snapshot → "Save as..."
 *
 *   3. Run this script:
 *      node analyze-heap-snapshots.js baseline.heapsnapshot with-editor.heapsnapshot after-close.heapsnapshot
 *
 * Output:
 *   - Memory released percentage
 *   - Monaco-related objects count
 *   - Detailed comparison report
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function parseHeapSnapshot(filePath) {
  log(`\n📂 Reading: ${path.basename(filePath)}`, 'cyan');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const snapshot = JSON.parse(content);

    // Extract key metrics
    const totalSize = snapshot.snapshot?.meta?.total_size || 0;
    const nodeCount = snapshot.snapshot?.node_count || 0;
    const edgeCount = snapshot.snapshot?.edge_count || 0;

    // Search for Monaco-related objects
    const monacoObjects = {
      editor: 0,
      model: 0,
      monaco: 0,
      worker: 0,
    };

    // Parse nodes and strings to find Monaco-related objects
    const strings = snapshot.strings || [];
    const nodes = snapshot.nodes || [];

    // Search in strings for Monaco-related terms
    strings.forEach((str) => {
      const lowerStr = str.toLowerCase();
      if (lowerStr.includes('editor') && lowerStr.includes('standalone')) {
        monacoObjects.editor++;
      }
      if (lowerStr.includes('textmodel') || lowerStr.includes('model')) {
        monacoObjects.model++;
      }
      if (lowerStr.includes('monaco')) {
        monacoObjects.monaco++;
      }
      if (lowerStr.includes('editor.worker') || lowerStr.includes('ts.worker')) {
        monacoObjects.worker++;
      }
    });

    log(`   Total Size: ${formatBytes(totalSize)}`, 'gray');
    log(`   Node Count: ${nodeCount.toLocaleString()}`, 'gray');
    log(`   Edge Count: ${edgeCount.toLocaleString()}`, 'gray');
    log(
      `   Monaco Objects: ${monacoObjects.editor + monacoObjects.model + monacoObjects.monaco}`,
      'gray'
    );

    return {
      totalSize,
      nodeCount,
      edgeCount,
      monacoObjects,
      fileName: path.basename(filePath),
    };
  } catch (error) {
    log(`❌ Error reading ${filePath}: ${error.message}`, 'red');
    process.exit(1);
  }
}

function analyzeSnapshots(baseline, withEditor, afterClose) {
  log('\n' + '='.repeat(80), 'bright');
  log('📊 HEAP SNAPSHOT ANALYSIS REPORT', 'bright');
  log('='.repeat(80) + '\n', 'bright');

  // Calculate growth and release
  const editorMemory = withEditor.totalSize - baseline.totalSize;
  const memoryReleased = withEditor.totalSize - afterClose.totalSize;
  const remainingGrowth = afterClose.totalSize - baseline.totalSize;

  const releasePercent = (memoryReleased / editorMemory) * 100;
  const remainingPercent = (remainingGrowth / baseline.totalSize) * 100;

  // Summary table
  log('📈 MEMORY METRICS', 'blue');
  log('─'.repeat(80), 'gray');

  console.table({
    Baseline: {
      'Heap Size': formatBytes(baseline.totalSize),
      'Node Count': baseline.nodeCount.toLocaleString(),
      'Monaco Objects': baseline.monacoObjects.monaco,
    },
    'With Editor': {
      'Heap Size': formatBytes(withEditor.totalSize),
      'Node Count': withEditor.nodeCount.toLocaleString(),
      'Monaco Objects': withEditor.monacoObjects.monaco,
    },
    'After Close': {
      'Heap Size': formatBytes(afterClose.totalSize),
      'Node Count': afterClose.nodeCount.toLocaleString(),
      'Monaco Objects': afterClose.monacoObjects.monaco,
    },
  });

  log('\n🧮 CALCULATED METRICS', 'blue');
  log('─'.repeat(80), 'gray');

  console.table({
    'Editor Memory': {
      Value: formatBytes(editorMemory),
      Percentage: `+${((editorMemory / baseline.totalSize) * 100).toFixed(2)}%`,
    },
    'Memory Released': {
      Value: formatBytes(memoryReleased),
      Percentage: `${releasePercent.toFixed(2)}%`,
    },
    'Remaining Growth': {
      Value: formatBytes(remainingGrowth),
      Percentage: `+${remainingPercent.toFixed(2)}%`,
    },
  });

  // Monaco objects analysis
  log('\n🔍 MONACO OBJECTS ANALYSIS', 'blue');
  log('─'.repeat(80), 'gray');

  console.table({
    Baseline: baseline.monacoObjects,
    'With Editor': withEditor.monacoObjects,
    'After Close': afterClose.monacoObjects,
  });

  // Pass/Fail evaluation
  log('\n✅ TEST RESULTS', 'blue');
  log('─'.repeat(80), 'gray');

  const results = [];

  // Memory Release Test
  if (releasePercent >= 90) {
    results.push({
      Test: 'Memory Release',
      Result: 'PASS',
      Value: `${releasePercent.toFixed(2)}%`,
      Target: '>90%',
      Status: '✅',
    });
  } else if (releasePercent >= 70) {
    results.push({
      Test: 'Memory Release',
      Result: 'WARNING',
      Value: `${releasePercent.toFixed(2)}%`,
      Target: '>90%',
      Status: '⚠️',
    });
  } else {
    results.push({
      Test: 'Memory Release',
      Result: 'FAIL',
      Value: `${releasePercent.toFixed(2)}%`,
      Target: '>90%',
      Status: '❌',
    });
  }

  // Remaining Growth Test
  if (remainingPercent < 5) {
    results.push({
      Test: 'Remaining Growth',
      Result: 'PASS',
      Value: `+${remainingPercent.toFixed(2)}%`,
      Target: '<5%',
      Status: '✅',
    });
  } else if (remainingPercent < 10) {
    results.push({
      Test: 'Remaining Growth',
      Result: 'WARNING',
      Value: `+${remainingPercent.toFixed(2)}%`,
      Target: '<5%',
      Status: '⚠️',
    });
  } else {
    results.push({
      Test: 'Remaining Growth',
      Result: 'FAIL',
      Value: `+${remainingPercent.toFixed(2)}%`,
      Target: '<5%',
      Status: '❌',
    });
  }

  // Monaco Objects Test
  const monacoRetained = afterClose.monacoObjects.monaco;
  if (monacoRetained < 5) {
    results.push({
      Test: 'Monaco Objects',
      Result: 'PASS',
      Value: monacoRetained,
      Target: '<5',
      Status: '✅',
    });
  } else if (monacoRetained < 20) {
    results.push({
      Test: 'Monaco Objects',
      Result: 'WARNING',
      Value: monacoRetained,
      Target: '<5',
      Status: '⚠️',
    });
  } else {
    results.push({
      Test: 'Monaco Objects',
      Result: 'FAIL',
      Value: monacoRetained,
      Target: '<5',
      Status: '❌',
    });
  }

  console.table(results);

  // Overall verdict
  const failCount = results.filter((r) => r.Result === 'FAIL').length;
  const warningCount = results.filter((r) => r.Result === 'WARNING').length;

  log('\n' + '='.repeat(80), 'bright');
  if (failCount === 0 && warningCount === 0) {
    log('🎉 OVERALL: PASS - Monaco Editor disposal is working correctly', 'green');
  } else if (failCount === 0) {
    log(
      `⚠️  OVERALL: WARNING - ${warningCount} test(s) need improvement`,
      'yellow'
    );
  } else {
    log(
      `❌ OVERALL: FAIL - ${failCount} test(s) failed, possible memory leak detected`,
      'red'
    );
  }
  log('='.repeat(80) + '\n', 'bright');

  // Recommendations
  if (failCount > 0 || warningCount > 0) {
    log('📝 RECOMMENDATIONS', 'blue');
    log('─'.repeat(80), 'gray');

    if (releasePercent < 90) {
      log(
        '   • Review useMonacoEditor disposal logic (editor.dispose() and model.dispose())',
        'yellow'
      );
      log('   • Check for event listeners not being removed', 'yellow');
      log('   • Look for closures capturing editor/model references', 'yellow');
    }

    if (remainingPercent > 5) {
      log('   • Force more GC cycles (3-5 times) before taking final snapshot', 'yellow');
      log('   • Close and reopen DevTools to release internal references', 'yellow');
    }

    if (monacoRetained > 5) {
      log('   • Check for global references to editor/model instances', 'yellow');
      log('   • Verify useComponentCleanup is properly integrated', 'yellow');
      log('   • Search for detached DOM nodes in DevTools Memory tab', 'yellow');
    }

    log('');
  }

  // Export results
  const reportData = {
    timestamp: new Date().toISOString(),
    snapshots: {
      baseline: baseline.fileName,
      withEditor: withEditor.fileName,
      afterClose: afterClose.fileName,
    },
    metrics: {
      baseline: baseline.totalSize,
      withEditor: withEditor.totalSize,
      afterClose: afterClose.totalSize,
      editorMemory,
      memoryReleased,
      remainingGrowth,
      releasePercent,
      remainingPercent,
    },
    monacoObjects: {
      baseline: baseline.monacoObjects,
      withEditor: withEditor.monacoObjects,
      afterClose: afterClose.monacoObjects,
    },
    results,
  };

  const reportPath = path.join(__dirname, 'heap-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`💾 Detailed report saved to: ${reportPath}`, 'cyan');
  log('');
}

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    log('❌ Invalid usage\n', 'red');
    log('Usage:', 'bright');
    log(
      '  node analyze-heap-snapshots.js <baseline.heapsnapshot> <with-editor.heapsnapshot> <after-close.heapsnapshot>\n',
      'gray'
    );
    log('Example:', 'bright');
    log(
      '  node analyze-heap-snapshots.js baseline.heapsnapshot editor.heapsnapshot closed.heapsnapshot\n',
      'gray'
    );
    process.exit(1);
  }

  const [baselinePath, withEditorPath, afterClosePath] = args;

  // Check if files exist
  [baselinePath, withEditorPath, afterClosePath].forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      log(`❌ File not found: ${filePath}`, 'red');
      process.exit(1);
    }
  });

  // Parse snapshots
  const baseline = parseHeapSnapshot(baselinePath);
  const withEditor = parseHeapSnapshot(withEditorPath);
  const afterClose = parseHeapSnapshot(afterClosePath);

  // Analyze and report
  analyzeSnapshots(baseline, withEditor, afterClose);
}

main();
