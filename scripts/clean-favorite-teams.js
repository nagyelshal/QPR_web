import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current player profiles
const profilesPath = path.join(__dirname, '../data/player-profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));

// Based on actual questionnaire responses - only these had favorite clubs answered:
const playersWithFavoriteTeams = {
  "Andrew E": "Juventus", // Keep as requested by user (not from questionnaire)
  "Yejun K": "Tottenham", // Actually answered in questionnaire
  "Niko D": "FC Barcelona", // Actually answered (first from list)
  "Rhodri W": "Real Madrid" // Keep existing (user wants this)
};

console.log('Cleaning up favorite teams based on questionnaire responses...\n');

profiles.players.forEach(player => {
  if (playersWithFavoriteTeams[player.name]) {
    // Keep or update the favorite team
    const correctTeam = playersWithFavoriteTeams[player.name];
    if (player.basic_info.favorite_team !== correctTeam) {
      player.basic_info.favorite_team = correctTeam;
      console.log(`✅ ${player.name}: Updated to ${correctTeam}`);
    } else {
      console.log(`✅ ${player.name}: Kept ${correctTeam}`);
    }
  } else {
    // Remove favorite_team if it exists (wasn't answered in questionnaire)
    if (player.basic_info.favorite_team) {
      console.log(`❌ ${player.name}: Removed "${player.basic_info.favorite_team}" (not answered in questionnaire)`);
      delete player.basic_info.favorite_team;
    } else {
      console.log(`✅ ${player.name}: No favorite team (correct)`);
    }
  }
});

// Save updated profiles
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
console.log('\n✅ Favorite teams cleaned up based on questionnaire responses!');
