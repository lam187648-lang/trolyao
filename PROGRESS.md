# Tro Ly Ao Website Upgrade Progress

## Overall Status
Comprehensive upgrade in progress. Following priority order: Camera fix > Color system > Interface items > Dark mode > Layout optimization.

## Completed Items
- [ ] Phase 1: Color system overhaul (regular vs special colors)
- [ ] Phase 2: Token shop hiding from menu
- [ ] Phase 3: Interface customization items (avatar frames, profile frames, pets)
- [ ] Phase 4: Camera motion detection optimization (HIGH PRIORITY)
- [ ] Phase 5: True/False game questions upgrade
- [ ] Phase 6: Light/dark mode contrast fix
- [ ] Phase 7: Full layout optimization and bug fixes

## Phase 1: Color System
### Status: NOT STARTED
- Add regular colors (users can obtain/use via current mechanisms)
- Add special colors (purchasable with tokens or by admin)
- Display ownership status (owned/unowned)
- Show source of acquisition
- Synchronize colors across profile, personal interface, related areas
- Preserve existing user colors and data

### Files to modify:
- style.css - color definitions, item styling
- theme-manager.js - color theme management
- visual-upgrade.css - existing visual upgrades
- HTML files - color selection UI

## Phase 2: Token Shop Menu
### Status: NOT STARTED
- Hide or remove "Cửa hàng Token" from navigation menu
- Prefer hiding over deleting backend functionality
- Check all links and buttons to avoid broken references
- Do not delete API, data, transaction history, or dependent features

### Files to modify:
- index.html - remove/navigate token shop link
- auth.html - check for token shop references
- mobile-auth.html - mobile menu

## Phase 3: Interface Customization Items
### Status: NOT STARTED
Add item system with:
- Avatar frames (regular/special)
- Profile frames (regular/special)
- Pets (regular/special)
- Decoration effects and personal items
Each item needs:
- Regular item
- Special item
- Token-purchasable item
- Admin-granted item
- Owned/unowned status
- Preview before equipping
- Nice design, hover/equip effects

### Files to modify:
- theme-manager.js - item management
- style.css - item styling
- HTML files - item selection UI
- visual-upgrade.css - existing upgrades

## Phase 4: Camera Motion Detection (HIGH PRIORITY)
### Status: NOT STARTED
Critical: Camera detection too slow (15-20s delay)
- Check entire camera process, model initialization, face/head detection
- Optimize sensitivity and detection speed
- Clearly distinguish left tilt, right tilt, central position
- Reduce lag, avoid mis detection and constant shaking
- Initial head position calibration for each player
- Reasonable detection threshold, noise filtering, short confirmation time
- Don't require extreme head tilts to detect
- Show camera status, detection status, currently detected head direction
- If camera/model fails, notify clearly instead of game freezing
- Don't send camera images to server; process on device

### Files to modify:
- Camera/JS files related to motion detection
- Possibly new files for optimized detection

## Phase 5: True/False Game Questions
### Status: NOT STARTED
- Add many new questions, diverse topics and difficulty
- Question content must be accurate, clear, not too repetitive
- Right/wrong answers must be verified with clear data
- Consistent head tilt mapping with True/Sai selection
- Reasonable selection confirmation time, avoid counting one movement multiple times
- Display right/wrong feedback, score and short explanation when appropriate
- Avoid ambiguous questions or multiple reasonable answers

### Files to modify:
- Game JS files
- Question data files

## Phase 6: Light/Dark Mode Contrast
### Status: NOT STARTED
Current issue: In light mode, text sinks and is hard to read
- Keep current background color, especially aqua gradient background
- Don't change backgrounds of areas with separate design
- Focus on adjusting text color, contrast, border color, icon color
- Text must be clear, readable, not too faint
- Check all: titles, content, buttons, menus, forms, notifications
- Dark mode must maintain current design style
- Ensure theme switch doesn't break layout or lose colors

### Files to modify:
- style.css - variable adjustments
- theme-manager.js - theme application
- All HTML files - verify contrast

## Phase 7: Full Layout Optimization
### Status: NOT STARTED
- Check layout of all pages, re-align for consistency
- Fix content overflow, misaligned components, unreasonable spacing
- Optimize for computer and phone
- Fix lag, stutter, unstable animations
- Optimize JS, CSS, image loading, unnecessary tasks
- Add smooth, subtle motion effects, don't overuse
- Prioritize performance on low-end devices
- Don't let effects slow down camera or games

### Files to modify:
- style.css - layout fixes
- All HTML files - structure improvements
- app.js - performance optimization
- ui-effects.js - effect optimization

## Phase 8: Code Change Rules
Following strict rules from task brief - no breaking existing functionality, preserve user data, no wholesale rewrites, no undeleted features, etc.

## Phase 9: Testing
After each phase:
- [ ] JavaScript syntax check
- [ ] Console and network error check
- [ ] Related API check
- [ ] Login/logout and account data check
- [ ] Admin rights and item granting check
- [ ] Token purchase/ownership check (if applicable)
- [ ] Camera and game check (real use)
- [ ] Light/dark mode check
- [ ] Computer and phone interface check
- [ ] Run appropriate project tests

---
Last updated: 2026-11-17