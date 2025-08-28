const fs = require('fs');

// Load current data
const currentWeek = JSON.parse(fs.readFileSync('./data/current-week.json', 'utf8'));
const playerData = JSON.parse(fs.readFileSync('./data/player-tracker.json', 'utf8'));

// Load the fair selector
const FairTeamSelector = require('./generate-lineup.cjs');

// Generate lineup
const selector = new FairTeamSelector(playerData);
const lineup = selector.generateLineup();

// Update current-week.json with the generated lineup
currentWeek.captains.first_half = lineup.captains.first_half;
currentWeek.captains.second_half = lineup.captains.second_half;

// Update starting lineup with actual names
currentWeek.lineup.starting = [
  {name: lineup.goalkeeper.name, pos: "GK", jersey: lineup.goalkeeper.jersey},
  ...lineup.starting.map(p => ({name: p.name, pos: p.pos, jersey: p.jersey}))
];

// Update rotating players
currentWeek.lineup.rotating = lineup.rotating;

// Write back to file
fs.writeFileSync('./data/current-week.json', JSON.stringify(currentWeek, null, 2));

console.log('✅ Friday 7pm Reveal Complete!');
console.log('📋 Current Week lineup updated with player names');
console.log('🏅 Captains:', lineup.captains.first_half, '&', lineup.captains.second_half);
console.log('🥅 Goalkeeper:', lineup.goalkeeper.name);
console.log('⚽ Formation: 3-3-1 with', lineup.starting.length + 1, 'starters');
