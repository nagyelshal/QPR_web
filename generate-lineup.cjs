const fs = require('fs');

// Load player data
const playerData = JSON.parse(fs.readFileSync('./data/player-tracker.json', 'utf8'));

// Fair Team Selector Class
class FairTeamSelector {
  constructor(data) {
    this.players = data.players;
    this.settings = data.game_settings;
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getLowestCountPlayers(stat) {
    const minCount = Math.min(...this.players.map(p => p[stat]));
    return this.players.filter(p => p[stat] === minCount);
  }

  selectCaptains() {
    const eligible = this.getLowestCountPlayers('captain_count');
    const shuffled = this.shuffle(eligible);
    return shuffled.slice(0, 2);
  }

  selectGoalkeeper() {
    const willingGKs = this.players.filter(p => p.goalkeeper_willing);
    if (willingGKs.length > 0) {
      const minMinutes = Math.min(...willingGKs.map(gk => gk.goalkeeper_minutes));
      const eligible = willingGKs.filter(p => p.goalkeeper_minutes === minMinutes);
      return this.shuffle(eligible)[0];
    }
    const eligible = this.getLowestCountPlayers('goalkeeper_minutes');
    return this.shuffle(eligible)[0];
  }

  selectStarters(excludeGK) {
    const available = this.players.filter(p => p.name !== excludeGK.name);
    const minStarts = Math.min(...available.map(p => p.starts_count));
    const eligible = available.filter(p => p.starts_count === minStarts);
    const shuffled = this.shuffle(eligible);
    return shuffled.slice(0, 7);
  }

  assignPositions(players, captains) {
    const positions = ['CB', 'CB', 'CB', 'LM', 'CM', 'RM', 'ST'];
    const assigned = [];
    const availablePositions = [...positions];
    
    // RULE: One captain must be a center back
    const captainInLineup = players.find(p => captains.includes(p.name));
    if (captainInLineup) {
      assigned.push({ ...captainInLineup, pos: 'CB' });
      availablePositions.splice(availablePositions.indexOf('CB'), 1);
    }
    
    // Try preferred positions for remaining players
    const remainingPlayers = players.filter(p => !assigned.find(a => a.name === p.name));
    for (const player of remainingPlayers) {
      let positionAssigned = false;
      for (const prefPos of player.preferred_positions) {
        const posIndex = availablePositions.indexOf(prefPos);
        if (posIndex !== -1) {
          assigned.push({ ...player, pos: prefPos });
          availablePositions.splice(posIndex, 1);
          positionAssigned = true;
          break;
        }
      }
      if (positionAssigned) continue;
    }
    
    // Assign remaining players to remaining positions
    const unassigned = players.filter(p => !assigned.find(a => a.name === p.name));
    for (let i = 0; i < unassigned.length && i < availablePositions.length; i++) {
      assigned.push({ ...unassigned[i], pos: availablePositions[i] });
    }
    
    return assigned;
  }

  generateLineup() {
    const captains = this.selectCaptains();
    const goalkeeper = this.selectGoalkeeper();
    const starters = this.selectStarters(goalkeeper);
    const startersWithPos = this.assignPositions(starters, captains.map(c => c.name));
    const rotating = this.players.filter(p => 
      p.name !== goalkeeper.name && 
      !starters.find(s => s.name === p.name)
    );
    
    return {
      captains: {
        first_half: captains[0].name,
        second_half: captains[1].name
      },
      goalkeeper: { name: goalkeeper.name, pos: 'GK', jersey: goalkeeper.jersey },
      starting: startersWithPos.map(p => ({ name: p.name, pos: p.pos, jersey: p.jersey })),
      rotating: rotating.map(p => ({ name: p.name, jersey: p.jersey }))
    };
  }
}

// Generate fair lineup
const selector = new FairTeamSelector(playerData);
const lineup = selector.generateLineup();

console.log('=== FAIR LINEUP GENERATED ===');
console.log('First Half Captain:', lineup.captains.first_half);
console.log('Second Half Captain:', lineup.captains.second_half);
console.log('Goalkeeper:', lineup.goalkeeper.name);
console.log('Starting 7:');
lineup.starting.forEach(p => console.log('  ' + p.name + ' (' + p.pos + ')'));
console.log('Rotating 6:');
lineup.rotating.forEach(p => console.log('  ' + p.name));

console.log('\n=== JSON FORMAT ===');
console.log(JSON.stringify(lineup, null, 2));
