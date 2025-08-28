// Fair Team Selection Utilities
// Run this in browser console or Node.js to generate fair lineups

class FairTeamSelector {
  constructor(playerData) {
    this.players = playerData.players;
    this.rules = playerData.rotation_rules;
    this.settings = playerData.game_settings;
  }

  // Get players with lowest count for any stat
  getLowestCountPlayers(stat) {
    const minCount = Math.min(...this.players.map(p => p[stat]));
    return this.players.filter(p => p[stat] === minCount);
  }

  // Randomize array (Fisher-Yates shuffle)
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Select captains fairly
  selectCaptains() {
    const eligible = this.getLowestCountPlayers('captain_count');
    const shuffled = this.shuffle(eligible);
    return shuffled.slice(0, this.settings.captain_count);
  }

  // Select goalkeeper fairly
  selectGoalkeeper() {
    // First try willing goalkeepers
    const willingGKs = this.players.filter(p => p.goalkeeper_willing);
    
    if (willingGKs.length > 0) {
      const eligible = willingGKs.filter(p => 
        p.goalkeeper_minutes === Math.min(...willingGKs.map(gk => gk.goalkeeper_minutes))
      );
      return this.shuffle(eligible)[0];
    }
    
    // If no willing GKs, use all players by lowest GK minutes
    const eligible = this.getLowestCountPlayers('goalkeeper_minutes');
    return this.shuffle(eligible)[0];
  }

  // Select starting lineup fairly
  selectStarters(excludeGK = null) {
    let availablePlayers = this.players;
    
    // Remove goalkeeper from starter pool
    if (excludeGK) {
      availablePlayers = this.players.filter(p => p.name !== excludeGK.name);
    }
    
    // Get players with lowest start counts
    const minStarts = Math.min(...availablePlayers.map(p => p.starts_count));
    const eligible = availablePlayers.filter(p => p.starts_count === minStarts);
    
    // Randomize and take the required number
    const startersNeeded = this.settings.starting_players - (excludeGK ? 1 : 0);
    const shuffled = this.shuffle(eligible);
    
    return shuffled.slice(0, startersNeeded);
  }

  // Assign positions based on preferences and rotation
  assignPositions(players, formation = "3-3-1") {
    const formations = {
      "3-3-1": ["CB", "CB", "CB", "LM", "CM", "RM", "ST"],
      "2-3-2": ["CB", "CB", "LM", "CM", "RM", "LW", "RW"],
      "4-2-1": ["RB", "CB", "CB", "LB", "CM", "CM", "ST"]
    };
    
    const positions = formations[formation] || formations["3-3-1"];
    const assigned = [];
    const availablePositions = [...positions];
    
    // Try to assign preferred positions first
    for (const player of players) {
      for (const prefPos of player.preferred_positions) {
        const posIndex = availablePositions.indexOf(prefPos);
        if (posIndex !== -1) {
          assigned.push({ ...player, assigned_position: prefPos });
          availablePositions.splice(posIndex, 1);
          break;
        }
      }
    }
    
    // Assign remaining players to remaining positions
    const unassigned = players.filter(p => !assigned.find(a => a.name === p.name));
    for (let i = 0; i < unassigned.length && i < availablePositions.length; i++) {
      assigned.push({ 
        ...unassigned[i], 
        assigned_position: availablePositions[i] 
      });
    }
    
    return assigned;
  }

  // Generate complete fair lineup
  generateWeeklyLineup(formation = "3-3-1", absentPlayers = []) {
    // Filter out absent players
    this.players = this.players.filter(p => !absentPlayers.includes(p.name));
    
    const captains = this.selectCaptains();
    const goalkeeper = this.selectGoalkeeper();
    const starters = this.selectStarters(goalkeeper);
    const rotating = this.players.filter(p => 
      p.name !== goalkeeper.name && 
      !starters.find(s => s.name === p.name)
    );
    
    // Assign positions to starters (excluding GK)
    const startersWithPositions = this.assignPositions(starters, formation);
    
    return {
      captains: captains.map(c => c.name),
      goalkeeper: { ...goalkeeper, assigned_position: "GK" },
      starting_lineup: startersWithPositions,
      rotating_players: rotating,
      formation: formation,
      total_players: this.players.length,
      generated_at: new Date().toISOString()
    };
  }

  // Update player stats after a game
  updatePlayerStats(gameResult) {
    for (const player of this.players) {
      const playerName = player.name;
      
      // Update captain count
      if (gameResult.captains.includes(playerName)) {
        player.captain_count++;
      }
      
      // Update GK minutes
      if (gameResult.goalkeeper.name === playerName) {
        player.goalkeeper_minutes += gameResult.goalkeeper_minutes || 30; // half game
      }
      
      // Update starts
      if (gameResult.starting_lineup.find(s => s.name === playerName)) {
        player.starts_count++;
      }
      
      // Update total minutes (you'd track this from actual game)
      if (gameResult.player_minutes && gameResult.player_minutes[playerName]) {
        player.total_minutes += gameResult.player_minutes[playerName];
      }
      
      // Update last position
      const playerGameData = [
        gameResult.goalkeeper,
        ...gameResult.starting_lineup,
        ...gameResult.rotating_players
      ].find(p => p.name === playerName);
      
      if (playerGameData) {
        player.last_week_position = playerGameData.assigned_position;
      }
    }
  }
}

// Example usage:
/*
// Load your player data
const playerData = {
  players: [...], // from player-tracker.json
  rotation_rules: {...},
  game_settings: {...}
};

const selector = new FairTeamSelector(playerData);

// Generate this week's lineup
const thisWeek = selector.generateWeeklyLineup("3-3-1", ["Player Name"]); // absent players

console.log("Captains:", thisWeek.captains);
console.log("Goalkeeper:", thisWeek.goalkeeper.name);
console.log("Starting Lineup:", thisWeek.starting_lineup);
console.log("Rotating Players:", thisWeek.rotating_players);

// After the game, update stats
selector.updatePlayerStats({
  captains: thisWeek.captains,
  goalkeeper: { name: thisWeek.goalkeeper.name, minutes: 30 },
  starting_lineup: thisWeek.starting_lineup,
  rotating_players: thisWeek.rotating_players,
  player_minutes: {
    "Player 1": 45,
    "Player 2": 30,
    // ... actual minutes played
  }
});
*/

// Export for Node.js or browser
if (typeof module !== 'undefined') {
  module.exports = FairTeamSelector;
}
