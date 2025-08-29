import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '../QPR U11 Boys тАУ Player & Parent Questionnaire (2025тАУ2026).csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV manually (handle quotes and commas properly)
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const row = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      data.push(obj);
    }
  }
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse the questionnaire data
const questionnaire = parseCSV(csvContent);

console.log('Found', questionnaire.length, 'responses');
console.log('\nHeaders:', Object.keys(questionnaire[0]));

// Extract player information
const playerUpdates = {};

questionnaire.forEach((response, index) => {
  const playerName = response["Player's Full Name"];
  if (!playerName) return;
  
  console.log(`\n--- Response ${index + 1}: ${playerName} ---`);
  
  // Extract key information
  const updates = {
    name: playerName,
    parent: response["Parent/Guardian Name(s)"],
    experience: response["Prior Soccer Experience"],
    previousTeam: response["Previous Team Name (if any)"],
    preferredPosition: response["Preferred Position(s)"],
    medical: response["Any medical notes, allergies, or considerations?"],
    enjoys: response["What does your child enjoy most about soccer?"],
    goals: response["Does your child have any goals for this season?"],
    favoriteClub: response["What is the player's favorite soccer club?"],
    favoritePosition: response["What is the player's favorite position?"],
    favoritePlayer: response["What is the player's favorite soccer player?"]
  };
  
  console.log('Favorite Club:', updates.favoriteClub);
  console.log('Favorite Position:', updates.favoritePosition);
  console.log('Favorite Player:', updates.favoritePlayer);
  console.log('Preferred Position:', updates.preferredPosition);
  console.log('Medical:', updates.medical);
  
  playerUpdates[playerName] = updates;
});

// Save the extracted data
fs.writeFileSync(
  path.join(__dirname, '../data/questionnaire-responses.json'), 
  JSON.stringify(playerUpdates, null, 2)
);

console.log('\n✅ Questionnaire data extracted to questionnaire-responses.json');
