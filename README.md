# FFXIV P8S - High Concept 1 Simulator

A web-based practice simulator for the "High Concept 1" mechanic from Phase 2 of The Eighth Circle (Savage): Hephaistos raid in Final Fantasy XIV.

## Features

- 🎮 Interactive drag-and-drop player positioning
- 🎲 Random debuff assignment each attempt
- ✅ Real-time validation and feedback
- 📚 Built-in tutorial and hints system
- 🎨 Game-accurate visual representation
- 📱 Responsive design (works on desktop and mobile)
- 💾 No installation required - runs entirely in browser

## How to Use

1. **Open the simulator**: Simply open `index.html` in any modern web browser
2. **Start practicing**:
   - Click "Reset & Randomize" to generate new debuff assignments
   - Review player debuffs in the right panel
   - Click "Next Phase" to progress through the mechanic
   - Drag player tokens to position them correctly
   - Click "Check Solution" to validate your positioning
   - Use "Toggle Hints" for positioning guidance

## Mechanic Overview

High Concept 1 consists of 3 phases:

### Phase 1: Alpha Resolution (First Spread)
- All 8 players spread to corners based on their debuffs
- 2 players with **Alpha (α)** - 8 second timer (explode first)
- 4 players with **Gamma (γ)** - 17 second timer (explode second)
- 2 players with **Beta (β)** - 26 second timer (explode last)
- Each player also has **Near World (N)** or **Far World (F)**
- Alphas explode first, leaving "Perfection" buffs at their locations

### Phase 2: Gamma Resolution (Perfection Fusion & Tower Soak)
- Short debuffs explode, leaving Perfection buffs at corners (A, B, 4/C)
- Long debuffs move to collect Perfection buffs from explosion locations
- Two players with **matching Perfection elements** fuse in center to create Conception
- 2 towers spawn (North and South) - the 2 fused players soak them
- **Splicers duplicate Perfection buffs:**
  - Multisplice: Stacks with first explosion clockwise
  - Supersplice: Stacks with first explosion counterclockwise
- Player with unused Perfection returns to original spot

### Phase 3: Second Spread & Tower Soaking
- Beta players collect Conception buffs from Gamma positions
- All players spread to corners again
- 4 more towers spawn in a vertical line (with specific colors)
- Players with matching colored Conception buffs soak corresponding towers
- Each tower must be soaked by exactly one player

## Debuff Legend

| Icon | Name | Description |
|------|------|-------------|
| α | Alpha | Short timer - explodes first |
| β | Beta | Long timer - explodes last |
| γ | Gamma | Medium timer - explodes second |
| N | Near World | Stay close to center |
| F | Far World | Stay far from center |

## Player Roles

- **Tanks (Blue)**: MT, OT
- **Healers (Green)**: H1, H2
- **DPS (Orange)**: D1, D2, D3, D4

## Controls

- **Reset & Randomize**: Start over with new random debuffs
- **Check Solution**: Validate current player positions
- **Toggle Hints**: Show/hide positioning hints
- **Show Tutorial**: Open detailed mechanic explanation
- **Next Phase**: Advance to the next phase of the mechanic

## Technical Details

- Pure HTML/CSS/JavaScript - no frameworks required
- No backend or server needed
- Works offline after initial load
- Compatible with modern browsers (Chrome, Firefox, Edge, Safari)

## Tips

1. **Alpha Phase**: Keep alphas spread apart and on cardinal/intercardinal positions
2. **Distance Matters**: Near players should be within 150 units of center, Far players beyond 200 units
3. **Tower Soaking**: Only Beta players need to soak towers in the final phase
4. **Use Hints**: Toggle hints for phase-specific positioning guidance
5. **Practice**: Try multiple randomized attempts to learn all debuff combinations

## Resources

- [Icy Veins P8S Guide](https://www.icy-veins.com/ffxiv/the-eighth-circle-phase-2-savage-raid-guide#phase-2-high-concept-1)
- [Final Fantasy Wiki - Abyssos](https://finalfantasy.fandom.com/wiki/Abyssos:_The_Eighth_Circle#High_Concept_1)

## License

This is a fan-made tool for educational purposes. FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.

## Contributing

Feel free to modify and improve this simulator! Suggestions for improvements:
- Add more detailed tower mechanics
- Implement animation for explosions and buff transfers
- Add sound effects
- Create difficulty modes
- Add macro generation feature
- Support for different strat variations

---

Made with ❤️ for the FFXIV raiding community

