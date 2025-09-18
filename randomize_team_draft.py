#!/usr/bin/env python3
import json
import random
from datetime import datetime

def randomize_team_with_draft():
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
    
    print("=== POSITION DRAFT WITH SPECIFIC ASSIGNMENTS ===")
    print("Draft requirements:")
    print("  - Rafael H, Niko D, Rhodri W → ATTACK (strikers)")
    print("  - Travis C, Ethan G (#15), Eunjun K (#16) → MIDFIELD")  # Updated to show Ethan G
    print("  - Yejun K (#7) → Available for rotation")
    print("  - Rest follow rotation rules")
    print()
    
    # DRAFT ASSIGNMENTS (fixed positions based on requirements)
    draft_strikers = ["Rafael H", "Niko D", "Rhodri W"]
    draft_midfielders = ["Travis C", "Ethan G", "Eunjun K"]  # Swapped: Ethan G instead of Yejun K
    
    # Get player objects for draft assignments
    draft_striker_players = [p for p in all_players if p["name"] in draft_strikers]
    draft_midfielder_players = [p for p in all_players if p["name"] in draft_midfielders]
    
    # Remaining players for rotation
    remaining_for_rotation = [p for p in all_players if p["name"] not in draft_strikers + draft_midfielders]
    
    print(f"Draft Strikers (3): {[p['name'] for p in draft_striker_players]}")
    print(f"Draft Midfielders (3): {[p['name'] for p in draft_midfielder_players]}")
    print(f"Remaining for rotation (9): {[p['name'] for p in remaining_for_rotation]}")
    print()
    
    # 1. Pick goalkeepers - strictly exclude previous goalkeepers
    non_gk_candidates = [p for p in remaining_for_rotation if p["name"] not in previous_gks]
    goalkeepers = random.sample(non_gk_candidates, 2)
    
    remaining_after_gk = [p for p in remaining_for_rotation if p not in goalkeepers]
    
    # 2. Pick captains - prefer non-captains from ALL players (including draft assignments)
    all_non_captain_candidates = [p for p in all_players if p["name"] not in previous_captains]
    if len(all_non_captain_candidates) >= 2:
        captains = random.sample(all_non_captain_candidates, 2)
    else:
        captains = random.sample(all_players, 2)
    
    # 4. INTELLIGENT ROTATION for remaining 7 players (2 GK already selected)
    # Remaining after GK selection: 7 players
    # Need: 2 more strikers, 3 more midfielders, 1 defender (since GK alternates count as 2 defenders)
    # Target: 4 defenders (1 regular + 2 GK alternates + 1 more) + 6 midfielders (3 draft + 3 more) + 5 strikers (3 draft + 2 more)
    
    remaining_after_gk = [p for p in remaining_for_rotation if p not in goalkeepers]
    print(f"After GK selection, remaining 7 players: {[p['name'] for p in remaining_after_gk]}")
    
    # Strategy: Give new experiences where possible
    # Group by previous positions
    remaining_prev_defenders = [p for p in remaining_after_gk if position_history.get(p["name"], [])[-1:] == ["defence"]]
    remaining_prev_midfielders = [p for p in remaining_after_gk if position_history.get(p["name"], [])[-1:] == ["midfield"]]
    remaining_prev_strikers = [p for p in remaining_after_gk if position_history.get(p["name"], [])[-1:] == ["striker"]]
    remaining_new_players = [p for p in remaining_after_gk if p["name"] not in position_history]
    
    print(f"  Remaining prev defenders: {[p['name'] for p in remaining_prev_defenders]}")
    print(f"  Remaining prev midfielders: {[p['name'] for p in remaining_prev_midfielders]}")
    print(f"  Remaining prev strikers: {[p['name'] for p in remaining_prev_strikers]}")
    
    # 5. Pick 2 additional strikers (prefer non-strikers for new experience)
    additional_striker_candidates = remaining_prev_defenders + remaining_prev_midfielders + remaining_new_players
    if len(additional_striker_candidates) >= 2:
        additional_strikers = random.sample(additional_striker_candidates, 2)
    else:
        additional_strikers = additional_striker_candidates + random.sample([p for p in remaining_after_gk if p not in additional_striker_candidates], 2 - len(additional_striker_candidates))
    
    striker_players = draft_striker_players + additional_strikers
    remaining_after_striker = [p for p in remaining_after_gk if p not in additional_strikers]
    
    # 6. Pick 3 additional midfielders (prefer non-midfielders for new experience)  
    remaining_non_mid_candidates = [p for p in remaining_after_striker if position_history.get(p["name"], [])[-1:] != ["midfield"]]
    if len(remaining_non_mid_candidates) >= 3:
        additional_midfielders = random.sample(remaining_non_mid_candidates, 3)
    else:
        # Take what we can get
        additional_midfielders = remaining_non_mid_candidates + random.sample([p for p in remaining_after_striker if p not in remaining_non_mid_candidates], 3 - len(remaining_non_mid_candidates))
    
    midfield_players = draft_midfielder_players + additional_midfielders
    
    # 7. Remaining 2 players go to defence (plus 2 GK alternates will make 4 total defenders)
    defence_players = [p for p in remaining_after_striker if p not in additional_midfielders]

    # Assign specific midfield positions (LM, CM, RM all treated as midfield)
    midfield_positions = ["LM", "CM", "CM", "RM", "LM/RM", "CM"]  # 6 positions total
    random.shuffle(midfield_positions)    # Generate alternate positions for goalkeepers based on their previous field position
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
        for i in range(6)
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
    
    data["off_pitch"]["instructions"] = f"DRAFT ZONE ASSIGNMENTS! When off pitch, stand in your assigned zone. Defence: {def_names}. Midfield: {mid_names}. Strikers: {str_names}. {goalkeepers[0]['name']} & {goalkeepers[1]['name']} are this week's goalkeepers."
    
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
    print("🎯 DRAFT-BASED RANDOMIZED ASSIGNMENTS:")
    print(f"Captains: {captains[0]['name']} (1st half), {captains[1]['name']} (2nd half)")
    print(f"  └─ Previous captains were: {', '.join(previous_captains)} → giving others a chance!")
    print()
    print(f"Goalkeepers: {goalkeepers[0]['name']} (alt: {gk_alternates[0]}), {goalkeepers[1]['name']} (alt: {gk_alternates[1]})")
    print(f"  └─ Previous GKs were: {', '.join(previous_gks)} → giving others a chance!")
    print()
    print(f"Defence (4): {def_names}")
    print(f"Midfield (6): {mid_names}")
    print(f"  └─ DRAFT: Travis C, Ethan G (#15), Eunjun K (#16) + 3 others")
    print(f"Strikers (5): {str_names}")
    print(f"  └─ DRAFT: Rafael H, Niko D, Rhodri W + 2 others")
    print()
    print("=== ALL FIELD POSITIONS (4 Defence + 6 Midfield + 5 Strikers = 15) ===")
    # Add goalkeepers to their alternate positions for complete field view
    
    # Assign GK alternates to zones based on their alternate positions
    gk1_alt = gk_alternates[0].lower()
    gk2_alt = gk_alternates[1].lower() 
    
    # Count players in each zone including GK alternates
    defence_count = len(defence_players)
    midfield_count = len(midfield_players) 
    striker_count = len(striker_players)
    
    # Add GK alternates to appropriate zones
    if gk1_alt in ["defence", "cb", "lb", "rb"]:
        defence_count += 1
    elif gk1_alt in ["midfield", "lm", "cm", "rm"]:
        midfield_count += 1
    elif gk1_alt in ["striker", "st"]:
        striker_count += 1
        
    if gk2_alt in ["defence", "cb", "lb", "rb"]:
        defence_count += 1
    elif gk2_alt in ["midfield", "lm", "cm", "rm"]:
        midfield_count += 1  
    elif gk2_alt in ["striker", "st"]:
        striker_count += 1
    
    print(f"DEFENCE ({defence_count}):")
    for p in defence_players:
        print(f"  {p['name']} (#{p['jersey']}) - CB")
    for i, gk in enumerate(goalkeepers):
        if gk_alternates[i].lower() in ["defence", "cb", "lb", "rb"]:
            print(f"  {gk['name']} (#{gk['jersey']}) - {gk_alternates[i]} (GK alternate)")
    
    print(f"\nMIDFIELD ({midfield_count}):")
    for p in midfield_players:
        print(f"  {p['name']} (#{p['jersey']}) - Midfield")
    for i, gk in enumerate(goalkeepers):
        if gk_alternates[i].lower() in ["midfield", "lm", "cm", "rm"]:
            print(f"  {gk['name']} (#{gk['jersey']}) - {gk_alternates[i]} (GK alternate)")
    
    print(f"\nSTRIKERS ({striker_count}):")
    for p in striker_players:
        print(f"  {p['name']} (#{p['jersey']}) - ST")
    for i, gk in enumerate(goalkeepers):
        if gk_alternates[i].lower() in ["striker", "st"]:
            print(f"  {gk['name']} (#{gk['jersey']}) - {gk_alternates[i]} (GK alternate)")
    
    print(f"\nTOTAL FIELD POSITIONS: {defence_count + midfield_count + striker_count} players")
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
        
        # Mark draft assignments
        draft_marker = ""
        if name in draft_strikers:
            draft_marker = " [DRAFT]"
        elif name in draft_midfielders:
            draft_marker = " [DRAFT]"
            
        if prev_pos != current_pos:
            print(f"  ✅ {name}: {prev_pos} → {current_pos} (NEW EXPERIENCE){draft_marker}")
        else:
            print(f"  🔄 {name}: {prev_pos} (repeated - unavoidable){draft_marker}")
    
    print(f"\nTotal: {len(defence_players) + len(midfield_players) + len(striker_players) + len(goalkeepers)} players ✓")
    print(f"Field players: {len(defence_players) + len(midfield_players) + len(striker_players)}, Goalkeepers: {len(goalkeepers)}")
    print(f"Draft assignments: {len(draft_strikers + draft_midfielders)}, Rotational: {15 - len(draft_strikers + draft_midfielders)}")

if __name__ == "__main__":
    random.seed()  # Use current time as seed for true randomization
    randomize_team_with_draft()
