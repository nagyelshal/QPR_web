import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current player profiles
const profilesPath = path.join(__dirname, '../data/player-profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));

// Corrected mapping based on ACTUAL favorite teams from questionnaire
const playerCorrections = [
  {
    searchName: "Andrew E",
    favoriteTeam: "", // was empty in questionnaire, should remove or use default
    favoritePosition: "Central Midfielder", // keep updated
    favoritePlayer: "Andrea Pirlo" // keep existing
  },
  {
    searchName: "Andrew N", 
    favoriteTeam: "", // was empty in questionnaire
    favoritePosition: "Defender", 
    favoritePlayer: "" // was empty
  },
  {
    searchName: "Owen H",
    favoriteTeam: "", // was empty in questionnaire
    favoritePosition: "Central Midfielder",
    favoritePlayer: "" // was empty
  },
  {
    searchName: "Rhodri W",
    favoriteTeam: "Real Madrid", // keep as previously updated correctly
    favoritePosition: "Striker", 
    favoritePlayer: "Lamine Yamal"
  },
  {
    searchName: "Rafael H",
    favoriteTeam: "", // was empty in questionnaire
    favoritePosition: "Central Midfielder",
    favoritePlayer: "" // was empty
  },
  {
    searchName: "Yejun K",
    favoriteTeam: "Tottenham", // this was CORRECT from questionnaire
    favoritePosition: "Defender",
    favoritePlayer: "Son Heung-Min" // this was CORRECT
  },
  {
    searchName: "Niko D",
    favoriteTeam: "FC Barcelona", // this was CORRECT (taking first from list)
    favoritePosition: "Centre Back",
    favoritePlayer: "Nico Williams, Lamine Yamal & Pedro Neto" // this was CORRECT
  },
  {
    searchName: "Alexander V",
    favoriteTeam: "", // was "None" in questionnaire, so remove
    favoritePosition: "Winger",
    favoritePlayer: "" // was "None"
  },
  {
    searchName: "Adam K",
    favoriteTeam: "", // was empty in questionnaire
    favoritePosition: "Attacking Midfielder",
    favoritePlayer: "" // was empty
  }
];

console.log('Correcting favorite team mappings...\n');

// Fix the profiles
playerCorrections.forEach(correction => {
  const player = profiles.players.find(p => p.name === correction.searchName);
  if (player) {
    console.log(`Correcting ${player.name}:`);
    
    // If favorite team should be empty/removed, use a default or remove
    if (correction.favoriteTeam === "") {
      // Remove favorite_team or set to a generic value
      delete player.basic_info.favorite_team;
      console.log(`  - Removed incorrect favorite team`);
    } else {
      player.basic_info.favorite_team = correction.favoriteTeam;
      console.log(`  - Kept correct favorite team: ${correction.favoriteTeam}`);
    }
    
    // Keep the position updates as they were correct
    console.log(`  - Position: ${player.basic_info.favorite_position}`);
    
    if (correction.favoritePlayer && correction.favoritePlayer !== "") {
      console.log(`  - Player: ${player.basic_info.favorite_player}`);
    }
    
    console.log('');
  }
});

// Save corrected profiles
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
console.log('✅ Player profiles corrected!');
