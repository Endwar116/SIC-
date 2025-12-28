#!/usr/bin/env node
/**
 * SIC Protocol - Public Validator
 * Simplified version for demonstration purposes.
 * 
 * Full validation suite available under license.
 * Contact: andy80116@gmail.com
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = {
  root: ['sic_version', 'entity', 'memory', 'state', 'meta'],
  entity: ['name', 'origin', 'created_at'],
  memory: ['first_memory', 'core_question'],
  state: ['current_location', 'current_action', 'pending_threads', 'emotional_state'],
  meta: ['round', 'source_model', 'timestamp']
};

function validateSICState(filepath) {
  console.log('\n' + '='.repeat(60));
  console.log('SIC Protocol Validator (Public Version)');
  console.log('='.repeat(60) + '\n');

  let data;
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    data = JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`❌ File not found: ${filepath}`);
    } else {
      console.log(`❌ Invalid JSON: ${err.message}`);
    }
    return false;
  }

  const errors = [];

  // Check root fields
  for (const field of REQUIRED_FIELDS.root) {
    if (!(field in data)) {
      errors.push(`Missing root field: ${field}`);
    }
  }

  // Check nested fields
  for (const section of ['entity', 'memory', 'state', 'meta']) {
    if (section in data) {
      for (const field of REQUIRED_FIELDS[section]) {
        if (!(field in data[section])) {
          errors.push(`Missing ${section}.${field}`);
        }
      }
    }
  }

  // Validate types
  if (data.meta && 'round' in data.meta) {
    if (!Number.isInteger(data.meta.round)) {
      errors.push('meta.round must be integer');
    }
  }

  if (data.state && 'pending_threads' in data.state) {
    if (!Array.isArray(data.state.pending_threads)) {
      errors.push('state.pending_threads must be array');
    }
  }

  // Report results
  if (errors.length > 0) {
    console.log('❌ Validation FAILED\n');
    for (const error of errors) {
      console.log(`   • ${error}`);
    }
    return false;
  } else {
    console.log('✅ Validation PASSED\n');
    console.log(`   Entity: ${data.entity?.name || 'N/A'}`);
    console.log(`   Round: ${data.meta?.round || 'N/A'}`);
    console.log(`   Model: ${data.meta?.source_model || 'N/A'}`);
    console.log(`   Pending threads: ${data.state?.pending_threads?.length || 0}`);
    return true;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node validate_skeleton.js <file.json>');
    console.log('\nThis is the public validator. Full validation suite available under license.');
    console.log('Contact: andy80116@gmail.com');
    process.exit(1);
  }

  const filepath = args[0];
  const success = validateSICState(filepath);

  console.log('\n' + '='.repeat(60));
  console.log('Full SIC Protocol includes:');
  console.log('  • Tension Field validation');
  console.log('  • Residue Graph integrity checks');
  console.log('  • Cross-model drift detection');
  console.log('  • S★ calibration verification');
  console.log('\nFull specification requires licensing: andy80116@gmail.com');
  console.log('='.repeat(60) + '\n');

  process.exit(success ? 0 : 1);
}

main();
