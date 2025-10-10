# Quests Feature Implementation

## Overview
A complete quest system for the Kalamuth gladiator management game. Players can generate AI-powered quests for their gladiators, with immersive narratives, risk management, and dynamic outcomes.

## Features Implemented

### 1. Quest Generation
- **AI-Powered**: Uses OpenRouter (Gemini 2.5 Flash) to generate immersive, historically-accurate quests
- **Volunteer Selection**: AI automatically selects the best gladiator volunteer based on personality and quest requirements
- **Roleplay Messages**: Volunteers provide in-character messages explaining their motivation
- **Risk Assessment**: Each quest has danger, sickness, and death percentages (0-99%)
- **Reward System**: Quests offer 1-5 sestertii as rewards

### 2. Quest Lifecycle
1. **Pending**: Quest is generated and waiting for acceptance
2. **Active**: Quest is in progress (1 hour duration)
3. **Completed**: Quest finished successfully
4. **Failed**: Quest failed or gladiator died
5. **Cancelled**: User cancelled the quest (costs 2 sestertii)

### 3. Quest Mechanics
- **Duration**: Each quest takes exactly 1 hour to complete
- **Auto-Completion**: Quests automatically complete after 1 hour with AI-generated results
- **Reroll Cost**: 1 sestertii to reroll a pending quest
- **Cancel Cost**: 2 sestertii to cancel an active quest
- **Rewards**: Sestertii added to ludus treasury upon completion
- **Consequences**: Gladiators can lose health, contract injuries/sickness, or die

### 4. Immersive Experience
- **Loading States**: Visual feedback during quest generation and volunteer selection
- **Progress Tracking**: Real-time countdown timer during active quests
- **Narrative Results**: AI-generated story of what happened during the quest
- **Historical Accuracy**: Quests are themed around Roman gladiator culture and era

## Database Schema

### Quests Table
```sql
CREATE TABLE public.quests (
  id UUID PRIMARY KEY
  userId UUID (references auth.users)
  ludusId UUID (references ludi)
  serverId TEXT
  gladiatorId UUID (references gladiators)
  title TEXT
  description TEXT
  volunteerMessage TEXT
  reward INTEGER (1-5)
  dangerPercentage INTEGER (0-99)
  sicknessPercentage INTEGER (0-99)
  deathPercentage INTEGER (0-99)
  status TEXT (pending|active|completed|failed|cancelled)
  startedAt TIMESTAMPTZ
  completedAt TIMESTAMPTZ
  result TEXT
  healthLost INTEGER
  sicknessContracted TEXT
  injuryContracted TEXT
  questFailed BOOLEAN
  gladiatorDied BOOLEAN
  createdAt TIMESTAMPTZ
  updatedAt TIMESTAMPTZ
)
```

## API Endpoints

### POST /api/quests/generate
Generates a new quest with AI
- **Input**: `{ ludusId: string }`
- **Output**: Quest object with volunteer information

### POST /api/quests/accept
Accepts a pending quest and starts the 1-hour timer
- **Input**: `{ questId: string }`
- **Output**: Confirmation with start time and completion time

### POST /api/quests/complete
Completes an active quest with AI-generated results
- **Input**: `{ questId: string }`
- **Output**: Quest results including narrative, health loss, and rewards

### POST /api/quests/cancel
Cancels an active quest (costs 2 sestertii)
- **Input**: `{ questId: string }`
- **Output**: Confirmation with new treasury amount

### POST /api/quests/reroll
Rerolls a pending quest (costs 1 sesterce)
- **Input**: `{ questId: string }`
- **Output**: Confirmation with new treasury amount

## UI Components

### QuestsClient
Main client component managing quest state and lifecycle

### QuestGenerationComponent
Shows loading state and generate button

### QuestDetailsComponent
Displays quest details, risks, rewards, and volunteer information

### QuestOngoingComponent
Shows progress timer and cancel button during active quest

### QuestResultsComponent
Displays quest outcome, consequences, and rewards

### QuestHistoryComponent
Shows past quests with status and brief details

## Translations
- **English**: `/messages/en/quests.json`
- **French**: `/messages/fr/quests.json`

## Integration Points

### Dashboard
Added "Quests" button to the dashboard navigation for easy access

### Gladiator System
- Quests reference gladiators by ID
- Results can modify gladiator health, injuries, and sickness
- Gladiators can die during quests

### Treasury System
- Quest rewards are added to ludus treasury
- Quest costs (reroll, cancel) are deducted from treasury

## Future Enhancements
1. Background job for automatic quest completion (currently client-side)
2. Quest difficulty scaling based on ludus reputation
3. Quest chains and storylines
4. Gladiator experience/leveling from quests
5. Ludus morale impact from quest outcomes
6. Quest failure consequences (reputation loss, etc.)
7. Special quest types (arena preparation, training, exploration)

## Testing
To test the quests feature:
1. Navigate to Dashboard
2. Click "Quests" button
3. Click "Generate New Quest"
4. Review quest details and volunteer message
5. Accept the quest
6. Wait for 1 hour (or check browser console for timer)
7. View quest results

## Notes
- Quest completion is currently handled client-side with a timer
- For production, implement a background job/cron to handle quest completion
- AI generation uses OpenRouter API (requires OPENROUTER_API_KEY env var)
- All quest data is stored in Supabase with RLS policies

