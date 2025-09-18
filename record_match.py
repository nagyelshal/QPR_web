#!/usr/bin/env python3
"""
Post-Match Recorder - Run this after each match to update history
Usage: python3 record_match.py [opponent] [date]
"""
import sys
import json
from randomize_team import TeamRandomizer

def main():
    opponent = sys.argv[1] if len(sys.argv) > 1 else "Unknown Opponent"
    match_date = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"📝 Recording match result vs {opponent}")
    
    # Load the current assignments from current-week.json
    try:
        with open('/home/nagy/QPR_web/data/current-week.json', 'r') as f:
            current_data = json.load(f)
        
        # Reconstruct assignments from current week data
        assignments = {
            'goalkeepers': [],
            'captains': [],
            'defence': [],
            'midfield': [],
            'strikers': []
        }
        
        # Get goalkeepers
        gk_data = current_data.get('goalkeepers', {})
        gk_names = [gk_data.get('first_half'), gk_data.get('second_half')]
        
        # Get captains
        cap_data = current_data.get('captains', {})
        cap_names = [cap_data.get('first_half'), cap_data.get('second_half')]
        
        # Get positions from zones
        zones = current_data.get('off_pitch', {}).get('zones', {})
        
        # Map player names to their player objects (with jerseys)
        player_lookup = {}
        for player_data in current_data.get('lineup', {}).get('all_players', []):
            player_lookup[player_data['name']] = player_data
        
        # Build assignments
        for gk_name in gk_names:
            if gk_name and gk_name in player_lookup:
                assignments['goalkeepers'].append(player_lookup[gk_name])
        
        for cap_name in cap_names:
            if cap_name and cap_name in player_lookup:
                assignments['captains'].append(player_lookup[cap_name])
        
        for zone_name in ['defence', 'midfield', 'strikers']:
            zone_players = zones.get(zone_name, [])
            for player_data in zone_players:
                player_name = player_data['name']
                if player_name in player_lookup:
                    assignments[zone_name].append(player_lookup[player_name])
        
        # Record the match
        randomizer = TeamRandomizer()
        randomizer.record_match_result(assignments, opponent, match_date)
        
        print("✅ Match recorded successfully!")
        print("Next week's randomizer will avoid these position repeats.")
        
    except Exception as e:
        print(f"❌ Error recording match: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
