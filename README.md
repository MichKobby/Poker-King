# Poker Night Master 🃏

A comprehensive web application for tracking your bi-weekly Friday night poker group's leaderboard and game history. Built with Next.js, Tailwind CSS, and Supabase.

## Features

- **📊 Leaderboard View**: Main dashboard showing players ranked by total net profit
- **🎮 Game Entry Form**: Password-protected admin panel for logging poker sessions
- **📅 History Tab**: Detailed view of past games with expandable results
- **🏆 Wall of Shame**: Highlights the player with the most losses
- **🦈 Shark of the Month**: Shows the highest earner in the last 30 days
- **📱 Mobile-First Design**: Responsive design with dark poker theme
- **🔒 Admin Protection**: Password-protected game entry with validation

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom poker theme
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd poker-night-master
npm install
```

### 2. Database Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL commands from `database-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key from the API settings

### 3. Environment Configuration

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=your_admin_password_for_game_entry
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses two main tables:

### Players Table
- `id`: UUID primary key
- `name`: Unique player name
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Game Logs Table
- `id`: UUID primary key
- `player_id`: Foreign key to players
- `game_date`: Date of the poker night
- `buy_in`: Entry amount (default $20)
- `cash_out`: Final amount
- `net_result`: Calculated profit/loss

### Views
- `leaderboard`: Aggregated player statistics
- `recent_games`: Last 30 days performance

## Usage

### For Players
1. Visit the main page to view the current leaderboard
2. Check the "History" tab to see past game results
3. View Wall of Shame and Shark of the Month highlights

### For Admins
1. Navigate to the "Admin" tab
2. Enter the admin password
3. Select the game date
4. Add players and their net results
5. Ensure total results equal zero before submitting

## Game Entry Validation

- All player names must be filled
- Net results must be numerical
- **Total of all results must equal $0.00** (wins and losses must balance)
- Game date is required

## Mobile Optimization

The application is designed mobile-first with:
- Responsive navigation with collapsible sidebar
- Touch-friendly buttons and forms
- Optimized table layouts for small screens
- Dark poker theme for comfortable viewing

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application is a standard Next.js app and can be deployed to any platform supporting Node.js.

## Customization

### Styling
- Modify `tailwind.config.ts` for color schemes
- Update `src/app/globals.css` for custom styles
- Poker theme colors are defined in the config

### Default Settings
- Default buy-in amount: $20 (configurable in `GameEntryForm.tsx`)
- Admin password: Set in environment variables
- Database policies: Configured for public read access

## File Structure

```
src/
├── app/
│   ├── admin/page.tsx          # Admin game entry page
│   ├── history/page.tsx        # Game history page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home/leaderboard page
│   └── globals.css             # Global styles
├── components/
│   ├── GameEntryForm.tsx       # Admin form component
│   ├── GameHistory.tsx         # History display component
│   ├── Layout.tsx              # Main layout component
│   └── Leaderboard.tsx         # Main leaderboard component
└── lib/
    └── supabase.ts             # Database client and types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the database connection and environment variables
2. Verify Supabase policies are correctly set
3. Ensure all required fields are filled in game entry

## License

MIT License - feel free to use for your poker group!
