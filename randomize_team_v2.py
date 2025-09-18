#!/usr/bin/env python3
import json
import random
from datetime import datetime

def randomize_team():
    # Load position history data
    with open('/home/nagy/QPR_web/data/position_history.json', 'r') as f:
        history_data = json.load(f)
    
    # Load current week data
    with open('/home/nagy/QPR_web/data/current-week.json', 'r') as f:
        data = json.load(f)
    
    # All 15 players
    all_players = [
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
    
    # Get previous positions from position_history.json
    position_history = history_data.get("position_history", {})
    previous_captains = history_data.get("captain_history", [])
    previous_gks = history_data.get("gk_history", [])
    
    print("=== ACTUAL PREVIOUS MATCH DATA ===")
    print("Previous positions from position_history.json:")
    for player, positions in position_history.items():
        latest_pos = positions[-1] if positions else "unknown"
        print(f"  {player}: {latest_pos}")
    print(f"Previous captains: {previous_captains}")
    print(f"Previous goalkeepers: {previous_gks}")
    print()
    
    # Categorize players by their most recent position
    prev_goalkeepers = [p for p in all_players if position_history.get(p["name"], [])[-1:] == ["goalkeeper"]]
    prev_defenders = [p for p in all_players if position_history.get(p["name"], [])[-1:] == ["defence"]]
    prev_midfielders = [p for p in all_players if position_history.get(p["name"], [])[-1:] == ["midfield"]]
    prev_strikers = [p for p in all_players if position_history.get(p["name"], [])[-1:] == ["striker"]]
    new_players = [p for p in all_players if p["name"] not in position_history]
    
    print("=== POSITION CATEGORIES ===")
    print(f"Previous GKs: {[p['name'] for p in prev_goalkeepers]}")
    print(f"Previous Defence: {[p['name'] for p in prev_defenders]}")  
    print(f"Previous Midfield: {[p['name'] for p in prev_midfielders]}")
    print(f"Previous Strikers: {[p['name'] for p in prev_strikers]}")
    print(f"New/No history: {[p['name'] for p in new_players]}")
    print()
    
    # 1. Pick goalkeepers - strictly exclude previous goalkeepers
    non_gk_candidates = [p for p in all_players if p["name"] not in previous_gks]
    goalkeepers = random.sample(non_gk_candidates, 2)
    
    remaining_players = [p for p in all_players if p not in goalkeepers]
    
    # 2. Pick captains - prefer non-captains from previous match
    non_captain_candidates = [p for p in remaining_players if p["name"] not in previous_captains]
    if len(non_captain_candidates) >= 2:
        captains = random.sample(non_captain_candidates, 2)
    else:
        # If not enough non-captain candidates, include some previous captains
        captains = random.sample(remaining_players, 2)
    
    # 3. Assign positions intelligently - try to give different experiences
    
    # For defence: prefer non-defenders from previous match
    non_def_candidates = [p for p in remaining_players if position_history.get(p["name"], [])[-1:] != ["defence"]]
    if len(non_def_candidates) >= 4:
        defence_players = random.sample(non_def_candidates, 4)
    else:
        # Fill remaining spots with previous defenders if needed
        remaining_def_slots = 4 - len(non_def_candidates)
        prev_def_available = [p for p in prev_defenders if p in remaining_players]
        defence_players = non_def_candidates + random.sample(prev_def_available, min(remaining_def_slots, len(prev_def_available)))
        # If still not enough, fill from anyone remaining
        if len(defence_players) < 4:
            others = [p for p in remaining_players if p not in defence_players]
            defence_players += random.sample(others, 4 - len(defence_players))
    
    remaining_after_def = [p for p in remaining_players if p not in defence_players]
    
    # For strikers: prefer non-strikers from previous match  
    non_str_candidates = [p for p in remaining_after_def if position_history.get(p["name"], [])[-1:] != ["striker"]]
    if len(non_str_candidates) >= 4:
        striker_players = random.sample(non_str_candidates, 4)
    else:
        # Fill remaining spots with previous strikers if needed
        remaining_str_slots = 4 - len(non_str_candidates)
        prev_str_available = [p for p in prev_strikers if p in remaining_after_def]
        striker_players = non_str_candidates + random.sample(prev_str_available, min(remaining_str_slots, len(prev_str_available)))
        # If still not enough, fill from anyone remaining
        if len(striker_players) < 4:
            others = [p for p in remaining_after_def if p not in striker_players]
            striker_players += random.sample(others, 4 - len(striker_players))
    
    # Remaining 5 players go to midfield
    midfield_players = [p for p in remaining_after_def if p not in striker_players]
    
    # Assign specific midfield positions (LM, CM, RM all treated as midfield)
    midfield_positions = ["LM", "CM", "CM", "RM", "LM/RM"]  # 2 CM, 2 LM, 1 flexible
    random.shuffle(midfield_positions)
    
    # Assign alternate positions for goalkeepers based on last match data
    # Generate alternate positions for goalkeepers based on their previous field position
    gk_alternates = []
    for gk in goalkeepers:
        prev_pos = position_history.get(gk["name"], ["Field"])[-1]
        # Capitalize for display
        alt = prev_pos.capitalize() if prev_pos != "goalkeeper" else "Field"
        gk_alternates.append(alt)
    
    # Build the updated data structure
    data["captains"]["first_half"] = captains[0]["name"]
    data["captains"]["second_half"] = captains[1]["name"]
    
    data["goalkeepers"]["first_half"] = goalkeepers[0]["name"]
    data["goalkeepers"]["second_half"] = goalkeepers[1]["name"]
    data["goalkeepers"]["rotation_note"] = f"New goalkeeper rotation - {goalkeepers[0]['name']} (alternate: {gk_alternates[0]}) and {goalkeepers[1]['name']} (alternate: {gk_alternates[1]})!"
    
    # Update zones structure
    data["off_pitch"]["zones"]["goalkeepers"] = [
        {"name": goalkeepers[0]["name"], "jersey": goalkeepers[0]["jersey"], "alternate_pos": gk_alternates[0]},
        {"name": goalkeepers[1]["name"], "jersey": goalkeepers[1]["jersey"], "alternate_pos": gk_alternates[1]}
    ]
    
    data["off_pitch"]["zones"]["defence"] = [
        {"name": p["name"], "jersey": p["jersey"], "pos": "CB"} for p in defence_players
    ]
    
    data["off_pitch"]["zones"]["midfield"] = [
        {"name": midfield_players[i]["name"], "jersey": midfield_players[i]["jersey"], "pos": midfield_positions[i]} 
        for i in range(5)
    ]
    
    data["off_pitch"]["zones"]["strikers"] = [
        {"name": p["name"], "jersey": p["jersey"], "pos": "ST"} for p in striker_players
    ]
    
    # Update positions array
    data["positions"]["all_positions"] = []
    
    # Add defence positions
    for p in defence_players:
        data["positions"]["all_positions"].append({
            "name": p["name"],
            "pos": "Defence",
            "tactical_pos": "CB",
            "jersey": p["jersey"]
        })
    
    # Add midfield positions  
    for i, p in enumerate(midfield_players):
        data["positions"]["all_positions"].append({
            "name": p["name"],
            "pos": "Midfield", 
            "tactical_pos": midfield_positions[i],
            "jersey": p["jersey"]
        })
    
    # Add striker positions
    for p in striker_players:
        data["positions"]["all_positions"].append({
            "name": p["name"],
            "pos": "Strikers",
            "tactical_pos": "ST", 
            "jersey": p["jersey"]
        })
    
    # Update instructions
    def_names = ", ".join([p["name"] for p in defence_players])
    mid_names = ", ".join([p["name"] for p in midfield_players])
    str_names = ", ".join([p["name"] for p in striker_players])
    
    data["off_pitch"]["instructions"] = f"NEW ZONE ASSIGNMENTS! When off pitch, stand in your assigned zone. Defence: {def_names}. Midfield: {mid_names}. Strikers: {str_names}. {goalkeepers[0]['name']} & {goalkeepers[1]['name']} are this week's goalkeepers."
    
    # Create starting lineup (8 players for 2-3-2)
    starting_gk = goalkeepers[0]
    starting_def = random.sample(defence_players, 2)  # 2 CB
    starting_mid = random.sample(midfield_players, 3)  # 3 midfield
    starting_str = random.sample(striker_players, 2)  # 2 ST
    
    data["lineup"]["starting"] = [
        {"name": starting_gk["name"], "pos": "GK", "jersey": starting_gk["jersey"]},
        {"name": starting_def[0]["name"], "pos": "CB", "jersey": starting_def[0]["jersey"]},
        {"name": starting_def[1]["name"], "pos": "CB2", "jersey": starting_def[1]["jersey"]},
        {"name": starting_mid[0]["name"], "pos": "LM", "jersey": starting_mid[0]["jersey"]},
        {"name": starting_mid[1]["name"], "pos": "CM", "jersey": starting_mid[1]["jersey"]},
        {"name": starting_mid[2]["name"], "pos": "RM", "jersey": starting_mid[2]["jersey"]},
        {"name": starting_str[0]["name"], "pos": "ST", "jersey": starting_str[0]["jersey"]},
        {"name": starting_str[1]["name"], "pos": "ST2", "jersey": starting_str[1]["jersey"]}
    ]
    
    # Save the updated data
    with open('/home/nagy/QPR_web/data/current-week.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print("🎲 HISTORY-AWARE RANDOMIZED ASSIGNMENTS:")
    print(f"Captains: {captains[0]['name']} (1st half), {captains[1]['name']} (2nd half)")
    print(f"  └─ Previous captains were: {', '.join(previous_captains)} → giving others a chance!")
    print()
    print(f"Goalkeepers: {goalkeepers[0]['name']} (alt: {gk_alternates[0]}), {goalkeepers[1]['name']} (alt: {gk_alternates[1]})")
    print(f"  └─ Previous GKs were: {', '.join(previous_gks)} → giving others a chance!")
    print()
    print(f"Defence (4): {def_names}")
    print(f"Midfield (5): {mid_names}")
    print(f"Strikers (4): {str_names}")
    print()
    print("=== POSITION CHANGES FOR NEW EXPERIENCES ===")
    for player_data in all_players:
        name = player_data["name"]
        if name in position_history:
            prev_pos = position_history[name][-1] if position_history[name] else "unknown"
        else:
            prev_pos = "new"
            
        # Find current assignment - use alternate position for goalkeepers since GK is just a tag
        current_pos = "unknown"
        if name in [gk["name"] for gk in goalkeepers]:
            # Goalkeeper's actual position is their alternate position
            gk_index = [gk["name"] for gk in goalkeepers].index(name)
            alt_pos = gk_alternates[gk_index].lower()
            current_pos = alt_pos
        elif name in [p["name"] for p in defence_players]:
            current_pos = "defence"
        elif name in [p["name"] for p in midfield_players]:
            current_pos = "midfield"
        elif name in [p["name"] for p in striker_players]:
            current_pos = "striker"
            
        if prev_pos != current_pos:
            print(f"  ✅ {name}: {prev_pos} → {current_pos} (NEW EXPERIENCE)")
        else:
            print(f"  🔄 {name}: {prev_pos} (repeated - unavoidable)")
    
    print(f"\nTotal: {len(defence_players) + len(midfield_players) + len(striker_players) + len(goalkeepers)} players ✓")
    print(f"Field players: {len(defence_players) + len(midfield_players) + len(striker_players)}, Goalkeepers: {len(goalkeepers)}")

if __name__ == "__main__":
    random.seed()  # Use current time as seed for true randomization
    randomize_team()
