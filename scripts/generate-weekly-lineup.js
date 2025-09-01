#!/usr/bin/env node

/**
 * Weekly Lineup Generator
 * Simple script to generate fair lineups for each week
 */

const RotationManager = require('./rotation-manager.cjs');

console.log('🏆 QPR U11B Weekly Lineup Generator');
console.log('===================================\n');

const manager = new RotationManager();

// Generate this week's lineup
const lineup = manager.generateAndSave();

console.log('\n📋 FINAL LINEUP FOR THIS WEEK:');
console.log('==============================');

console.log('\n🏅 CAPTAINS:');
console.log(`  1st Half: ${lineup.captains.first_half} (starts at CB)`);
console.log(`  2nd Half: ${lineup.captains.second_half} (starts benched)`);

console.log('\n🥅 GOALKEEPERS:');
console.log(`  1st Half: ${lineup.goalkeepers.first_half} (starts in goal)`);
console.log(`  2nd Half: ${lineup.goalkeepers.second_half} (starts in field)`);

console.log('\n⚽ STARTING 8:');
lineup.starting.forEach(player => {
  const badge = player.name === lineup.captains.first_half ? ' ⭐' : '';
  const gkNote = player.name === lineup.goalkeepers.second_half ? ' (→GK 2nd half)' : '';
  console.log(`  ${player.pos}: ${player.name}${badge}${gkNote}`);
});

console.log('\n🔄 ROTATING SQUAD:');
lineup.rotating.forEach(player => {
  const captainNote = player.name === lineup.captains.second_half ? ' ⭐ (Captain 2nd half)' : '';
  console.log(`  ${player.name}${captainNote}`);
});

console.log('\n🔄 HALF-TIME CHANGES:');
console.log(`  • ${lineup.captains.second_half} comes in at CB`);
console.log(`  • ${lineup.goalkeepers.first_half} moves to field`); 
console.log(`  • ${lineup.goalkeepers.second_half} moves to goal`);

manager.showFairnessStats();
