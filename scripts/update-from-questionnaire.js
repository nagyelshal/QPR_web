import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the questionnaire responses 
const csvPath = path.join(__dirname, '../QPR U11 Boys тАУ Player & Parent Questionnaire (2025тАУ2026).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Read current player profiles
const profilesPath = path.join(__dirname, '../data/player-profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));

// Manual extraction of player data from the responses
const playerUpdates = [
  {
    searchName: "Andrew E",
    fullName: "Andrew Elshal",
    favoriteTeam: "Sheffield United", // from response
    favoritePosition: "Midfield",
    favoritePlayer: "", // empty in response
    funFact: "Enjoys long-ball assists", // keep existing
    preferredPositions: "Midfield",
    experience: "1–2 years",
    medical: "Everything" // unclear response
  },
  {
    searchName: "Andrew N", 
    fullName: "Andrew Jaehyun Nam",
    favoriteTeam: "Queens Park Rangers",
    favoritePosition: "Defender", // from "Wings, defender"
    favoritePlayer: "",
    funFact: "Fastest runner on the team!", // keep existing
    preferredPositions: "Defender;Midfield;Forward",
    experience: "3–4 years",
    medical: "None"
  },
  {
    searchName: "Owen H",
    fullName: "Owen Hon", 
    favoriteTeam: "Cardiff City",
    favoritePosition: "Midfield",
    favoritePlayer: "",
    funFact: "Loves tactical discussions!", // keep existing  
    preferredPositions: "Midfield;Open to trying different positions",
    experience: "5+ years",
    medical: "None"
  },
  {
    searchName: "Rhodri W",
    fullName: "Rhodri Williams",
    favoriteTeam: "Real Madrid", // already updated
    favoritePosition: "Striker", // already updated
    favoritePlayer: "Lamine Yamal", // already updated
    funFact: "Rhodri is a box lacrosse goalie during the soccer offseason", // already updated
    preferredPositions: "Goalkeeper;Defender;Forward", 
    experience: "5+ years",
    medical: "Seasonal (pollen) allergies"
  },
  {
    searchName: "Rafael H",
    fullName: "Rafael Heldsinger",
    favoriteTeam: "Huddersfield Town",
    favoritePosition: "Midfield",
    favoritePlayer: "",
    funFact: "Best free kick taker on the team!", // keep existing
    preferredPositions: "Midfield",
    experience: "5+ years", 
    medical: "None"
  },
  {
    searchName: "Yejun K",
    fullName: "Yejun Kim",
    favoriteTeam: "Tottenham",
    favoritePosition: "Defense", 
    favoritePlayer: "Son Heung-Min",
    funFact: "Practices juggling every day!", // keep existing
    preferredPositions: "Defender",
    experience: "None (first season)",
    medical: "None"
  },
  {
    searchName: "Niko D",
    fullName: "Niko Fidaali Damjanovic",
    favoriteTeam: "FC Barcelona",
    favoritePosition: "Centre Back & Centre Mid",
    favoritePlayer: "Nico Williams, Lamine Yamal & Pedro Neto",
    funFact: "Can play any position!", // keep existing
    preferredPositions: "Defender;Midfield",
    experience: "3–4 years",
    medical: "Celiac (Gluten)"
  },
  {
    searchName: "Alexander V", 
    fullName: "Alexander Voo",
    favoriteTeam: "Queens Park Rangers", // from previous team
    favoritePosition: "Winger",
    favoritePlayer: "None",
    funFact: "Loves nutmegs!", // keep existing
    preferredPositions: "Defender;Midfield", 
    experience: "3–4 years",
    medical: "None"
  },
  {
    searchName: "Adam K",
    fullName: "Adam Kaoutar", 
    favoriteTeam: "Huddersfield",
    favoritePosition: "Forward - midfield",
    favoritePlayer: "",
    funFact: "Can juggle the ball 25 times!", // keep existing
    preferredPositions: "Midfield;Forward;Open to trying different positions",
    experience: "3–4 years",
    medical: "None"
  }
];

console.log('Processing player updates...\n');

// Update the profiles
playerUpdates.forEach(update => {
  const player = profiles.players.find(p => p.name === update.searchName);
  if (player) {
    console.log(`Updating ${player.name}:`);
    
    // Update favorite team
    if (update.favoriteTeam && update.favoriteTeam !== "") {
      player.basic_info.favorite_team = update.favoriteTeam;
      console.log(`  - Favorite team: ${update.favoriteTeam}`);
    }
    
    // Update favorite position 
    if (update.favoritePosition && update.favoritePosition !== "") {
      player.basic_info.favorite_position = update.favoritePosition;
      console.log(`  - Favorite position: ${update.favoritePosition}`);
    }
    
    // Update favorite player
    if (update.favoritePlayer && update.favoritePlayer !== "" && update.favoritePlayer !== "None") {
      player.basic_info.favorite_player = update.favoritePlayer;
      console.log(`  - Favorite player: ${update.favoritePlayer}`);
    }
    
    // Keep existing fun fact (already good)
    console.log(`  - Fun fact: ${player.basic_info.fun_fact}`);
    
    console.log('');
  } else {
    console.log(`❌ Player not found: ${update.searchName}`);
  }
});

// Save updated profiles
fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
console.log('✅ Player profiles updated successfully!');
