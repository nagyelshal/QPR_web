#!/usr/bin/env node

/**
 * Fair Team Rotation Manager
 * Tracks and manages fair rotation of captains, goalkeepers, and positions across weeks
 */

const fs = require('fs');
const path = require('path');

class RotationManager {
  constructor() {
    this.trackerPath = path.join(__dirname, '../data/player-tracker.json');
    this.weekDataPath = path.join(__dirname, '../data/current-week.json');
    this.loadData();
  }

  loadData() {
    this.tracker = JSON.parse(fs.readFileSync(this.trackerPath, 'utf8'));
    this.weekData = JSON.parse(fs.readFileSync(this.weekDataPath, 'utf8'));
  }

  saveData() {
    fs.writeFileSync(this.trackerPath, JSON.stringify(this.tracker, null, 2));
    fs.writeFileSync(this.weekDataPath, JSON.stringify(this.weekData, null, 2));
  }

  /**
   * Select captains based on fairness (lowest captain_count first)
   */
  selectCaptains() {
    const eligible = this.tracker.players
      .filter(p => p.attendance_streak > 0) // Only present players
      .sort((a, b) => {
        // Primary: lowest captain count
        if (a.captain_count !== b.captain_count) {
          return a.captain_count - b.captain_count;
        }
        // Secondary: highest attendance streak
        if (a.attendance_streak !== b.attendance_streak) {
          return b.attendance_streak - a.attendance_streak;
        }
        // Tertiary: random
        return Math.random() - 0.5;
      });

    return {
      first_half: eligible[0].name,
      second_half: eligible[1].name
    };
  }

  /**
   * Select goalkeepers based on fairness (lowest goalkeeper_halves_count first)
   */
  selectGoalkeepers() {
    const eligible = this.tracker.players
      .filter(p => p.attendance_streak > 0) // Only present players
      .sort((a, b) => {
        // Primary: lowest goalkeeper halves count
        if (a.goalkeeper_halves_count !== b.goalkeeper_halves_count) {
          return a.goalkeeper_halves_count - b.goalkeeper_halves_count;
        }
        // Secondary: willing goalkeepers first
        if (a.goalkeeper_willing !== b.goalkeeper_willing) {
          return b.goalkeeper_willing - a.goalkeeper_willing;
        }
        // Tertiary: highest attendance streak
        if (a.attendance_streak !== b.attendance_streak) {
          return b.attendance_streak - a.attendance_streak;
        }
        // Quaternary: random
        return Math.random() - 0.5;
      });

    return {
      first_half: eligible[0].name,
      second_half: eligible[1].name
    };
  }

  /**
   * Select starting lineup based on fairness (lowest starts_count first)
   */
  selectStartingLineup(captains, goalkeepers) {
    const positions = ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'RM', 'ST'];
    const assigned = {};
    const remaining = [...this.tracker.players.filter(p => p.attendance_streak > 0)];

    // Assign captains to CB positions
    assigned[captains.first_half] = 'CB';
    assigned[captains.second_half] = 'BENCH'; // Second half captain starts benched

    // Assign goalkeepers
    assigned[goalkeepers.first_half] = 'GK';
    // Second goalkeeper starts in field position (will be assigned later)

    // Remove assigned players from remaining pool
    const assignedNames = Object.keys(assigned);
    const availableForField = remaining.filter(p => 
      !assignedNames.includes(p.name) || p.name === goalkeepers.second_half
    );

    // Sort by fairness criteria
    availableForField.sort((a, b) => {
      // Primary: lowest starts count
      if (a.starts_count !== b.starts_count) {
        return a.starts_count - b.starts_count;
      }
      // Secondary: position diversity (haven't played this position recently)
      // Tertiary: attendance streak
      if (a.attendance_streak !== b.attendance_streak) {
        return b.attendance_streak - a.attendance_streak;
      }
      // Quaternary: random
      return Math.random() - 0.5;
    });

    // Assign remaining positions
    const unassignedPositions = positions.filter(pos => 
      pos !== 'GK' && (pos !== 'CB' || !Object.values(assigned).includes('CB'))
    );

    unassignedPositions.forEach((pos, index) => {
      if (availableForField[index]) {
        assigned[availableForField[index].name] = pos;
      }
    });

    return assigned;
  }

  /**
   * Generate complete lineup for the week
   */
  generateWeeklyLineup() {
    console.log('🎲 Generating fair weekly lineup...\n');

    // Select captains and goalkeepers
    const captains = this.selectCaptains();
    const goalkeepers = this.selectGoalkeepers();

    console.log('🏅 Captains Selected:');
    console.log(`  1st Half: ${captains.first_half}`);
    console.log(`  2nd Half: ${captains.second_half}\n`);

    console.log('🥅 Goalkeepers Selected:');
    console.log(`  1st Half GK: ${goalkeepers.first_half} (starts in goal)`);
    console.log(`  2nd Half GK: ${goalkeepers.second_half} (starts in field)\n`);

    // Generate starting lineup
    const lineup = this.selectStartingLineup(captains, goalkeepers);

    // Create starting array and rotating array
    const starting = [];
    const rotating = [];

    Object.entries(lineup).forEach(([name, position]) => {
      const player = this.tracker.players.find(p => p.name === name);
      if (position === 'BENCH') {
        rotating.push({name, jersey: player.jersey});
      } else {
        starting.push({name, pos: position, jersey: player.jersey});
      }
    });

    // Add remaining players to rotating squad
    this.tracker.players
      .filter(p => p.attendance_streak > 0 && !Object.keys(lineup).includes(p.name))
      .forEach(player => {
        rotating.push({name: player.name, jersey: player.jersey});
      });

    return {
      captains,
      goalkeepers, 
      starting,
      rotating
    };
  }

  /**
   * Update tracker with current week's assignments
   */
  updateTracker(assignments) {
    const currentWeek = this.tracker.weekly_tracking.current_week;
    
    // Update captain counts
    const captainNames = [assignments.captains.first_half, assignments.captains.second_half];
    captainNames.forEach(name => {
      const player = this.tracker.players.find(p => p.name === name);
      if (player) {
        player.captain_count++;
        player.captain_weeks.push(currentWeek);
      }
    });

    // Update goalkeeper counts
    const gkNames = [assignments.goalkeepers.first_half, assignments.goalkeepers.second_half];
    gkNames.forEach(name => {
      const player = this.tracker.players.find(p => p.name === name);
      if (player) {
        player.goalkeeper_halves_count++;
        player.goalkeeper_minutes += 30; // Half a game
        player.goalkeeper_weeks.push(currentWeek);
      }
    });

    // Update starts count
    assignments.starting.forEach(starter => {
      const player = this.tracker.players.find(p => p.name === starter.name);
      if (player) {
        player.starts_count++;
        player.last_week_position = starter.pos;
        player.position_history.push(starter.pos);
      }
    });

    // Update weekly tracking
    this.tracker.weekly_tracking.weeks_completed++;
    this.tracker.weekly_tracking.captain_history.push({
      week: currentWeek,
      captains: assignments.captains
    });
    this.tracker.weekly_tracking.goalkeeper_history.push({
      week: currentWeek, 
      goalkeepers: assignments.goalkeepers
    });
    this.tracker.weekly_tracking.lineup_history.push({
      week: currentWeek,
      starting: assignments.starting,
      rotating: assignments.rotating
    });

    this.tracker.last_updated = new Date().toISOString().split('T')[0];
  }

  /**
   * Generate lineup and update current-week.json
   */
  generateAndSave() {
    const assignments = this.generateWeeklyLineup();
    
    // Update current-week.json
    this.weekData.captains.first_half = assignments.captains.first_half;
    this.weekData.captains.second_half = assignments.captains.second_half;
    this.weekData.goalkeepers.first_half = assignments.goalkeepers.first_half;
    this.weekData.goalkeepers.second_half = assignments.goalkeepers.second_half;
    this.weekData.lineup.starting = assignments.starting;
    this.weekData.lineup.rotating = assignments.rotating;

    // Update player tracker
    this.updateTracker(assignments);

    // Save both files
    this.saveData();

    console.log('✅ Lineup generated and saved to current-week.json');
    console.log('✅ Player tracker updated with new assignments');
    
    return assignments;
  }

  /**
   * Display current fairness stats
   */
  showFairnessStats() {
    console.log('\n📊 Current Fairness Statistics:');
    console.log('================================');
    
    const stats = this.tracker.players.map(p => ({
      name: p.name,
      captain: p.captain_count,
      gk_halves: p.goalkeeper_halves_count,
      starts: p.starts_count,
      total_min: p.total_minutes
    }));

    console.table(stats);
  }
}

// CLI Usage
if (require.main === module) {
  const manager = new RotationManager();
  
  const command = process.argv[2];
  
  switch(command) {
    case 'generate':
      manager.generateAndSave();
      manager.showFairnessStats();
      break;
    case 'stats':
      manager.showFairnessStats();
      break;
    default:
      console.log('Usage:');
      console.log('  node rotation-manager.js generate  - Generate new week lineup');
      console.log('  node rotation-manager.js stats     - Show fairness statistics');
  }
}

module.exports = RotationManager;
