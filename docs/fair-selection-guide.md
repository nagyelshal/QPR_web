# Fair Team Selection Guide

## Quick Weekly Workflow (15 minutes)

### Wednesday: Select Captains & Formation
1. Check `player-tracker.json` for lowest `captain_count`
2. Use the Fair Team Selector script or manual selection:
   - Find players with minimum captain count
   - Randomly pick 2 from that group (1st half + 2nd half captains)
   - Assign one captain to Center Back position
3. Update current-week.json with captain names
4. Announce formation for Thursday training practice
5. Increment `captain_count` in player-tracker.json

### Thursday: Training with Formation Practice
- Captains practice leadership in assigned formation
- Team drills based on revealed formation (3-3-1)
- Special focus on captain roles and positioning

### Friday 7pm: Generate Full Lineup
1. Check TeamSnap for absences
2. Use Fair Team Selector script:
   ```javascript
   const lineup = selector.generateWeeklyLineup("3-3-1", ["Absent Player"]);
   ```
3. Update current-week.json with:
   - Starting lineup
   - Rotating players (substitutes)
   - Final goalkeeper assignment

### After Game: Update Stats
1. Track actual minutes played
2. Update player-tracker.json:
   - `starts_count` for starters
   - `goalkeeper_minutes` for GK
   - `total_minutes` for all players
   - `last_week_position` for position rotation

## Fair Selection Rules

### Captain Selection
- **Rule**: Lowest `captain_count` first, then random
- **Position Rule**: One captain must be assigned to Center Back (CB)
- **Rotation**: First half captain and second half captain
- **Leadership**: One captain on pitch at all times for continuous leadership
- **Frequency**: 2 captains per game (one per half)
- **Cycle**: Everyone captains before anyone repeats

### Goalkeeper Selection
- **Priority 1**: Willing goalkeepers (`goalkeeper_willing: true`)
- **Priority 2**: Lowest `goalkeeper_minutes` from willing GKs
- **Fallback**: All players by lowest `goalkeeper_minutes`
- **Duration**: One half each (30 minutes) or rotate every 20 minutes

### Starting Lineup
- **Rule**: Lowest `starts_count` first, then random
- **Goal**: Equal starts across the season
- **Positions**: Respect preferences, rotate weekly to develop all skills

### Position Assignment
- **Preference**: Try preferred positions first
- **Captain Rule**: One captain must play Center Back (CB) for leadership
- **Development**: Rotate so everyone tries Defense/Midfield/Forward
- **Balance**: Avoid same position 2 weeks in a row when possible

## Using the Fair Team Selector Script

### Browser Console Method:
1. Open browser dev tools (F12)
2. Copy and paste the script
3. Load your player data
4. Generate lineups:
   ```javascript
   const lineup = selector.generateWeeklyLineup("3-3-1");
   console.log(lineup);
   ```

### Manual Selection (No Script):
1. **Captains**: 
   - Sort players by captain_count (lowest first)
   - Pick 2 randomly from the lowest group
2. **Goalkeeper**:
   - If Travis C. or Owen H. available, alternate between them
   - Track who played GK last
3. **Starters**:
   - Sort by starts_count (lowest first)
   - Pick 7 field players randomly from lowest group
   - Add goalkeeper = 8 starters total

## Tracking Sheet (Google Sheets Alternative)

Create a simple tracker with columns:
- Player Name
- Jersey #
- Preferred Positions
- GK Willing?
- Captain Count
- GK Minutes
- Starts Count
- Total Minutes
- Last Position
- Notes

Update weekly after each game.

## Communication Templates

### Wednesday Captain & Formation Announcement:
```
🏅 **Captains & Formation of the Week**: 
- **First Half**: [Name] (starts the game, leads opening)
- **Second Half**: [Name] (leads second half, closes game)
- **Formation**: 3-3-1 (practice this Thursday!)
- One captain on pitch at all times
- Center back captain for tactical leadership
- Chosen by fair rotation system
```

### Friday 7pm Lineup Announcement:
```
⚽ **Starting 8 Revealed!**
Formation: 3-3-1
- GK: [Name]
- Defense: [Name], [Name], [Name] 
- Midfield: [Name], [Name], [Name]
- Forward: [Name]

**Rotating 6**: [Names]
Everyone plays! Subs every ~8 minutes for equal game time.
Game day Saturday - let's go QPR! 🔵⚪
```

### Friday Lineup Announcement:
```
⚽ **Starting 8 Revealed!**
Formation: 3-3-1
- GK: [Name]
- Defense: [Name], [Name], [Name] 
- Midfield: [Name], [Name], [Name]
- Forward: [Name]

**Rotating 6**: [Names]
Everyone plays! Subs every ~8 minutes for equal game time.
```

## Tie-Breaker Rules (In Order)
1. **Lower Count**: captain_count → starts_count → total_minutes
2. **Attendance**: Reward consistent attendance
3. **Random**: Coin flip, dice, or random number generator

## Season Balance Goals
- **Captains**: Everyone captains at least once before repeats
- **Goalkeeping**: Willing GKs get priority, others rotate fairly
- **Starts**: ±1 start difference max between any players
- **Minutes**: ±10% total minutes difference by season end
- **Positions**: Everyone tries at least 2 different position groups (D/M/F)

This system is transparent, fair, and easy to explain to parents!
