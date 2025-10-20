/**
 * Activity Management Tools
 * Tools for discovering and managing activities
 */

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const activityTools: FunctionCall[] = [
  {
    name: 'suggestActivities',
    description: `
    Suggests activities based on the destination, interests, and preferences.
    Uses mapsGrounding to find relevant activities and provides curated recommendations.

    Args:
        destination: The city or location (e.g., "Paris", "Tokyo", "New York")
        activity_types: Array of activity types (e.g., ["museums", "parks", "restaurants", "nightlife"])
        interests: Optional array of interests (e.g., ["art", "history", "food", "adventure"])
        budget_level: Optional budget level ("budget", "moderate", "luxury")
        time_of_day: Optional preferred time ("morning", "afternoon", "evening", "night")

    Returns:
        A list of suggested activities with details from mapsGrounding
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        destination: {
          type: 'STRING',
          description: 'The city or location to find activities in'
        },
        activity_types: {
          type: 'ARRAY',
          items: {
            type: 'STRING'
          },
          description: 'Types of activities to search for'
        },
        interests: {
          type: 'ARRAY',
          items: {
            type: 'STRING'
          },
          description: 'User interests to filter activities (optional)'
        },
        budget_level: {
          type: 'STRING',
          enum: ['budget', 'moderate', 'luxury'],
          description: 'Budget level for activities (optional)'
        },
        time_of_day: {
          type: 'STRING',
          enum: ['morning', 'afternoon', 'evening', 'night'],
          description: 'Preferred time of day (optional)'
        }
      },
      required: ['destination', 'activity_types']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'findNearbyActivities',
    description: `
    Finds activities near a specific location or accommodation.
    Useful for filling free time or finding things to do near where the user is staying.

    Args:
        lat: Latitude of the location
        lng: Longitude of the location
        radius: Search radius in meters (default: 1000)
        activity_type: Type of activity (e.g., "restaurant", "cafe", "museum", "park")

    Returns:
        List of nearby activities with distances and details
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        lat: {
          type: 'NUMBER',
          description: 'Latitude'
        },
        lng: {
          type: 'NUMBER',
          description: 'Longitude'
        },
        radius: {
          type: 'NUMBER',
          description: 'Search radius in meters (default: 1000)'
        },
        activity_type: {
          type: 'STRING',
          description: 'Type of activity to search for'
        }
      },
      required: ['lat', 'lng', 'activity_type']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  },

  {
    name: 'getActivityDetails',
    description: `
    Gets detailed information about a specific activity or place.
    Use this to provide the user with comprehensive information before adding to itinerary.

    Args:
        place_id: Google Place ID
        include_reviews: Whether to include reviews (default: true)
        include_photos: Whether to include photo URLs (default: true)

    Returns:
        Detailed information including hours, reviews, photos, pricing, etc.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {
        place_id: {
          type: 'STRING',
          description: 'Google Place ID'
        },
        include_reviews: {
          type: 'BOOLEAN',
          description: 'Include reviews (default: true)'
        },
        include_photos: {
          type: 'BOOLEAN',
          description: 'Include photo URLs (default: true)'
        }
      },
      required: ['place_id']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.ASYNC,
  }
];
