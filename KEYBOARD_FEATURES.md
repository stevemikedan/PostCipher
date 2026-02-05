# Keyboard Input Features

## ✅ Implemented Features

### 1. Physical Keyboard Support (Desktop)
- **Letter Input**: When a tile is selected, type any letter (A-Z) on your physical keyboard to assign it
- **Delete/Backspace**: Press Delete or Backspace to remove the mapping from the selected tile
- **Escape**: Press Escape to deselect the current tile
- **Case Insensitive**: Both uppercase and lowercase letters work

### 2. Mobile Keyboard Support
- **Auto-Focus**: When you tap a tile, a hidden input field automatically focuses
- **Virtual Keyboard**: Your device's virtual keyboard pops up automatically
- **Type to Assign**: Type any letter to assign it to the selected tile
- **Delete Key**: Use the backspace key on your virtual keyboard to remove mappings

### 3. Remove Letter Mappings
Multiple ways to remove a letter mapping:
- **Double-Click**: Double-click a tile that has a mapping to remove it
- **Right-Click**: Right-click a tile (desktop) to remove its mapping
- **Delete Key**: Select a tile and press Delete/Backspace
- **Visual Indicator**: Tiles with mappings show a small "×" indicator

### 4. On-Screen Keyboard
- Still available for users who prefer clicking
- Works alongside physical keyboard input
- All letters are clickable as before

## How It Works

### Desktop Flow
1. Click a cipher tile to select it (turns orange)
2. Type a letter on your keyboard (A-Z)
3. Letter is assigned to the tile
4. Press Delete/Backspace to remove if incorrect
5. Press Escape to deselect

### Mobile Flow
1. Tap a cipher tile to select it
2. Virtual keyboard automatically appears
3. Type a letter
4. Letter is assigned to the tile
5. Use backspace to remove if incorrect

### Removing Mappings
- **Double-click** any tile with a mapping (except hints)
- **Right-click** any tile with a mapping (desktop)
- **Select tile + Delete** to remove mapping
- Hints cannot be removed (they're permanent)

## Visual Indicators

- **Orange tile**: Currently selected, ready for input
- **Blue tile**: Hint revealed (permanent)
- **Green tile**: Correctly solved (when puzzle is complete)
- **× symbol**: Tile has a mapping that can be removed

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| A-Z | Assign letter to selected tile |
| Delete/Backspace | Remove mapping from selected tile |
| Escape | Deselect current tile |

## Technical Details

- Hidden input field handles mobile keyboard focus
- Global keyboard event listener handles physical keyboard
- Case-insensitive input (converts to uppercase)
- Only A-Z letters are accepted
- Hints are protected from removal
- Visual feedback for all actions
