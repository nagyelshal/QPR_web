#!/usr/bin/env node

/**
 * Fair Team Rotation Manager (CommonJS)
 * Tracks and manages fair rotation of captains, goalkeepers, and positions across weeks
 */

const fs = require('fs');
const path = require('path');

class RotationManager {
  constructor() {
    this.trackerPath = path.join(__dirname, '../data/player-tracker.json');
    this.weekDataPath = path.join(__dirname, '../data/current-week.json');
    this.rosterPath = path.join(__dirname, '../data/roster.json');
    this.loadData();
  }

  loadData() {
    this.tracker = JSON.parse(fs.readFileSync(this.trackerPath, 'utf8'));
    this.weekData = JSON.parse(fs.readFileSync(this.weekDataPath, 'utf8'));
    try {
      this.roster = JSON.parse(fs.readFileSync(this.rosterPath, 'utf8'));
    } catch (e) {
      this.roster = { players: [] };
    }
    this.rosterMap = new Map((this.roster.players || []).map(p => [this.normalizeName(p.name), p]));
  }

  saveData() {
    fs.writeFileSync(this.trackerPath, JSON.stringify(this.tracker, null, 2));
    fs.writeFileSync(this.weekDataPath, JSON.stringify(this.weekData, null, 2));
  }

  normalizeName(name) {
    return String(name || '').replace(/\.$/, '').replace(/\s+/g, ' ').trim();
  }

  getJersey(name) {
    const norm = this.normalizeName(name);
    const found = this.rosterMap.get(norm);
    return found?.jersey || 'TBD';
  }

  // Available players for this week come from current-week.json all_players; fallback to tracker
  getAvailablePlayers() {
    const listed = (this.weekData?.lineup?.all_players || []).map(p => this.normalizeName(p.name));
    const absent = new Set([
      ...((this.weekData?.absentPlayers || []).map(n => this.normalizeName(n)) ),
      ...((this.weekData?.lineup?.absent || []).map(n => this.normalizeName(n)) )
    ]);
    const base = listed.length > 0
      ? this.tracker.players.filter(p => listed.includes(this.normalizeName(p.name)))
      : this.tracker.players;
    return base.filter(p => !absent.has(this.normalizeName(p.name)));
  }

  /** Select captains based on fairness */
  selectCaptains() {
    const pool = this.getAvailablePlayers();
    const eligible = [...pool].sort((a, b) => {
      if (a.captain_count !== b.captain_count) return a.captain_count - b.captain_count;
      if (a.attendance_streak !== b.attendance_streak) return b.attendance_streak - a.attendance_streak;
      return Math.random() - 0.5;
    });
    return { first_half: this.normalizeName(eligible[0].name), second_half: this.normalizeName(eligible[1].name) };
  }

  /** Select goalkeepers based on fairness */
  selectGoalkeepers() {
    const pool = this.getAvailablePlayers();
    const eligible = [...pool].sort((a, b) => {
      if (a.goalkeeper_halves_count !== b.goalkeeper_halves_count) return a.goalkeeper_halves_count - b.goalkeeper_halves_count;
      if (a.goalkeeper_willing !== b.goalkeeper_willing) return (b.goalkeeper_willing ? 1 : 0) - (a.goalkeeper_willing ? 1 : 0);
      if (a.attendance_streak !== b.attendance_streak) return b.attendance_streak - a.attendance_streak;
      return Math.random() - 0.5;
    });
    return { first_half: this.normalizeName(eligible[0].name), second_half: this.normalizeName(eligible[1].name) };
  }

  /** Assign starting lineup */
  selectStartingLineup(captains, goalkeepers) {
    // Formation 3-3-1: GK + CB,CB,CB + LM,CM,RM + ST
    const required = { GK: 1, CB: 3, LM: 1, CM: 1, RM: 1, ST: 1 };
    const assigned = {};
    const remaining = [...this.getAvailablePlayers()];

    // Captain first half at CB
    assigned[captains.first_half] = 'CB';
    required.CB -= 1;

    // First-half GK in goal
    assigned[goalkeepers.first_half] = 'GK';
    required.GK -= 1;

    // Second-half GK must start in a field position; reserve a field slot for them by putting
    // them at the front of the candidate list and ensuring they are assigned first.
    const normSecondGK = this.normalizeName(goalkeepers.second_half);
    const candidates = remaining
      .filter(p => ![
        captains.first_half,
        goalkeepers.first_half,
        captains.second_half // will be benched; exclude from starters
      ].map(this.normalizeName.bind(this)).includes(this.normalizeName(p.name)));

    // Stable sort by fairness then move second GK to front
    candidates.sort((a, b) => {
      if (a.starts_count !== b.starts_count) return a.starts_count - b.starts_count;
      if (a.attendance_streak !== b.attendance_streak) return b.attendance_streak - a.attendance_streak;
      return Math.random() - 0.5;
    });
    const idxSecondGK = candidates.findIndex(p => this.normalizeName(p.name) === normSecondGK);
    if (idxSecondGK > -1) {
      const [sgk] = candidates.splice(idxSecondGK, 1);
      candidates.unshift(sgk);
    }

    // Build list of remaining positions to fill
    const toFill = [];
    Object.entries(required).forEach(([pos, count]) => {
      for (let i = 0; i < count; i++) toFill.push(pos);
    });

    // Assign in order of candidates and toFill
    for (let i = 0; i < toFill.length && i < candidates.length; i++) {
      assigned[this.normalizeName(candidates[i].name)] = toFill[i];
    }

    // Bench the second-half captain to rotate at HT
    assigned[captains.second_half] = 'BENCH';

    return assigned;
  }

  generateWeeklyLineup() {
    console.log('🎲 Generating fair weekly lineup...\n');
    const captains = this.selectCaptains();
    const goalkeepers = this.selectGoalkeepers();
    console.log('🏅 Captains Selected:');
    console.log(`  1st Half: ${captains.first_half}`);
    console.log(`  2nd Half: ${captains.second_half}\n`);
    console.log('🧤 Goalkeepers Selected:');
    console.log(`  1st Half GK: ${goalkeepers.first_half} (starts in goal)`);
    console.log(`  2nd Half GK: ${goalkeepers.second_half} (starts in field)\n`);

    const lineup = this.selectStartingLineup(captains, goalkeepers);

    const starting = [];
    const rotating = [];
    Object.entries(lineup).forEach(([name, position]) => {
      if (position === 'BENCH') {
        rotating.push({ name: this.normalizeName(name), jersey: this.getJersey(name) });
      } else {
        starting.push({ name: this.normalizeName(name), pos: position, jersey: this.getJersey(name) });
      }
    });

    this.getAvailablePlayers()
      .filter(p => !Object.keys(lineup).map(n => this.normalizeName(n)).includes(this.normalizeName(p.name)))
      .forEach(p => rotating.push({ name: this.normalizeName(p.name), jersey: this.getJersey(p.name) }));

    return { captains, goalkeepers, starting, rotating };
  }

  updateTracker(assignments) {
    const currentWeek = this.tracker.weekly_tracking.current_week;
    const captainNames = [assignments.captains.first_half, assignments.captains.second_half];
    captainNames.forEach(name => {
      const player = this.tracker.players.find(p => this.normalizeName(p.name) === this.normalizeName(name));
      if (player) { player.captain_count++; player.captain_weeks.push(currentWeek); }
    });
    const gkNames = [assignments.goalkeepers.first_half, assignments.goalkeepers.second_half];
    gkNames.forEach(name => {
      const player = this.tracker.players.find(p => this.normalizeName(p.name) === this.normalizeName(name));
      if (player) { player.goalkeeper_halves_count++; player.goalkeeper_minutes += 30; player.goalkeeper_weeks.push(currentWeek); }
    });
    assignments.starting.forEach(starter => {
      const player = this.tracker.players.find(p => this.normalizeName(p.name) === this.normalizeName(starter.name));
      if (player) { player.starts_count++; player.last_week_position = starter.pos; (player.position_history ||= []).push(starter.pos); }
    });
    this.tracker.weekly_tracking.weeks_completed++;
    this.tracker.weekly_tracking.captain_history.push({ week: currentWeek, captains: assignments.captains });
    this.tracker.weekly_tracking.goalkeeper_history.push({ week: currentWeek, goalkeepers: assignments.goalkeepers });
    this.tracker.weekly_tracking.lineup_history.push({ week: currentWeek, starting: assignments.starting, rotating: assignments.rotating });
    this.tracker.last_updated = new Date().toISOString().split('T')[0];
  }

  generateAndSave() {
    const assignments = this.generateWeeklyLineup();
    this.weekData.captains.first_half = assignments.captains.first_half;
    this.weekData.captains.second_half = assignments.captains.second_half;
    this.weekData.goalkeepers.first_half = assignments.goalkeepers.first_half;
    this.weekData.goalkeepers.second_half = assignments.goalkeepers.second_half;
    this.weekData.lineup.starting = assignments.starting;
    this.weekData.lineup.rotating = assignments.rotating;
    this.weekData.status = 'finalized';
    this.updateTracker(assignments);
    this.saveData();
    console.log('✅ Lineup generated and saved to current-week.json');
    return assignments;
  }

  rehearseAndSave() {
    const assignments = this.generateWeeklyLineup();
    this.weekData.captains.first_half = assignments.captains.first_half;
    this.weekData.captains.second_half = assignments.captains.second_half;
    this.weekData.goalkeepers.first_half = assignments.goalkeepers.first_half;
    this.weekData.goalkeepers.second_half = assignments.goalkeepers.second_half;
    this.weekData.lineup.starting = assignments.starting;
    this.weekData.lineup.rotating = assignments.rotating;
    this.weekData.status = 'rehearsal';
    fs.writeFileSync(this.weekDataPath, JSON.stringify(this.weekData, null, 2));
    console.log('🧪 Rehearsal lineup generated and saved (tracker not updated).');
    return assignments;
  }

  finalizeFromCurrentWeek() {
    const assignments = {
      captains: { first_half: this.weekData.captains.first_half, second_half: this.weekData.captains.second_half },
      goalkeepers: { first_half: this.weekData.goalkeepers.first_half, second_half: this.weekData.goalkeepers.second_half },
      starting: this.weekData.lineup.starting || [],
      rotating: this.weekData.lineup.rotating || []
    };
    this.updateTracker(assignments);
    this.weekData.status = 'finalized';
    this.saveData();
    console.log('✅ Finalized lineup applied to tracker.');
    return assignments;
  }

  showFairnessStats() {
    console.log('\n📊 Current Fairness Statistics:');
    console.log('================================');
    const stats = this.tracker.players.map(p => ({
      name: this.normalizeName(p.name),
      captain: p.captain_count,
      gk_halves: p.goalkeeper_halves_count,
      starts: p.starts_count,
      total_min: p.total_minutes
    }));
    console.table(stats);
  }
}

// CLI
if (require.main === module) {
  const manager = new RotationManager();
  const command = process.argv[2];
  switch (command) {
    case 'generate':
      manager.generateAndSave();
      manager.showFairnessStats();
      break;
    case 'rehearse':
      manager.rehearseAndSave();
      manager.showFairnessStats();
      break;
    case 'finalize':
      manager.finalizeFromCurrentWeek();
      manager.showFairnessStats();
      break;
    case 'stats':
      manager.showFairnessStats();
      break;
    default:
      console.log('Usage:');
      console.log('  node rotation-manager.cjs rehearse  - Generate rehearsal lineup (no counters updated)');
      console.log('  node rotation-manager.cjs generate  - Generate and finalize lineup');
      console.log('  node rotation-manager.cjs finalize  - Finalize current-week selections into tracker');
      console.log('  node rotation-manager.cjs stats     - Show fairness stats');
  }
}

module.exports = RotationManager;
