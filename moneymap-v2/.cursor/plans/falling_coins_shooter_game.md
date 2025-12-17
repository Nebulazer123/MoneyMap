# Falling Coins Shooter Game - Remake Plan

## Overview
Transform the minigame into a falling coins shooter game where coins fall from the top of the screen and players must click/shoot them before they hit the bottom. The game combines endless highscore mechanics with action-packed shooting gameplay.

## Game Mechanics

### Core Gameplay
- **Falling Coins**: Coins spawn at the top and fall downward with gravity
- **Click to Shoot**: Click coins to collect them (shooter-style aiming)
- **Lives System**: Lose a life when a coin reaches the bottom
- **Combo System**: Build combos by hitting coins quickly
- **Endless Mode**: Play until you run out of lives

### Enhanced Mechanics
- **Variable Fall Speed**: Coins fall at different speeds (increases with score)
- **Coin Types**: Bronze (slow, 1pt), Silver (medium, 5pts), Gold (fast, 10pts)
- **Special Coins**: 
  - Bomb coins (click to clear nearby coins)
  - Multiplier coins (temporary 2x boost)
  - Life coins (restore 1 life)
- **Power-ups**: Temporary abilities that spawn occasionally

### Difficulty Progression
- **Fall Speed**: Increases with score (every 50 points = faster)
- **Spawn Rate**: More coins spawn as score increases
- **Coin Variety**: More special coins appear at higher scores
- **Gravity Acceleration**: Coins accelerate as they fall

### Scoring System
- Base points per coin type
- Combo multipliers (same as before: 2x at 5, 3x at 10, 4x at 20, 5x at 30+)
- Bonus points for hitting coins near the top (risk/reward)
- High score tracking with localStorage

## Visual Features

### Falling Animation
- Smooth gravity-based falling motion
- Coins rotate as they fall
- Trail effects for faster coins
- Impact animation when coin hits bottom (lose life)

### Shooter Elements
- Crosshair/cursor indicator
- Click explosion effect on hit
- Particle effects when coins are collected
- Miss indicator (red flash when coin hits bottom)

### Special Coin Visuals
- Bomb coins: Red glow, warning indicator
- Multiplier coins: Golden glow, sparkle effect
- Life coins: Green glow, heart icon
- Distinct animations for each type

### UI Enhancements
- Score display (large, prominent)
- Combo counter with multiplier
- Lives indicator (hearts)
- High score display
- Speed indicator (current difficulty level)
- Special coin warning notifications

## Implementation Details

### Physics System
- Gravity constant: `9.8 * scaleFactor` pixels per frame
- Initial velocity: Random per coin type
- Terminal velocity: Caps maximum fall speed
- Collision detection: Click hitbox vs coin position

### Coin Spawning
- Spawn at random X positions at top of screen
- Spawn interval decreases with score
- Weighted distribution: 50% bronze, 30% silver, 15% gold, 5% special

### Special Coins Logic
- **Bomb Coin**: Explodes in radius, clears nearby coins, no points
- **Multiplier Coin**: Applies 2x multiplier for next 10 coins
- **Life Coin**: Restores 1 life (max 3), rare spawn

### Game States
- `idle`: Start screen
- `playing`: Active gameplay
- `gameOver`: End screen with stats

## Files to Modify

1. **Modify**: `src/components/dashboard/MinigameModal.tsx`
   - Replace static coin positioning with falling physics
   - Add gravity and velocity calculations
   - Implement special coin types
   - Add click/shoot mechanics
   - Update visual effects for falling motion

## Technical Implementation

### Physics Calculations
- Use `requestAnimationFrame` for smooth animation
- Calculate position: `y = y0 + velocity * time + 0.5 * gravity * time^2`
- Update coin positions every frame
- Check collision on click

### Performance
- Efficient rendering with canvas or optimized DOM
- Pool coin objects to reduce garbage collection
- Use CSS transforms for smooth animations
- Debounce click handlers

### Responsive Design
- Game area scales with screen size
- Touch-friendly for mobile
- Maintain aspect ratio

## Game Flow

1. **Start Screen**: Instructions, high score, start button
2. **Playing**: Coins fall, player clicks to shoot, combo builds, lives decrease on misses
3. **Game Over**: Final score, max combo, coins collected, play again

## Enhancements for Excitement

- **Screen shake** on life loss and high combos
- **Particle explosions** when coins are hit
- **Sound effects** (optional)
- **Achievement notifications** ("10 Combo!", "Perfect Shot!", "New High Score!")
- **Speed indicators** showing current difficulty
- **Combo streak visuals** (glowing trail effect)
- **Near-miss indicators** (coins that almost hit bottom)

