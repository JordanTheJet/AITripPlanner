# AI Trip Planner - Quick Start Guide

## 🎉 Integration Complete!

Your multi-day trip planner with Supabase backend is now fully integrated and ready to use!

---

## 🚀 Getting Started

### 1. Start the Development Server

The server is already running on: **http://localhost:3002/**

Open this URL in your browser to start planning trips!

### 2. Create or Join a Lobby

1. Click the **Settings** gear icon (top right)
2. In the sidebar, you'll see **Trip Planning** section
3. Choose:
   - **Create Lobby** - Start a new planning session
   - **Join Lobby** - Join an existing session with an invite code

### 3. Plan Your Trip with AI

Once in a lobby, start chatting! Try these examples:

**Example 1: Quick 3-day trip**
```
"Plan a 3-day trip to Tokyo with a $1500 budget. I love food and culture."
```

**Example 2: Week-long adventure**
```
"I want to plan a week in Paris from June 1-7, 2025. Budget is $3000.
I'm interested in art museums, great restaurants, and romantic spots."
```

**Example 3: Multi-city tour**
```
"Plan a 10-day Europe trip visiting London, Paris, and Rome.
Budget $4000. I love history and Italian food."
```

### 4. What the AI Will Do

The LLM will automatically:

1. ✅ **Create the trip** in the database
2. ✅ **Plan each day** with activities
3. ✅ **Search Google Maps** for restaurants, attractions, hotels
4. ✅ **Save everything** to Supabase (real-time sync!)
5. ✅ **Show map markers** for all locations
6. ✅ **Display a beautiful modal** with the full itinerary
7. ✅ **Track your budget** across categories

---

## 🎯 Key Features

### Modal System
- **Trip Overview Modal**: View complete itinerary with all days
- **Day Detail Modal**: Drill down into individual days
- **Budget Tracker Modal**: Visual budget breakdown
- **Lobby Modals**: Create/join collaborative sessions

### Real-Time Collaboration
- Multiple users can join the same lobby
- Changes sync in real-time via Supabase
- Share invite codes for collaborative planning

### Database Persistence
- All trips saved to Supabase PostgreSQL
- Chat history preserved
- Real-time updates across devices

### Map Integration
- 3D Google Maps with markers for all activities
- Auto-framing to show all locations
- Interactive markers with place details

---

## 🧪 Testing the Complete Workflow

### Test 1: Create a Simple Trip
1. Open sidebar → Create Lobby
2. Chat: "Plan a 2-day trip to San Francisco with a $800 budget"
3. Watch the AI:
   - Call `createTrip`
   - Call `addItineraryDay` (twice)
   - Call `mapsGrounding` to find places
   - Call `addItineraryItem` for each place
   - Call `updateBudget`
   - Call `showTripModal` to display results
4. Click markers on the map
5. View the modal to see the full itinerary

### Test 2: Multi-Day Planning
1. Chat: "Plan a week in Japan"
2. AI will ask for:
   - Specific dates
   - Budget
   - Interests
3. Watch it plan 7 days with activities!
4. Open the trip overview modal
5. Click on individual days for details

### Test 3: Budget Tracking
1. After creating a trip, click "View Trip" in sidebar
2. Click "View Budget Breakdown" link
3. See visual budget allocation by category

### Test 4: Collaborative Planning
1. Create a lobby
2. Copy the invite code from the sidebar
3. Open in another browser/tab
4. Join with the invite code
5. Both users see the same trip in real-time!

---

## 📊 Architecture Overview

```
User Chat → Gemini LLM → Tools → Supabase → UI Updates

Tools Available:
- createTrip
- addItineraryDay
- addItineraryItem
- updateBudget
- showTripModal
- mapsGrounding (existing)
- frameEstablishingShot (existing)
- frameLocations (existing)
```

---

## 🗂️ File Structure

### New Files Created
```
lib/
├── supabase.ts                    # Supabase client + types
├── guest-user.ts                  # Guest authentication
├── modal-store.ts                 # Modal state
├── stores/
│   ├── lobby-store.ts            # Lobby management
│   └── trip-store.ts             # Trip CRUD operations
├── tools/
│   ├── trip-planning-tools.ts    # 5 new LLM tools
│   └── trip-tool-handlers.ts     # Tool implementations
└── exports/ (TODO)                # Future: Google Maps/Calendar/Email

components/
└── modals/
    ├── ModalManager.tsx          # Modal router
    ├── TripOverviewModal.tsx     # Full itinerary
    ├── DayDetailModal.tsx        # Single day view
    ├── BudgetTrackerModal.tsx    # Budget viz
    ├── LobbyJoinModal.tsx        # Join lobby
    └── LobbyCreateModal.tsx      # Create lobby
```

### Modified Files
```
App.tsx                           # Added ModalManager + map sync
components/Sidebar.tsx            # Added lobby controls
lib/state.ts                      # Added chat persistence
lib/constants.ts                  # Updated system prompt
lib/tools/itinerary-planner.ts   # Added new tools
lib/tools/tool-registry.ts       # Registered new tools
```

---

## 🎨 UI Components

### Sidebar (Settings Panel)
- **Trip Planning Section**
  - Shows current lobby name & invite code
  - Shows active trip name
  - "View Trip" button (opens modal)
  - "Leave Lobby" button
  - "Create Lobby" / "Join Lobby" buttons

### Modals
All modals overlay the map with backdrop:
- Click outside to close
- Scroll for long content
- Mobile-responsive

---

## 💾 Database Schema

Your Supabase database has these tables:

**Core Tables:**
- `lobbies` - Planning sessions
- `trips` - Trip metadata
- `itinerary_days` - Daily breakdown
- `itinerary_items` - Activities/places
- `chat_messages` - Conversation history
- `trip_budgets` - Budget tracking

**Extended Tables:**
- `accommodations` - Hotels/lodging
- `transportation` - Flights/trains
- `bookings` - Booking confirmations
- `exports` - Export history

---

## 🔑 Environment Variables

Ensure `.env.local` has:
```
GEMINI_API_KEY=your_gemini_key
MAPS_API_KEY=your_maps_key
VITE_SUPABASE_URL=https://bigacmfaeiijscrblfjb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🐛 Troubleshooting

### Issue: Modal doesn't appear
**Solution**: Check browser console for errors. Ensure ModalManager is in App.tsx

### Issue: Map markers not showing
**Solution**: Ensure trip has items with lat/lng coordinates

### Issue: Database errors
**Solution**:
1. Check Supabase dashboard
2. Verify RLS policies are active
3. Check browser network tab for failed requests

### Issue: LLM not creating trips
**Solution**:
1. Open sidebar and check system prompt
2. Ensure all tools are enabled
3. Try being more explicit: "Use the createTrip tool to make a new trip"

---

## 🎯 Next Steps (Future Enhancements)

### Export Functionality (Priority: Last)
- Google Maps waypoint URLs
- .ics calendar file download
- HTML email generation

### Additional Features
- Real authentication (replace guest users)
- Booking API integrations (Hotels.com, Skyscanner)
- Weather data integration
- PDF export
- Mobile app
- Trip templates

---

## 📝 Tips for Best Results

### For Users:
1. Be specific about dates and budget
2. Mention your interests clearly
3. Ask for modifications if needed
4. Use "View Trip" button to see full itinerary

### For Developers:
1. Check browser console for errors
2. Use Supabase dashboard to inspect data
3. Monitor network tab for API calls
4. Read IMPLEMENTATION_PLAN.md for architecture details

---

## 🎉 Success!

You now have a fully functional multi-day trip planner with:
- ✅ LLM-powered planning
- ✅ Supabase database backend
- ✅ Real-time collaboration
- ✅ Beautiful modal UI
- ✅ Map visualization
- ✅ Budget tracking

**Start Planning Amazing Trips! 🌍✈️**

Visit: **http://localhost:3002/**
