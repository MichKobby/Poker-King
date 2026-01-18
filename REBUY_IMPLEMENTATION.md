# Rebuy Functionality Implementation

This document describes the rebuy functionality added to the Poker Night Master application, designed to track additional buy-ins during games while maintaining full backward compatibility with existing production data.

## Overview

The rebuy system allows tracking when players lose their initial buy-in and purchase additional chips during a game session. For example, if a player starts with $30 and loses it all, then buys in for another $10, the system now tracks both transactions.

## Database Changes

### New Tables

#### `rebuys` Table
```sql
CREATE TABLE rebuys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_log_id UUID REFERENCES game_logs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  rebuy_amount DECIMAL(10,2) NOT NULL,
  rebuy_sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Views

#### `game_logs_with_rebuys`
Combines game logs with rebuy information:
- `initial_buy_in`: Original buy-in amount
- `total_rebuys`: Sum of all rebuys for the player in that game
- `total_investment`: Initial buy-in + total rebuys
- `net_result_with_rebuys`: Cash out - total investment

#### `leaderboard_with_rebuys`
Enhanced leaderboard including rebuy statistics:
- `total_initial_buy_ins`: Sum of original buy-ins
- `total_rebuys`: Sum of all rebuys across all games
- `total_investment`: Total money invested (buy-ins + rebuys)
- `net_profit_with_rebuys`: Profit/loss including rebuys
- `total_rebuy_instances`: Number of individual rebuys

#### `recent_games_with_rebuys`
Recent performance including rebuy data for the last 30 days.

## Backward Compatibility

### Existing Data
- **No changes** to existing `game_logs` table structure
- **No changes** to existing data
- Original views (`leaderboard`, `recent_games`) remain unchanged
- Existing components continue to work without modification

### Migration Strategy
1. Run `database-migration-rebuy.sql` to add new tables and views
2. Existing data remains fully functional
3. New rebuy tracking is optional - games without rebuys work exactly as before

## New Components

### Enhanced Game Entry Form
**File**: `GameEntryFormWithRebuys.tsx`

Features:
- Tracks initial buy-in per player
- Allows adding multiple rebuys per player
- Validates that total cash out equals total investment
- Maintains backward compatibility with original form logic

Usage Example:
- Player starts with $30 (initial buy-in)
- Player loses all money, adds $10 rebuy
- Player adds another $5 rebuy
- Total investment: $45, tracked as: initial_buy_in=$30, rebuys=[$10, $5]

### Enhanced Leaderboard
**File**: `LeaderboardWithRebuys.tsx`

Features:
- Toggle between "Original Only" and "With Rebuys" views
- Shows rebuy statistics
- Maintains all existing leaderboard functionality
- Enhanced statistics including rebuy counts

### Enhanced Game History
**File**: `GameHistoryWithRebuys.tsx`

Features:
- Detailed rebuy breakdown per player per game
- Toggle between rebuy-inclusive and original views
- Shows rebuy sequence (1st rebuy, 2nd rebuy, etc.)
- Expandable game details

## Implementation Details

### Data Flow

1. **Game Entry**:
   ```typescript
   // Original game_log entry (unchanged)
   {
     player_id: "uuid",
     game_date: "2024-01-18",
     buy_in: 30.00,        // Original buy-in only
     cash_out: 25.00
   }
   
   // New rebuy entries (if any)
   [
     {
       game_log_id: "game_log_uuid",
       player_id: "uuid", 
       game_date: "2024-01-18",
       rebuy_amount: 10.00,
       rebuy_sequence: 1
     },
     {
       game_log_id: "game_log_uuid",
       player_id: "uuid",
       game_date: "2024-01-18", 
       rebuy_amount: 5.00,
       rebuy_sequence: 2
     }
   ]
   ```

2. **Calculation Logic**:
   ```typescript
   // Original net result (unchanged)
   original_net_result = cash_out - buy_in
   
   // Enhanced net result (new)
   total_investment = buy_in + sum(rebuys)
   net_result_with_rebuys = cash_out - total_investment
   ```

### TypeScript Types

New types added to `supabase.ts`:
- `Rebuy`: Individual rebuy record
- `GameLogWithRebuys`: Enhanced game log with rebuy data
- `LeaderboardEntryWithRebuys`: Enhanced leaderboard entry
- `RecentGameEntryWithRebuys`: Enhanced recent games entry
- `GameEntryWithRebuys`: Form data structure with rebuys

## Usage Instructions

### For Administrators

1. **Database Migration**:
   ```sql
   -- Run this in Supabase SQL editor
   \i database-migration-rebuy.sql
   ```

2. **Using Enhanced Components**:
   ```tsx
   // Replace existing components with enhanced versions
   import GameEntryFormWithRebuys from '@/components/GameEntryFormWithRebuys'
   import LeaderboardWithRebuys from '@/components/LeaderboardWithRebuys'
   import GameHistoryWithRebuys from '@/components/GameHistoryWithRebuys'
   ```

### For Players

The rebuy functionality is transparent to players. The enhanced leaderboard and game history provide toggle switches to view data with or without rebuys included.

## Example Scenarios

### Scenario 1: Player with Rebuys
- Initial buy-in: $30
- Loses all money, rebuys $10
- Loses again, rebuys $5
- Final cash out: $25
- **Result**: Total investment $45, net loss $20

### Scenario 2: Player without Rebuys
- Initial buy-in: $30
- Final cash out: $45
- **Result**: Total investment $30, net profit $15
- (Works exactly as before)

### Scenario 3: Mixed Game
- Player A: $30 initial, no rebuys, cash out $50 (profit $20)
- Player B: $30 initial, $10 rebuy, cash out $25 (loss $15)
- Player C: $30 initial, no rebuys, cash out $15 (loss $15)
- **Game totals**: Investment $100, Cash out $90, Net -$10

## Testing

### Backward Compatibility Tests
- [ ] Existing games display correctly in original components
- [ ] New views return correct data for games without rebuys
- [ ] Original leaderboard calculations remain unchanged
- [ ] Database constraints prevent data corruption

### New Functionality Tests
- [ ] Rebuy tracking works correctly in enhanced form
- [ ] Enhanced leaderboard shows accurate rebuy statistics
- [ ] Game history displays rebuy details properly
- [ ] Toggle switches work correctly between views

## Deployment Strategy

### Phase 1: Database Migration
1. Deploy database migration during low-traffic period
2. Verify all existing functionality works
3. Test new views with existing data

### Phase 2: Component Deployment
1. Deploy new components alongside existing ones
2. Test enhanced functionality with new games
3. Gradually migrate users to enhanced components

### Phase 3: Full Migration (Optional)
1. Replace original components with enhanced versions
2. Update navigation to use new components
3. Remove original components if desired

## Maintenance

### Regular Tasks
- Monitor rebuy data for consistency
- Ensure total cash out equals total investment in games
- Verify rebuy sequences are correct

### Troubleshooting
- If rebuy data seems incorrect, check `game_logs_with_rebuys` view
- Validate that `rebuy_sequence` values are sequential
- Ensure `game_log_id` references are correct

## Future Enhancements

### Potential Additions
1. **Rebuy Limits**: Track maximum rebuys per player per game
2. **Rebuy Timing**: Record timestamps for when rebuys occurred
3. **Rebuy Analytics**: Advanced statistics on rebuy patterns
4. **Export Functionality**: CSV export including rebuy details
5. **Mobile Optimization**: Enhanced mobile interface for rebuy tracking

### API Endpoints (Future)
```typescript
// Potential REST endpoints for rebuy management
GET /api/games/{gameId}/rebuys
POST /api/games/{gameId}/rebuys
PUT /api/rebuys/{rebuyId}
DELETE /api/rebuys/{rebuyId}
```

## Conclusion

The rebuy functionality provides comprehensive tracking of additional buy-ins while maintaining full backward compatibility. The implementation ensures that existing production data and functionality remain completely unaffected, while new games can take advantage of enhanced rebuy tracking capabilities.

All calculations are transparent and auditable, with clear separation between original buy-ins and rebuys, allowing for flexible reporting and analysis of poker game results.
