/**
 * Activity Tool Handlers
 * Implementations for activity discovery and management tools
 */

import { ToolContext } from './tool-registry';
import { fetchMapsGroundedResponseREST } from '../maps-grounding';

export const activityToolHandlers = {
  /**
   * Suggest activities based on destination and preferences
   */
  suggestActivities: async (args: any, context: ToolContext) => {
    const {
      destination,
      activity_types,
      interests,
      budget_level,
      time_of_day
    } = args;

    try {
      // Build search query
      let query = `${activity_types.join(', ')} in ${destination}`;

      if (interests && interests.length > 0) {
        query += ` for people interested in ${interests.join(', ')}`;
      }

      if (budget_level) {
        query += ` with ${budget_level} prices`;
      }

      if (time_of_day) {
        query += ` good for ${time_of_day}`;
      }

      // Use mapsGrounding to find activities
      const response = await fetchMapsGroundedResponseREST({
        prompt: query,
        enableWidget: true
      });

      if (!response) {
        return 'Unable to find activities. Please try a different search.';
      }

      // Extract activity information from grounding chunks
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (groundingChunks.length === 0) {
        return responseText || 'No activities found matching your criteria.';
      }

      // Return the grounded response with activity suggestions
      return {
        suggestions: responseText,
        grounding_data: groundingChunks,
        message: `Found ${groundingChunks.length} activities in ${destination}. Use addItineraryItem to add any of these to your trip!`
      };

    } catch (error: any) {
      console.error('Error suggesting activities:', error);
      return `Failed to suggest activities: ${error.message}`;
    }
  },

  /**
   * Find activities near a specific location
   */
  findNearbyActivities: async (args: any, context: ToolContext) => {
    const { lat, lng, radius = 1000, activity_type } = args;

    try {
      // Build query for nearby search
      const query = `${activity_type} near ${lat},${lng} within ${radius} meters`;

      const response = await fetchMapsGroundedResponseREST({
        prompt: query,
        enableWidget: true
      });

      if (!response) {
        return 'Unable to find nearby activities.';
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (groundingChunks.length === 0) {
        return `No ${activity_type} found within ${radius} meters of the specified location.`;
      }

      return {
        nearby_activities: responseText,
        grounding_data: groundingChunks,
        location: { lat, lng },
        radius,
        count: groundingChunks.length
      };

    } catch (error: any) {
      console.error('Error finding nearby activities:', error);
      return `Failed to find nearby activities: ${error.message}`;
    }
  },

  /**
   * Get detailed information about a specific activity/place
   */
  getActivityDetails: async (args: any, context: ToolContext) => {
    const { place_id, include_reviews = true, include_photos = true } = args;
    const { placesLib } = context;

    if (!placesLib) {
      return 'Places library not available.';
    }

    try {
      // Fetch place details using Google Places API
      const place = new placesLib.Place({ id: place_id.replace('places/', '') });

      const fields = [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'rating',
        'userRatingCount',
        'priceLevel',
        'types',
        'websiteURI',
        'nationalPhoneNumber',
        'businessStatus',
        'regularOpeningHours'
      ];

      if (include_reviews) {
        fields.push('reviews');
      }

      if (include_photos) {
        fields.push('photos');
      }

      await place.fetchFields({ fields: fields as any[] });

      // Build detailed response
      const details: any = {
        name: place.displayName,
        address: place.formattedAddress,
        location: place.location ? {
          lat: place.location.lat(),
          lng: place.location.lng()
        } : null,
        rating: place.rating,
        total_ratings: place.userRatingCount,
        price_level: place.priceLevel,
        types: place.types,
        website: place.websiteURI,
        phone: place.nationalPhoneNumber,
        status: place.businessStatus
      };

      if (place.regularOpeningHours) {
        details.hours = {
          weekday_text: (place.regularOpeningHours as any).weekdayDescriptions,
          is_open_now: (place.regularOpeningHours as any).periods ? true : false
        };
      }

      if (include_reviews && place.reviews) {
        details.reviews = place.reviews.slice(0, 5).map((review: any) => ({
          author: review.authorAttribution?.displayName,
          rating: review.rating,
          text: review.text?.text,
          time: review.publishTime
        }));
      }

      if (include_photos && place.photos) {
        details.photo_urls = place.photos.slice(0, 5).map((photo: any) => ({
          url: photo.getURI(),
          attribution: photo.authorAttributions?.[0]?.displayName
        }));
      }

      return {
        success: true,
        details,
        message: `Retrieved detailed information for ${place.displayName}`
      };

    } catch (error: any) {
      console.error('Error getting activity details:', error);
      return `Failed to get activity details: ${error.message}`;
    }
  }
};
