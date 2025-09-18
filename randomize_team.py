#!/usr/bin/env python3
import json
import random
from collections import defaultdict, Counter
from datetime import datetime
import os

class TeamRandomizer:
    def __init__(self, seed=None):
        if seed:
            random.seed(seed)
            
        self.players = [
            {"name": "Adam K", "jersey": "13"},
            {"name": "Alexander V", "jersey": "8"},
            {"name": "Andy E", "jersey": "4"},
            {"name": "Andrew N", "jersey": "5"},
            {"name": "David C", "jersey": "14"},
            {"name": "Ethan G", "jersey": "15"},
            {"name": "Henry K", "jersey": "11"},
            {"name": "Minh-An D", "jersey": "2"},
            {"name": "Niko D", "jersey": "6"},
            {"name": "Owen H", "jersey": "9"},
            {"name": "Rafael H", "jersey": "12"},
            {"name": "Rhodri W", "jersey": "10"},
            {"name": "Travis C", "jersey": "3"},
            {"name": "Yejun K", "jersey": "7"},
            {"name": "Eunjun K", "jersey": "16"}
        ]
        
        # Historical tracking - now per-match structure
        self.history_file = '/home/nagy/QPR_web/data/position_history.json'
        self.match_history = []  # [{matchId, date, players: [{name, zones, captain, gk}]}]
        self.load_history()
        
    def load_history(self):
        """Load match history from persistent database"""
        try:
            with open(self.history_file, 'r') as f:
                data = json.load(f)
                
            # Check if old format - migrate if needed
            if 'position_history' in data and isinstance(data['position_history'], dict):
                print("🔄 Migrating old history format to per-match structure...")
                self.migrate_old_format(data)
            else:
                self.match_history = data.get('match_history', [])
                
            print(f"✅ Loaded {len(self.match_history)} match records")
            
        except FileNotFoundError:
            print(f"📝 Creating new match history database")
            self.create_initial_history()
        except Exception as e:
            print(f"⚠️  Error loading history: {e}")
            self.create_initial_history()
    
    def migrate_old_format(self, old_data):
        """Convert old flat position_history to per-match format"""
        # Create a single match record from the old data
        match_record = {
            'matchId': 'match-001',
            'date': '2025-09-14',
            'opponent': 'CMFSC Millwall',
            'players': {}
        }
        
        # Convert old position lists to last-known positions per player
        old_positions = old_data.get('position_history', {})
        old_captains = old_data.get('captain_history', [])
        old_gks = old_data.get('gk_history', [])
        
        for player_name in [p['name'] for p in self.players]:
            zones = []
            if player_name in old_positions:
                # Take most recent unique zones
                seen = set()
                for zone in reversed(old_positions[player_name]):
                    if zone not in seen:
                        zones.append(zone)
                        seen.add(zone)
                zones.reverse()
            
            match_record['players'][player_name] = {
                'zones': zones,
                'captain': player_name in old_captains,
                'goalkeeper': player_name in old_gks
            }
        
        self.match_history = [match_record]
        self.save_history()
        print("✅ Migration complete")
    
    def create_initial_history(self):
        """Create initial history from current-week.json previous match"""
        try:
            with open('/home/nagy/QPR_web/data/current-week.json', 'r') as f:
                current_data = json.load(f)
                
            if 'previous_match' in current_data:
                prev_match = current_data['previous_match']
                
                match_record = {
                    'matchId': 'match-001',
                    'date': prev_match.get('date', '2025-09-14'),
                    'opponent': prev_match.get('opponent', 'Unknown'),
                    'players': {}
                }
                
                # Initialize all players
                for player in self.players:
                    match_record['players'][player['name']] = {
                        'zones': [],
                        'captain': False,
                        'goalkeeper': False
                    }
                
                # Process starting lineup
                if 'lineup_used' in prev_match and 'starting' in prev_match['lineup_used']:
                    for player in prev_match['lineup_used']['starting']:
                        name = player['name']
                        zone = self._position_to_zone(player['pos'])
                        if zone and name in match_record['players']:
                            match_record['players'][name]['zones'].append(zone)
                
                # Process goalkeepers
                if 'lineup_used' in prev_match and 'goalkeepers' in prev_match['lineup_used']:
                    gks = prev_match['lineup_used']['goalkeepers']
                    for gk_name in [gks.get('first_half'), gks.get('second_half')]:
                        if gk_name and gk_name in match_record['players']:
                            match_record['players'][gk_name]['goalkeeper'] = True
                            if 'goalkeeper' not in match_record['players'][gk_name]['zones']:
                                match_record['players'][gk_name]['zones'].append('goalkeeper')
                
                # Process captains
                if 'lineup_used' in prev_match and 'captains' in prev_match['lineup_used']:
                    caps = prev_match['lineup_used']['captains']
                    for cap_name in [caps.get('first_half'), caps.get('second_half')]:
                        if cap_name and cap_name in match_record['players']:
                            match_record['players'][cap_name]['captain'] = True
                
                # Add known corrections for missing players
                corrections = {
                    'Eunjun K': ['striker'],
                    'Ethan G': ['striker'],
                    'David C': ['striker'],
                    'Niko D': ['midfield'],
                    'Rhodri W': ['defence'],
                    'Minh-An D': ['defence']
                }
                
                for player_name, zones in corrections.items():
                    if player_name in match_record['players']:
                        match_record['players'][player_name]['zones'].extend(zones)
                
                self.match_history = [match_record]
                self.save_history()
                print("✅ Created initial history from previous match")
                
        except Exception as e:
            print(f"⚠️  Could not create initial history: {e}")
            self.match_history = []
    
    def save_history(self):
        """Save match history to persistent database"""
        data = {
            'match_history': self.match_history,
            'last_updated': datetime.now().isoformat()
        }
        
        with open(self.history_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def get_last_match_zones(self, player_name):
        """Get zones player played in the most recent match"""
        if not self.match_history:
            return []
        
        last_match = self.match_history[-1]
        player_data = last_match['players'].get(player_name, {})
        return player_data.get('zones', [])
    
    def get_recent_captains(self, num_matches=2):
        """Get captains from recent matches"""
        captains = []
        for match in self.match_history[-num_matches:]:
            for player_name, data in match['players'].items():
                if data.get('captain', False):
                    captains.append(player_name)
        return captains
    
    def get_recent_goalkeepers(self, num_matches=2):
        """Get goalkeepers from recent matches"""
        gks = []
        for match in self.match_history[-num_matches:]:
            for player_name, data in match['players'].items():
                if data.get('goalkeeper', False):
                    gks.append(player_name)
        return list(set(gks))  # Remove duplicates
    
    def get_starting_history(self):
        """Get count of how many times each player has started (based on started field in match history)"""
        starting_counts = defaultdict(int)
        
        # Initialize all players with 0 starts
        for player in self.players:
            starting_counts[player['name']] = 0
        
        # Count actual starts from match history using 'started' field
        for match in self.match_history:
            for player_name, player_data in match['players'].items():
                # Check if player has 'started' field set to True
                if player_data.get('started', False):
                    starting_counts[player_name] += 1
        
        return dict(starting_counts)
    
    def smart_select_starting_lineup(self, assignments):
        """Select 8-player starting lineup based on starting history (giving priority to less-started players)"""
        print("\n🏁 SMART STARTING LINEUP SELECTION:")
        
        starting_history = self.get_starting_history()
        print(f"📊 Starting history: {dict(sorted(starting_history.items(), key=lambda x: x[1]))}")
        
        # Starting GK is always the first-half goalkeeper
        starting_gk = assignments['goalkeepers'][0]
        non_starting_gk = assignments['goalkeepers'][1]  # Second GK who will start as field player
        
        # Pool of field players to choose from (includes the non-starting GK as a field player)
        field_candidates = []
        for zone in ['defence', 'midfield', 'strikers']:
            for player in assignments[zone]:
                # Include everyone EXCEPT the starting GK (but include the non-starting GK)
                if player['name'] != starting_gk['name']:
                    field_candidates.append((player, zone))
        
        # Sort by starting count (ascending) then randomize within same counts
        def get_start_priority(player_zone_tuple):
            player, zone = player_zone_tuple
            start_count = starting_history.get(player['name'], 0)
            return (start_count, random.random())  # Secondary random for tie-breaking
        
        field_candidates.sort(key=get_start_priority)
        
        # Select 7 field players: 2 defence, 3 midfield, 2 strikers
        selected_by_zone = {'defence': [], 'midfield': [], 'strikers': []}
        targets = {'defence': 2, 'midfield': 3, 'strikers': 2}
        
        # First pass: try to get balanced selection by giving priority to less-started players
        remaining_candidates = field_candidates.copy()
        
        for player, zone in field_candidates:
            if len(selected_by_zone[zone]) < targets[zone]:
                selected_by_zone[zone].append(player)
                remaining_candidates.remove((player, zone))
                
                # Stop when we have 7 total
                if sum(len(selected_by_zone[z]) for z in selected_by_zone) == 7:
                    break
        
        # If we don't have exactly what we need, fill remaining spots
        total_selected = sum(len(selected_by_zone[z]) for z in selected_by_zone)
        if total_selected < 7:
            needed = 7 - total_selected
            for player, zone in remaining_candidates[:needed]:
                # Add to any zone that still needs players, or to midfield as default
                for target_zone in ['defence', 'midfield', 'strikers']:
                    if len(selected_by_zone[target_zone]) < targets[target_zone]:
                        selected_by_zone[target_zone].append(player)
                        break
                else:
                    # All target zones full, add to midfield (it's flexible)
                    selected_by_zone['midfield'].append(player)
        
        # Show selection reasoning
        for zone, players in selected_by_zone.items():
            player_info = []
            for player in players:
                start_count = starting_history.get(player['name'], 0)
                player_info.append(f"{player['name']} ({start_count} starts)")
            print(f"  {zone.upper()}: {', '.join(player_info)}")
        
        # Create tactical positions
        starting_lineup = []
        
        # GK
        starting_lineup.append({
            "name": starting_gk['name'], 
            "pos": "GK", 
            "jersey": starting_gk['jersey']
        })
        
        # Defence (2 CBs)  
        def_positions = ["CB", "CB2"]
        for i, player in enumerate(selected_by_zone['defence']):
            starting_lineup.append({
                "name": player['name'],
                "pos": def_positions[i] if i < len(def_positions) else "CB",
                "jersey": player['jersey']
            })
        
        # Midfield (3 players: LM, CM, RM)
        mid_positions = ["LM", "CM", "RM"]
        for i, player in enumerate(selected_by_zone['midfield']):
            starting_lineup.append({
                "name": player['name'],
                "pos": mid_positions[i] if i < len(mid_positions) else "CM", 
                "jersey": player['jersey']
            })
        
        # Strikers (2 STs)
        str_positions = ["ST", "ST2"] 
        for i, player in enumerate(selected_by_zone['strikers']):
            starting_lineup.append({
                "name": player['name'],
                "pos": str_positions[i] if i < len(str_positions) else "ST",
                "jersey": player['jersey']
            })
        
        print(f"✅ Selected {len(starting_lineup)} starters based on minimal starting history")
        return starting_lineup
    
    def _position_to_zone(self, pos):
        """Convert specific position to zone"""
        if pos == 'GK':
            return 'goalkeeper'
        elif pos in ['LB', 'CB', 'RB', 'CB2']:
            return 'defence'
        elif pos in ['LM', 'CM', 'RM']:
            return 'midfield'
        elif pos in ['ST', 'ST2']:
            return 'striker'
        return None
    
    def smart_assign_positions(self):
        """Assign positions with hard constraints against recent repeats"""
        assignments = {
            'goalkeepers': [],
            'defence': [],
            'midfield': [],
            'strikers': [],
            'captains': []
        }
        
        available_players = self.players.copy()
        
        print("🚫 Applying hard constraints against last-match repeats...")
        
        # 1. Assign goalkeepers (avoid recent GKs if possible)
        recent_gks = self.get_recent_goalkeepers(1)
        gk_candidates = [p for p in available_players if p['name'] not in recent_gks]
        
        if len(gk_candidates) >= 2:
            assignments['goalkeepers'] = random.sample(gk_candidates, 2)
            print(f"  GKs: Avoided recent GKs {recent_gks}")
        else:
            # Not enough non-recent GKs, include some recent ones
            assignments['goalkeepers'] = random.sample(available_players, 2)
            print(f"  GKs: Had to include recent GKs (not enough alternatives)")
        
        # 2. Assign captains (avoid recent captains and current GKs)
        recent_captains = self.get_recent_captains(1)
        gk_names = [gk['name'] for gk in assignments['goalkeepers']]
        
        captain_candidates = [p for p in available_players 
                            if p['name'] not in recent_captains and p['name'] not in gk_names]
        
        if len(captain_candidates) >= 2:
            assignments['captains'] = random.sample(captain_candidates, 2)
            print(f"  Captains: Avoided recent captains {recent_captains} and GKs {gk_names}")
        else:
            # Fall back to avoiding just GKs
            captain_candidates = [p for p in available_players if p['name'] not in gk_names]
            assignments['captains'] = random.sample(captain_candidates, min(2, len(captain_candidates)))
            print(f"  Captains: Avoided GKs, some recent captains included")
        
        # 3. Assign field positions with hard constraints
        # Start with all players EXCEPT the goalkeepers (who are already assigned)
        gk_names = [gk['name'] for gk in assignments['goalkeepers']]
        field_players = [p for p in available_players if p['name'] not in gk_names]
        
        for zone_name, target_count in [('defence', 4), ('strikers', 4)]:
            print(f"\n{zone_name.upper()} assignment:")
            
            # Hard constraint: avoid players who played this zone last match
            # Note: zone_name is plural ('strikers') but data stores singular ('striker')
            zone_to_check = zone_name[:-1] if zone_name.endswith('s') else zone_name  # strikers -> striker
            last_match_players = []
            if self.match_history:
                for player_name, data in self.match_history[-1]['players'].items():
                    if zone_to_check in data.get('zones', []):
                        last_match_players.append(player_name)
            
            # Candidates who didn't play this zone last match
            preferred_candidates = [p for p in field_players 
                                 if p['name'] not in last_match_players]
            
            print(f"  Avoiding last-match {zone_name}: {last_match_players}")
            print(f"  Preferred candidates: {[p['name'] for p in preferred_candidates[:8]]}")
            
            if len(preferred_candidates) >= target_count:
                # Enough candidates who didn't play this zone last match
                selected = random.sample(preferred_candidates, target_count)
                print(f"  ✅ Selected all new: {[p['name'] for p in selected]}")
            else:
                # Not enough, include some repeats
                remaining_needed = target_count - len(preferred_candidates)
                repeat_candidates = [p for p in field_players 
                                   if p not in preferred_candidates]
                
                selected = preferred_candidates + random.sample(repeat_candidates, remaining_needed)
                print(f"  ⚠️  Had to include {remaining_needed} repeats: {[p['name'] for p in selected]}")
            
            assignments[zone_name] = selected
            field_players = [p for p in field_players if p not in selected]
        
        # 4. Remaining players go to midfield
        assignments['midfield'] = field_players
        
        print(f"\nMidfield gets remaining: {[p['name'] for p in field_players]}")
        
        # 5. Add goalkeepers to field zones (they need to play field positions when not goalkeeping)
        gk1, gk2 = assignments['goalkeepers']
        
        # Distribute GKs to zones that need more players or randomly if balanced
        zone_counts = {
            'defence': len(assignments['defence']),
            'midfield': len(assignments['midfield']),
            'strikers': len(assignments['strikers'])
        }
        
        # Find zones with fewer players (less than 4 ideally)
        available_zones = [zone for zone, count in zone_counts.items() if count < 6]
        if not available_zones:
            available_zones = ['defence', 'midfield', 'strikers']
        
        # Assign gk1 to a zone
        gk1_zone = random.choice(available_zones)
        assignments[gk1_zone].append(gk1)
        
        # Assign gk2 to a different zone if possible
        remaining_zones = [z for z in available_zones if z != gk1_zone]
        if remaining_zones:
            gk2_zone = random.choice(remaining_zones)
        else:
            # If no different zones available, use a different one anyway
            gk2_zone = random.choice([z for z in ['defence', 'midfield', 'strikers'] if z != gk1_zone])
        
        assignments[gk2_zone].append(gk2)
        
        print(f"🥅 Added goalkeepers to field zones:")
        print(f"  {gk1['name']} → {gk1_zone}")
        print(f"  {gk2['name']} → {gk2_zone}")
        
        # 6. Final check - ensure GKs are in different field zones (this should now always be true)
        gk1_zone_final = None
        gk2_zone_final = None
        
        for zone_name, players in [('defence', assignments['defence']), 
                                  ('midfield', assignments['midfield']), 
                                  ('strikers', assignments['strikers'])]:
            for player in players:
                if player['name'] == gk1['name']:
                    gk1_zone_final = zone_name
                if player['name'] == gk2['name']:
                    gk2_zone_final = zone_name
        
        return assignments
    
    def generate_assignments(self):
        """Main function to generate new team assignments"""
        print("🔍 Loading match history database...")
        
        print(f"\n📊 Recent Match Analysis ({len(self.match_history)} matches):")
        if self.match_history:
            last_match = self.match_history[-1]
            print(f"Last match: {last_match.get('opponent', 'Unknown')} on {last_match.get('date', 'Unknown')}")
            
            for player_name in sorted([p['name'] for p in self.players]):
                player_data = last_match['players'].get(player_name, {})
                zones = player_data.get('zones', [])
                captain = "👑" if player_data.get('captain') else ""
                gk = "🥅" if player_data.get('goalkeeper') else ""
                
                if zones:
                    print(f"  {player_name}: {', '.join(zones)} {captain}{gk}")
                else:
                    print(f"  {player_name}: No data")
        
        print(f"\n👑 Recent Captains: {self.get_recent_captains()}")
        print(f"🥅 Recent Goalkeepers: {self.get_recent_goalkeepers()}")
        
        print("\n🎲 Generating smart assignments with hard constraints...")
        assignments = self.smart_assign_positions()
        
        return assignments
    
    def record_match_result(self, assignments, opponent="TBD", match_date=None):
        """Record the assignments as a completed match"""
        if not match_date:
            match_date = datetime.now().strftime('%Y-%m-%d')
        
        match_id = f"match-{len(self.match_history) + 1:03d}"
        
        match_record = {
            'matchId': match_id,
            'date': match_date,
            'opponent': opponent,
            'players': {}
        }
        
        gk_names = [gk['name'] for gk in assignments['goalkeepers']]
        captain_names = [cap['name'] for cap in assignments['captains']]
        
        for player in self.players:
            player_name = player['name']
            zones = []
            
            # Find which zone(s) this player is assigned to
            for zone_name, players in [('defence', assignments['defence']), 
                                      ('midfield', assignments['midfield']), 
                                      ('strikers', assignments['strikers'])]:
                if any(p['name'] == player_name for p in players):
                    zones.append(zone_name)
            
            match_record['players'][player_name] = {
                'zones': zones,
                'captain': player_name in captain_names,
                'goalkeeper': player_name in gk_names
            }
        
        self.match_history.append(match_record)
        self.save_history()
        print(f"\n💾 Recorded match {match_id} to history")
    
    def update_current_week_json(self, assignments):
        """Update current week JSON with assignments"""
        with open('/home/nagy/QPR_web/data/current-week.json', 'r') as f:
            data = json.load(f)
        
        # Update captains
        data["captains"]["first_half"] = assignments['captains'][0]['name']
        data["captains"]["second_half"] = assignments['captains'][1]['name']
        
        # Find GK field zones and set alternates
        gk1, gk2 = assignments['goalkeepers']
        gk1_field_zone = "midfield"  # default
        gk2_field_zone = "striker"   # default
        
        for zone_name, players in [('defence', assignments['defence']), 
                                  ('midfield', assignments['midfield']), 
                                  ('strikers', assignments['strikers'])]:
            for player in players:
                if player['name'] == gk1['name']:
                    gk1_field_zone = zone_name
                if player['name'] == gk2['name']:
                    gk2_field_zone = zone_name
        
        gk1_alt_pos = "CB" if gk1_field_zone == "defence" else ("CM" if gk1_field_zone == "midfield" else "ST")
        gk2_alt_pos = "CB" if gk2_field_zone == "defence" else ("CM" if gk2_field_zone == "midfield" else "ST")
        
        data["goalkeepers"]["first_half"] = gk1['name']
        data["goalkeepers"]["second_half"] = gk2['name']
        data["goalkeepers"]["rotation_note"] = f"Smart rotation - {gk1['name']} (field: {gk1_alt_pos}) and {gk2['name']} (field: {gk2_alt_pos}) with no recent repeats!"
        
        # Update zones
        data["off_pitch"]["zones"]["goalkeepers"] = [
            {"name": gk1['name'], "jersey": gk1['jersey'], "alternate_pos": gk1_alt_pos},
            {"name": gk2['name'], "jersey": gk2['jersey'], "alternate_pos": gk2_alt_pos}
        ]
        
        data["off_pitch"]["zones"]["defence"] = [
            {"name": p['name'], "jersey": p['jersey'], "pos": "CB"} for p in assignments['defence']
        ]
        
        # Handle variable midfield size
        midfield_size = len(assignments['midfield'])
        midfield_positions = ["LM", "CM", "CM", "RM"] + ["CM"] * (midfield_size - 4)
        random.shuffle(midfield_positions)
        
        data["off_pitch"]["zones"]["midfield"] = [
            {"name": assignments['midfield'][i]['name'], 
             "jersey": assignments['midfield'][i]['jersey'], 
             "pos": midfield_positions[i]} 
            for i in range(midfield_size)
        ]
        
        data["off_pitch"]["zones"]["strikers"] = [
            {"name": p['name'], "jersey": p['jersey'], "pos": "ST"} for p in assignments['strikers']
        ]
        
        # Update positions array
        data["positions"]["all_positions"] = []
        
        for p in assignments['defence']:
            data["positions"]["all_positions"].append({
                "name": p['name'], "pos": "Defence", "tactical_pos": "CB", "jersey": p['jersey']
            })
        
        for i, p in enumerate(assignments['midfield']):
            pos_index = min(i, len(midfield_positions) - 1)
            data["positions"]["all_positions"].append({
                "name": p['name'], "pos": "Midfield", "tactical_pos": midfield_positions[pos_index], "jersey": p['jersey']
            })
        
        for p in assignments['strikers']:
            data["positions"]["all_positions"].append({
                "name": p['name'], "pos": "Strikers", "tactical_pos": "ST", "jersey": p['jersey']
            })
        
        # Update instructions
        def_names = ", ".join([p['name'] for p in assignments['defence']])
        mid_names = ", ".join([p['name'] for p in assignments['midfield']])
        str_names = ", ".join([p['name'] for p in assignments['strikers']])
        
        data["off_pitch"]["instructions"] = f"CONSTRAINT-BASED ASSIGNMENTS! Defence: {def_names}. Midfield: {mid_names}. Strikers: {str_names}. {gk1['name']} & {gk2['name']} are goalkeepers with different field positions."
        
        # Create smart starting lineup based on starting history
        starting_lineup = self.smart_select_starting_lineup(assignments)
        data["lineup"]["starting"] = starting_lineup
        
        with open('/home/nagy/QPR_web/data/current-week.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        print("✅ Updated current-week.json with constraint-based assignments")

def main():
    # Support deterministic mode for debugging
    seed = os.environ.get('RANDOMIZER_SEED')
    if seed:
        print(f"🎯 Using seed: {seed}")
    
    randomizer = TeamRandomizer(seed=seed)
    assignments = randomizer.generate_assignments()
    
    print("\n🎲 CONSTRAINT-BASED TEAM ASSIGNMENTS:")
    print(f"Captains: {assignments['captains'][0]['name']} (1st), {assignments['captains'][1]['name']} (2nd)")
    
    # Show goalkeepers and their field positions
    gk1_name = assignments['goalkeepers'][0]['name']
    gk2_name = assignments['goalkeepers'][1]['name']
    
    gk1_field_pos = "Unknown"
    gk2_field_pos = "Unknown"
    
    for zone, players in [('defence', assignments['defence']), 
                         ('midfield', assignments['midfield']), 
                         ('strikers', assignments['strikers'])]:
        for player in players:
            if player['name'] == gk1_name:
                gk1_field_pos = zone
            if player['name'] == gk2_name:
                gk2_field_pos = zone
    
    print(f"Goalkeepers: {gk1_name} (field: {gk1_field_pos}), {gk2_name} (field: {gk2_field_pos})")
    print(f"Defence ({len(assignments['defence'])}): {', '.join([p['name'] for p in assignments['defence']])}")
    print(f"Midfield ({len(assignments['midfield'])}): {', '.join([p['name'] for p in assignments['midfield']])}")
    print(f"Strikers ({len(assignments['strikers'])}): {', '.join([p['name'] for p in assignments['strikers']])}")
    
    print(f"\n🔄 ROTATION LOGIC:")
    print(f"• {gk1_name}: GK in 1st half, plays {gk1_field_pos} in 2nd half")  
    print(f"• {gk2_name}: plays {gk2_field_pos} in 1st half, GK in 2nd half")
    
    randomizer.update_current_week_json(assignments)
    
    # Optionally record this as a completed match (uncomment when match is played)
    # randomizer.record_match_result(assignments, opponent="PCFC Wolf Pack", match_date="2025-09-27")

if __name__ == "__main__":
    main()
