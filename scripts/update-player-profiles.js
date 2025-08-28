import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current player profiles
const profilesPath = path.join(__dirname, '../data/player-profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

// Players to keep favorite_player and favorite_position
const keepersData = {
  "Andrew E": {
    favorite_position: "Central Midfielder",
    favorite_player: "Jordan Henderson"
  },
  "Travis C": {
    favorite_position: "Center Back", 
    favorite_player: "Virgil van Dijk"
  }
};

// Update each player
profiles.players.forEach(player => {
  if (keepersData[player.name]) {
    // Keep favorite_position and favorite_player for these players
    player.basic_info.favorite_position = keepersData[player.name].favorite_position;
    player.basic_info.favorite_player = keepersData[player.name].favorite_player;
  } else {
    // Remove favorite_position and favorite_player for all other players
    delete player.basic_info.favorite_position;
    delete player.basic_info.favorite_player;
  }
});

// Write the updated profiles back
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
console.log('Updated player profiles successfully!');
console.log('- Kept favorite_position and favorite_player for Andrew E and Travis C');
console.log('- Removed favorite_position and favorite_player from all other players');
