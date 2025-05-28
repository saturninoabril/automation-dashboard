const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('case_executions').del();
  await knex('spec_executions').del();
  await knex('known_issues').del();
  await knex('cycles').del();

  // --- Generate 30 cycles across different branches ---
  const branchNames = [
    'main', 'develop', 'feature/login', 'feature/payment', 'feature/profile',
    'release/v1.0', 'release/v1.1', 'hotfix/urgent', 'test/experimental', 'bugfix/minor'
  ];
  
  const cycles = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const branchIndex = i < 10 ? 0 : Math.floor((i - 10) / 2) % (branchNames.length - 1) + 1;
    const branch = branchNames[branchIndex];
    
    cycles.push({
      id: uuidv4(),
      repo: 'mattermost',
      branch: branch,
      build: `build-${1000 + i}`,
      state: i % 2 === 0 ? 'completed' : 'running',
      specs_registered: 15 + (i % 5),
      specs_done: 15 + (i % 5) - (i % 3),
      duration: 1200 + i * 50,
      pass: 150 + i * 5,
      fail: 0, // will update below
      pending: i % 3,
      skipped: i % 4,
      start_at: new Date(now.getTime() - (i * 6 * 3600000)), // 6 hours apart
      end_at: i % 2 === 0 ? new Date(now.getTime() - (i * 6 * 3600000) + 1800000) : null,
      cypress_version: '12.0.0',
      browser_name: i % 2 === 0 ? 'chrome' : 'firefox',
      browser_version: '112.0.0',
      headless: i % 2 === 0,
      os_name: i % 2 === 0 ? 'linux' : 'macos',
      os_version: i % 2 === 0 ? '20.04' : '13.2.1',
      node_version: '18.12.1',
      known_fail: 0,
      bug: 0,
      flaky: 0
    });
  }

  // Insert cycles and get their IDs
  const insertedCycles = await knex('cycles').insert(cycles).returning('*');

  // --- Known issues ---
  await knex('known_issues').insert([
    {
      id: uuidv4(),
      cycle_id: insertedCycles[0].id,
      hash: 'a1b2c3d4e5',
      data: {
        title: 'Login button not working in Safari',
        description: 'The login button fails to respond in Safari browser',
        workaround: 'Use Chrome or Firefox for now'
      }
    }
  ]);

  // --- Spec executions and case executions ---
  const specExecutions = [];
  const caseExecutions = [];

  // Helper to create a spec execution and its cases
  function addSpecAndCases({ cycleIdx, specIdx, failingTests }) {
    const cycle = insertedCycles[cycleIdx];
    const specId = uuidv4();
    // Make spec file unique per cycle by including cycle index
    const file = `cypress/e2e/spec_${cycle.branch.replace(/\W/g, '_')}_${specIdx}_cycle${cycleIdx}.cy.js`;
    const totalTests = 5;
    const failCount = failingTests.length;
    const state = failCount > 0 ? 'failed' : 'passed';
    const duration = 100 + specIdx * 10;
    const pass = totalTests - failCount;
    
    specExecutions.push({
      id: specId,
      file,
      server: `server-${(cycleIdx % 3) + 1}`,
      state,
      duration,
      tests: totalTests,
      pass,
      fail: failCount,
      pending: 0,
      skipped: 0,
      test_start_at: new Date(cycle.start_at.getTime() + 10000),
      test_end_at: new Date(cycle.start_at.getTime() + duration * 1000),
      start_at: cycle.start_at,
      end_at: new Date(cycle.start_at.getTime() + duration * 1000),
      cycle_id: cycle.id,
      bug: failCount > 0 ? 1 : 0,
      known: 0,
      flaky: 0,
      last_execution: {
        duration,
        state,
        timestamp: new Date(cycle.start_at.getTime() + 10000)
      }
    });

    // Add failing cases
    failingTests.forEach((testNum, i) => {
      caseExecutions.push({
        id: uuidv4(),
        spec_file: file,
        title: [`Spec ${specIdx}`, `Failing Test ${testNum}`],
        full_title: `Spec ${specIdx} Failing Test ${testNum}`,
        key: `spec-${specIdx}-failing-test-${testNum}`,
        key_step: `should fail test ${testNum}`,
        state: 'failed',
        duration: 20 + i * 5,
        test_start_at: new Date(cycle.start_at.getTime() + (i + 1) * 1000),
        cycle_id: cycle.id,
        spec_execution_id: specId,
        code: `cy.failTest(${testNum});`,
        error_display: `Error: Test ${testNum} failed`,
        error_frame: `spec_${specIdx}.js:${10 + i}`,
        screenshot: null,
        last_execution: {
          state: 'failed',
          duration: 20 + i * 5,
          timestamp: new Date(cycle.start_at.getTime() + (i + 1) * 1000),
          error: `Error: Test ${testNum} failed`
        }
      });
    });

    // Add passing cases
    const passingTests = Array.from({length: totalTests}, (_, i) => i + 1)
      .filter(num => !failingTests.includes(num));
      
    passingTests.forEach((testNum, i) => {
      caseExecutions.push({
        id: uuidv4(),
        spec_file: file,
        title: [`Spec ${specIdx}`, `Passing Test ${testNum}`],
        full_title: `Spec ${specIdx} Passing Test ${testNum}`,
        key: `spec-${specIdx}-passing-test-${testNum}`,
        key_step: `should pass test ${testNum}`,
        state: 'passed',
        duration: 15 + i * 3,
        test_start_at: new Date(cycle.start_at.getTime() + (failCount + i + 1) * 1000),
        cycle_id: cycle.id,
        spec_execution_id: specId,
        code: `cy.passTest(${testNum});`,
        error_display: null,
        error_frame: null,
        screenshot: null,
        last_execution: {
          state: 'passed',
          duration: 15 + i * 3,
          timestamp: new Date(cycle.start_at.getTime() + (failCount + i + 1) * 1000)
        }
      });
    });
  }

  // 1. Create 10 cycles for 'main' branch with specific failure patterns
  for (let i = 0; i < 10; i++) {
    // a. Test that fails on all 10 cycles (spec1, test1)
    addSpecAndCases({
      cycleIdx: i,
      specIdx: 1,
      failingTests: [1] // Test 1 fails every time
    });
    
    // b. Test that fails 3 times (spec2, test2 - fails on cycles 1, 3, 5)
    if (i % 2 === 0 && i < 6) {
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 2,
        failingTests: [2] // Test 2 fails on cycles 0, 2, 4 (indices 1, 3, 5)
      });
    } else {
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 2,
        failingTests: [] // No failures
      });
    }
    
    // c. Tests that fail 7 times (spec3, tests 1 and 2)
    if (i !== 2 && i !== 5 && i !== 8) { // Skip 3 cycles
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 3,
        failingTests: [1, 2] // Tests 1 and 2 fail
      });
    } else {
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 3,
        failingTests: [] // No failures
      });
    }
  }

  // 2. Create cycles for other branches with varied failure patterns
  for (let i = 10; i < 30; i++) {
    // Random failures for other branches
    const randomFailures = [];
    if (Math.random() > 0.3) {
      randomFailures.push(1); // Test 1 fails
      if (Math.random() > 0.7) {
        randomFailures.push(2); // Test 2 also fails
      }
    }
    
    addSpecAndCases({
      cycleIdx: i,
      specIdx: 1,
      failingTests: randomFailures
    });
    
    // Add some flaky tests (fail sometimes)
    if (i % 4 === 0) {
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 2,
        failingTests: [3]
      });
    } else {
      addSpecAndCases({
        cycleIdx: i,
        specIdx: 2,
        failingTests: []
      });
    }
  }

  // Insert all data
  await knex('spec_executions').insert(specExecutions);
  await knex('case_executions').insert(caseExecutions);
  
  // Update cycle failure counts based on actual data
  const cycleUpdates = await knex('cycles')
    .select('cycles.id')
    .count('case_executions.id as fail_count')
    .leftJoin('case_executions', function() {
      this.on('case_executions.cycle_id', '=', 'cycles.id')
        .andOn('case_executions.state', '=', knex.raw('?', ['failed']));
    })
    .groupBy('cycles.id');
    
  for (const update of cycleUpdates) {
    await knex('cycles')
      .where('id', update.id)
      .update('fail', update.fail_count);
  }
};
