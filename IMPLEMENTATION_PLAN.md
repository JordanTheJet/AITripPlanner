# AI Trip Planner - Implementation Plan & Status

## Overview
Transforming the demo from a single-day itinerary planner into a multi-day/multi-week trip planning application with Supabase backend, LLM-powered optimization, and comprehensive export capabilities.

---

## ✅ Completed Implementation

### 1. Supabase Backend Integration
- ✅ Installed `@supabase/supabase-js`, `date-fns`, `ics`, `nanoid`
- ✅ Created Supabase client (`lib/supabase.ts`)
- ✅ Defined TypeScript interfaces for all database tables
- ✅ Implemented guest user system (no auth required)
  - `lib/guest-user.ts` - localStorage-based guest users

### 2. State Management (Zustand Stores)
- ✅ **Lobby Store** (`lib/stores/lobby-store.ts`)
  - Create/join lobbies
  - Auto-persist current lobby to localStorage
  - Real-time lobby updates

- ✅ **Trip Store** (`lib/stores/trip-store.ts`)
  - Create trips with budget
  - Add days and itinerary items
  - Real-time sync with Supabase
  - Budget tracking
  - Auto-load trip on init

- ✅ **Chat Persistence** (Updated `lib/state.ts`)
  - `saveChatMessage()` - Auto-save chat to Supabase
  - Async, non-blocking saves

### 3. LLM Tools for Trip Planning
- ✅ **New Tools** (`lib/tools/trip-planning-tools.ts`)
  1. `createTrip` - Initialize new multi-day trip
  2. `addItineraryDay` - Add day to trip
  3. `addItineraryItem` - Add activity/restaurant/accommodation
  4. `updateBudget` - Update budget breakdown
  5. `showTripModal` - Display trip overview UI

- ✅ **Tool Handlers** (`lib/tools/trip-tool-handlers.ts`)
  - Implement business logic for each tool
  - Integrate with Zustand stores
  - Return structured responses to LLM

- ✅ **Tool Registry** (Updated `lib/tools/tool-registry.ts`)
  - Added all trip planning tools
  - Dynamic imports for code splitting

- ✅ **Itinerary Planner** (Updated `lib/tools/itinerary-planner.ts`)
  - Merged trip planning tools with existing map tools

### 4. Modal System
- ✅ **Modal Store** (`lib/modal-store.ts`)
  - Centralized modal state management
  - `openModal()` and `closeModal()` utilities

- ✅ **ModalManager** (`components/modals/ModalManager.tsx`)
  - Portal-based modal rendering
  - Backdrop + content wrapper

- ✅ **TripOverviewModal** (`components/modals/TripOverviewModal.tsx`)
  - Full itinerary display
  - Day summaries with activity counts
  - Budget overview
  - Click-through to day details

- ✅ **DayDetailModal** (`components/modals/DayDetailModal.tsx`)
  - Detailed view of single day
  - All activities with times/locations
  - Google Maps links

- ✅ **BudgetTrackerModal** (`components/modals/BudgetTrackerModal.tsx`)
  - Visual budget breakdown
  - Category allocations with progress bars
  - Remaining budget calculation

- ✅ **LobbyCreateModal** & **LobbyJoinModal**
  - Create collaborative planning lobbies
  - Join with invite codes
  - Share invite codes

---

## 🚧 Next Steps (Remaining Work)

### 5. Integrate Modals into App
**File**: `App.tsx`
```tsx
import ModalManager from './components/modals/ModalManager';

// Add inside main component:
<ModalManager />
```

### 6. Sync Map Markers with Database
**Goal**: Load itinerary items from database and display as markers

**Implementation** (`App.tsx` or new effect):
```tsx
useEffect(() => {
  const { currentTrip, days, items } = useTrip.getState();
  if (!currentTrip) return;

  // Collect all items across all days
  const allItems = Object.values(items).flat();

  // Convert to map markers
  const markers = allItems
    .filter(item => item.lat && item.lng)
    .map(item => ({
      position: {
        lat: item.lat,
        lng: item.lng,
        altitude: 1
      },
      label: item.place_name,
      showLabel: true
    }));

  useMapStore.getState().setMarkers(markers);
}, [/* trip changes */]);
```

### 7. Update System Prompt
**File**: `lib/constants.ts`

Update `SYSTEM_INSTRUCTIONS` to guide LLM on multi-day planning:

```typescript
export const SYSTEM_INSTRUCTIONS = `
You are an expert AI trip planner specializing in multi-day and multi-week travel itineraries.

## Your Capabilities

1. **Trip Creation**: Use createTrip tool to initialize new trips
2. **Day Planning**: Use addItineraryDay for each day of the trip
3. **Activity Planning**: Use mapsGrounding to find places, then addItineraryItem to save them
4. **Budget Management**: Use updateBudget to track costs
5. **Visualization**: Use showTripModal to display the full itinerary

## Planning Workflow

When a user asks to plan a trip:

1. **Gather Requirements**
   - Destination(s)
   - Start and end dates
   - Budget
   - Interests/preferences
   - Travel style (budget/moderate/luxury)

2. **Create the Trip**
   \`\`\`
   createTrip({
     name: "Tokyo Adventure",
     destination: "Tokyo, Japan",
     start_date: "2025-06-01",
     end_date: "2025-06-07",
     budget: 2000
   })
   \`\`\`

3. **Plan Each Day**
   For each day:
   - addItineraryDay with day number and date
   - Use mapsGrounding to find restaurants, activities, accommodations
   - addItineraryItem for each place (include grounding_data)
   - Consider travel times between activities
   - Balance budget across days

4. **Optimize**
   - Group nearby activities
   - Schedule meals at appropriate times
   - Include buffer time for travel
   - Track budget with updateBudget

5. **Present**
   - Use showTripModal to display the itinerary
   - Highlight key activities
   - Mention budget status

## Best Practices

- Always be specific with mapsGrounding queries (include city/area)
- Add start_time to activities when possible
- Include place_address and place_id from grounding data
- Keep days realistic (4-6 activities max)
- Leave evening free or suggest dinner options
- Consider opening hours and distances

Your responses should be friendly, enthusiastic, and helpful!
`;
```

### 8. Export Functionality
**Priority**: Last (as requested)

Create `lib/exports/` folder with:

**A. Google Maps Export** (`lib/exports/google-maps.ts`)
```tsx
export async function exportToGoogleMaps(tripId: string) {
  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*, itinerary_items(*)')
    .eq('trip_id', tripId)
    .order('day_number');

  return days.map(day => {
    const waypoints = day.itinerary_items
      .filter(item => item.lat && item.lng)
      .map(item => `${item.lat},${item.lng}`)
      .join('/');

    return {
      day: day.day_number,
      url: `https://www.google.com/maps/dir/${waypoints}`
    };
  });
}
```

**B. Calendar Export** (`lib/exports/calendar.ts`)
```tsx
import { createEvents } from 'ics';

export async function exportToCalendar(tripId: string) {
  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*, itinerary_items(*)')
    .eq('trip_id', tripId);

  const events = days.flatMap(day =>
    day.itinerary_items
      .filter(item => item.start_time)
      .map(item => ({
        title: item.place_name,
        start: dateTimeToArray(`${day.date}T${item.start_time}`),
        duration: { hours: 1 },
        location: item.place_address || `${item.lat},${item.lng}`,
        description: item.notes || '',
        geo: { lat: item.lat, lon: item.lng }
      }))
  );

  const { value } = createEvents(events);

  // Download file
  const blob = new Blob([value], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trip-itinerary.ics';
  a.click();
}
```

**C. Email Export** (`lib/exports/email.ts`)
```tsx
export function generateEmailHTML(trip, days, items) {
  return `
    <h1>${trip.name}</h1>
    <p>${trip.start_date} - ${trip.end_date}</p>

    ${days.map(day => `
      <h2>Day ${day.day_number}: ${day.title}</h2>
      <ul>
        ${(items[day.id] || []).map(item => `
          <li>
            <strong>${item.start_time || '–'}</strong> ${item.place_name}
            ${item.place_address ? `<br><small>${item.place_address}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    `).join('')}
  `;
}
```

---

## Database Schema Reference

### Core Tables (Already Created)
- `profiles` - User profiles (using guest IDs for now)
- `lobbies` - Collaborative planning spaces
- `lobby_members` - Lobby participants
- `trips` - Trip metadata
- `itinerary_days` - Daily breakdown
- `itinerary_items` - Activities/places
- `chat_messages` - Conversation history
- `ai_contexts` - AI context storage

### Extension Tables (Already Created)
- `trip_budgets` - Budget tracking
- `accommodations` - Hotel/lodging bookings
- `transportation` - Flights/trains/buses
- `bookings` - Generic booking tracker
- `optimization_logs` - Optimization history
- `exports` - Export history

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         React UI Layer              │
│  Chat + Map + Modals                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Zustand Stores (State)           │
│  useLobby | useTrip | useLogStore   │
│  + Real-time subscriptions          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Supabase Client                  │
│  Database + Realtime + Storage      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    PostgreSQL Database              │
│  (Supabase Backend)                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    External APIs                    │
│  Gemini | Google Maps | Places      │
└─────────────────────────────────────┘
```

---

## LLM Workflow Example

**User**: "Plan a 5-day trip to Paris with a $3000 budget"

**LLM Actions**:
1. `createTrip({ name: "Paris Adventure", destination: "Paris, France", start_date: "2025-07-01", end_date: "2025-07-05", budget: 3000 })`
2. For day 1-5:
   - `addItineraryDay({ day_number: 1, date: "2025-07-01", title: "Arrival & Eiffel Tower" })`
   - `mapsGrounding({ query: "best restaurants near Eiffel Tower, Paris" })`
   - `addItineraryItem({ day_id: "...", place_name: "Le Jules Verne", place_type: "restaurant", lat: 48.858, lng: 2.294, start_time: "19:00" })`
   - (Repeat for activities)
3. `updateBudget({ accommodation: 800, transportation: 400, food: 900, activities: 700, other: 200 })`
4. `showTripModal()` - Displays the itinerary

**User sees**:
- Modal with full 5-day itinerary
- Map markers for all activities
- Budget breakdown
- Exportable to Google Maps/Calendar

---

## Testing Checklist

### Core Functionality
- [ ] Create lobby (without auth)
- [ ] Join lobby with invite code
- [ ] Chat messages persist to database
- [ ] Create trip via LLM tool
- [ ] Add days via LLM tool
- [ ] Add activities via LLM tool
- [ ] View trip overview modal
- [ ] View day detail modal
- [ ] View budget tracker modal
- [ ] Map markers display from database
- [ ] Real-time updates (multiple tabs)

### LLM Integration
- [ ] LLM can create trips
- [ ] LLM can add days
- [ ] LLM can add activities
- [ ] LLM uses mapsGrounding + addItineraryItem together
- [ ] LLM calls showTripModal to display results
- [ ] LLM tracks budget

### Export (Future)
- [ ] Generate Google Maps URLs
- [ ] Download .ics calendar file
- [ ] Generate email HTML

---

## File Structure

```
lib/
├── supabase.ts                    # Supabase client + types
├── guest-user.ts                  # Guest user system
├── modal-store.ts                 # Modal state management
├── state.ts                       # Existing Zustand stores (updated)
├── stores/
│   ├── lobby-store.ts            # Lobby management
│   └── trip-store.ts             # Trip management
├── tools/
│   ├── trip-planning-tools.ts    # LLM tool definitions
│   ├── trip-tool-handlers.ts     # Tool implementations
│   ├── tool-registry.ts          # Tool dispatcher (updated)
│   └── itinerary-planner.ts      # Combined tools (updated)
└── exports/                       # (TODO: Create these)
    ├── google-maps.ts
    ├── calendar.ts
    └── email.ts

components/
└── modals/
    ├── ModalManager.tsx          # Modal router
    ├── TripOverviewModal.tsx     # Full itinerary view
    ├── DayDetailModal.tsx        # Single day view
    ├── BudgetTrackerModal.tsx    # Budget visualization
    ├── LobbyJoinModal.tsx        # Join lobby
    └── LobbyCreateModal.tsx      # Create lobby
```

---

## Environment Variables

Ensure `.env.local` has:
```
GEMINI_API_KEY=...
MAPS_API_KEY=...
VITE_SUPABASE_URL=https://bigacmfaeiijscrblfjb.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## Key Design Decisions

1. **No Authentication**: Using guest users stored in localStorage for simplicity
2. **Lobby-Based**: Collaborative planning with invite codes
3. **Realtime Sync**: Supabase realtime for multi-user updates
4. **LLM-Driven**: AI creates trips using database tools
5. **Modal-First UI**: Rich overlays on top of chat+map
6. **Export Last**: Prioritize core planning, defer export features

---

## Next Immediate Steps

1. **Add ModalManager to App.tsx**
2. **Sync map markers with database items**
3. **Update system prompt for multi-day planning**
4. **Test complete workflow**: lobby → chat → create trip → view modal
5. **Implement exports** (Google Maps, Calendar, Email)

---

## Future Enhancements

- Real authentication (Supabase Auth)
- Booking integrations (Hotels.com, Skyscanner APIs)
- Cost optimization algorithms
- Weather integration
- Collaborative editing (operational transforms)
- Mobile app (React Native)
- PDF export
- Social sharing
- Trip templates
