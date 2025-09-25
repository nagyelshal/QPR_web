#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load data files
const matchesPath = path.join(__dirname, '../data/matches.json');
const currentWeekPath = path.join(__dirname, '../data/current-week.json');

const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
const currentWeek = JSON.parse(fs.readFileSync(currentWeekPath, 'utf8'));

// All players in the team
const allPlayers = [
    { name: "Adam K", jersey: "13" },
    { name: "Alexander V", jersey: "8" },
    { name: "Andy E", jersey: "4" },
    { name: "Andrew N", jersey: "5" },
    { name: "David C", jersey: "14" },
    { name: "Ethan G", jersey: "15" },
    { name: "Henry K", jersey: "11" },
    { name: "Minh-An D", jersey: "2" },
    { name: "Niko D", jersey: "6" },
    { name: "Owen H", jersey: "9" },
    { name: "Rafael H", jersey: "12" },
    { name: "Rhodri W", jersey: "10" },
    { name: "Travis C", jersey: "3" },
    { name: "Yejun K", jersey: "7" },
    { name: "Eunjun K", jersey: "16" }
];

// Track who has been used
const usedGoalkeepers = new Set();
const usedCaptains = new Set();

// Extract used players from matches
matches.matches.forEach(match => {
    if (match.result !== 'cancelled' && match.result !== 'pending') {
        // Check explicit goalkeeper assignments
        if (match.goalkeepers) {
            if (match.goalkeepers.first_half) usedGoalkeepers.add(match.goalkeepers.first_half);
            if (match.goalkeepers.second_half) usedGoalkeepers.add(match.goalkeepers.second_half);
        }
        
        // Check starting lineup for GK position
        if (match.starting_lineup) {
            match.starting_lineup.forEach(player => {
                if (player.pos === 'GK') {
                    usedGoalkeepers.add(player.name);
                }
            });
        }
        
        // Check captains
        if (match.captains) {
            if (match.captains.first_half) usedCaptains.add(match.captains.first_half);
            if (match.captains.second_half) usedCaptains.add(match.captains.second_half);
        }
    }
});

console.log('Used Goalkeepers:', Array.from(usedGoalkeepers));
console.log('Used Captains:', Array.from(usedCaptains));

// Find available players
const availableGoalkeepers = allPlayers.filter(p => !usedGoalkeepers.has(p.name));
const availableCaptains = allPlayers.filter(p => !usedCaptains.has(p.name));

console.log('Available Goalkeepers:', availableGoalkeepers.map(p => p.name));
console.log('Available Captains:', availableCaptains.map(p => p.name));

if (availableGoalkeepers.length < 2) {
    console.error('ERROR: Not enough unused goalkeepers available!');
    process.exit(1);
}

if (availableCaptains.length < 2) {
    console.error('ERROR: Not enough unused captains available!');
    process.exit(1);
}

// Select next 2 of each
const selectedGoalkeepers = availableGoalkeepers.slice(0, 2);
const selectedCaptains = availableCaptains.slice(0, 2);

console.log('\nSELECTED:');
console.log('Goalkeepers:', selectedGoalkeepers.map(p => p.name));
console.log('Captains:', selectedCaptains.map(p => p.name));

// Update current week
currentWeek.captains.first_half = selectedCaptains[0].name;
currentWeek.captains.second_half = selectedCaptains[1].name;
currentWeek.captains.training_update = `New captains announced: ${selectedCaptains[0].name} (1st half) and ${selectedCaptains[1].name} (2nd half) for Sep 27 vs Swansea (HOME)`;

currentWeek.goalkeepers.first_half = selectedGoalkeepers[0].name;
currentWeek.goalkeepers.second_half = selectedGoalkeepers[1].name;
currentWeek.goalkeepers.rotation_note = `Goalkeeper rotation: ${selectedGoalkeepers[0].name} (alternate: Defence) and ${selectedGoalkeepers[1].name} (alternate: Midfield).`;

// Update off_pitch zones
currentWeek.off_pitch.zones.goalkeepers = [
    {
        name: selectedGoalkeepers[0].name,
        jersey: selectedGoalkeepers[0].jersey,
        alternate_pos: "Defence"
    },
    {
        name: selectedGoalkeepers[1].name,
        jersey: selectedGoalkeepers[1].jersey,
        alternate_pos: "Midfield"
    }
];

// Update defence zone (first GK goes here with dual role)
const defenceZone = currentWeek.off_pitch.zones.defence;
// Remove any existing GK alternate positions
defenceZone.forEach(player => {
    if (player.alternate_pos === 'GK') {
        delete player.alternate_pos;
    }
});
// Add first GK to defence with dual role
const gk1InDefence = defenceZone.find(p => p.name === selectedGoalkeepers[0].name);
if (gk1InDefence) {
    gk1InDefence.alternate_pos = 'GK';
}

// Update midfield zone (second GK goes here with dual role)
const midfieldZone = currentWeek.off_pitch.zones.midfield_wingers;
// Remove any existing GK alternate positions
midfieldZone.forEach(player => {
    if (player.alternate_pos === 'GK') {
        delete player.alternate_pos;
    }
});
// Add second GK to midfield with dual role
const gk2InMidfield = midfieldZone.find(p => p.name === selectedGoalkeepers[1].name);
if (gk2InMidfield) {
    gk2InMidfield.alternate_pos = 'GK';
}

// Update timestamp
currentWeek.week.last_updated = new Date().toISOString().replace('Z', '-07:00');

// Save updated file
fs.writeFileSync(currentWeekPath, JSON.stringify(currentWeek, null, 2));

console.log('\nUPDATED current-week.json successfully!');
console.log(`Captains: ${selectedCaptains[0].name} / ${selectedCaptains[1].name}`);
console.log(`Goalkeepers: ${selectedGoalkeepers[0].name} / ${selectedGoalkeepers[1].name}`);
