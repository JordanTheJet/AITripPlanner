/**
 * Trip Planning Tools with Supabase Integration
 * These tools allow the LLM to create and manage multi-day trips in the database
 */

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const tripPlanningTools: FunctionCall[] = [
  {
    name: 'createTrip',
    description: `
    Creates a new multi-day trip in the database. Use this when the user wants to plan a trip.
    This initializes the trip with basic metadata.

    Args:
        name: Trip name (e.g., "Tokyo Adventure", "Europe Backpacking")
        destination: Primary destination (e.g., "Tokyo, Japan", "Multiple European Cities")
        start_date: ISO date string (YYYY-MM-DD)
        end_date: ISO date string (YYYY-MM-DD)
        budget: Optional total budget in USD

    Returns:
        Trip ID and confirmation that the trip was created
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'The name of the trip'
        },
        destination: {
          type: 'STRING',
          description: 'The primary destination'
        },
        start_date: {
          type: 'STRING',
          description: 'Start date in YYYY-MM-DD format'
        },
        end_date: {
          type: 'STRING',
          description: 'End date in YYYY-MM-DD format'
        },
        budget: {
          type: 'NUMBER',
          description: 'Total budget in USD (optional)'
        }
      },
      required: ['name', 'destination', 'start_date', 'end_date']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'addItineraryDay',
    description: `
    Adds a day to the current trip's itinerary. Call this for each day of the trip.

    Args:
        day_number: The day number (1 for first day, 2 for second, etc.)
        date: ISO date string (YYYY-MM-DD)
        title: Optional title for the day (e.g., "Exploring Shibuya", "Day Trip to Mt. Fuji")
        notes: Optional notes about the day

    Returns:
        Day ID and confirmation
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        day_number: {
          type: 'NUMBER',
          description: 'The day number (1-indexed)'
        },
        date: {
          type: 'STRING',
          description: 'Date in YYYY-MM-DD format'
        },
        title: {
          type: 'STRING',
          description: 'Title for the day (optional)'
        },
        notes: {
          type: 'STRING',
          description: 'Notes about the day (optional)'
        }
      },
      required: ['day_number', 'date']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'addItineraryItem',
    description: `
    Adds an activity, restaurant, accommodation, or transportation to a specific day.
    Use this after finding places with mapsGrounding.

    Args:
        day_id: The day ID (from addItineraryDay response)
        place_name: Name of the place
        place_type: Type of activity ("restaurant", "activity", "accommodation", "transport", "other")
        lat: Latitude
        lng: Longitude
        place_id: Optional Google Place ID
        place_address: Optional address
        start_time: Optional start time (HH:MM format)
        end_time: Optional end time (HH:MM format)
        notes: Optional notes
        grounding_data: Optional object containing grounding metadata from mapsGrounding

    Returns:
        Item ID and confirmation
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        day_id: {
          type: 'STRING',
          description: 'The ID of the day to add this item to'
        },
        place_name: {
          type: 'STRING',
          description: 'Name of the place'
        },
        place_type: {
          type: 'STRING',
          description: 'Type of place',
          enum: ['restaurant', 'activity', 'accommodation', 'transport', 'other']
        },
        lat: {
          type: 'NUMBER',
          description: 'Latitude'
        },
        lng: {
          type: 'NUMBER',
          description: 'Longitude'
        },
        place_id: {
          type: 'STRING',
          description: 'Google Place ID (optional)'
        },
        place_address: {
          type: 'STRING',
          description: 'Address (optional)'
        },
        start_time: {
          type: 'STRING',
          description: 'Start time in HH:MM format (optional)'
        },
        end_time: {
          type: 'STRING',
          description: 'End time in HH:MM format (optional)'
        },
        notes: {
          type: 'STRING',
          description: 'Additional notes (optional)'
        },
        grounding_data: {
          type: 'OBJECT',
          description: 'Grounding metadata from mapsGrounding (optional)'
        }
      },
      required: ['day_id', 'place_name', 'place_type', 'lat', 'lng']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'updateBudget',
    description: `
    Updates the trip budget breakdown. Use this to track estimated costs.

    Args:
        accommodation: Amount allocated for accommodation
        transportation: Amount for transportation
        food: Amount for food
        activities: Amount for activities
        other: Amount for other expenses

    Returns:
        Updated budget information
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        accommodation: {
          type: 'NUMBER',
          description: 'Accommodation budget'
        },
        transportation: {
          type: 'NUMBER',
          description: 'Transportation budget'
        },
        food: {
          type: 'NUMBER',
          description: 'Food budget'
        },
        activities: {
          type: 'NUMBER',
          description: 'Activities budget'
        },
        other: {
          type: 'NUMBER',
          description: 'Other expenses budget'
        }
      }
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'showTripModal',
    description: `
    Displays the trip overview modal to the user, showing the full itinerary with all days and activities.
    Call this after creating a trip to show the user what you've planned.

    Args:
        None

    Returns:
        Confirmation that modal was displayed
    `,
    parameters: {
      type: 'OBJECT',
      properties: {}
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  }
];
