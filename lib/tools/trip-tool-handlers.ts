/**
 * Tool handlers for trip planning functions
 * These implement the actual logic for each tool
 */

import { useTrip } from '../stores/trip-store';
import { useLobby } from '../stores/lobby-store';
import { useUI } from '../state';

interface ToolContext {
  map: google.maps.maps3d.Map3DElement | null;
  placesLib: google.maps.PlacesLibrary | null;
  elevationLib: google.maps.ElevationLibrary | null;
  geocoder: google.maps.Geocoder | null;
  padding: [number, number, number, number];
}

export const tripToolHandlers = {
  createTrip: async (args: any, context: ToolContext) => {
    try {
      const trip = await useTrip.getState().createTrip({
        name: args.name,
        destination: args.destination,
        start_date: args.start_date,
        end_date: args.end_date,
        budget: args.budget || 0
      });

      return `Successfully created trip "${trip.name}" to ${trip.destination} from ${trip.start_date} to ${trip.end_date}. Trip ID: ${trip.id}`;
    } catch (error: any) {
      console.error('Error creating trip:', error);
      return `Failed to create trip: ${error.message}`;
    }
  },

  addItineraryDay: async (args: any, context: ToolContext) => {
    try {
      const day = await useTrip.getState().addDay({
        day_number: args.day_number,
        date: args.date,
        title: args.title || null,
        notes: args.notes || null
      });

      return {
        success: true,
        day_id: day.id,
        message: `Added day ${args.day_number}: ${args.date}`,
        day
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  addItineraryItem: async (args: any, context: ToolContext) => {
    try {
      const item = await useTrip.getState().addItem(args.day_id, {
        place_name: args.place_name,
        place_type: args.place_type,
        lat: args.lat,
        lng: args.lng,
        place_id: args.place_id || null,
        place_address: args.place_address || null,
        start_time: args.start_time || null,
        end_time: args.end_time || null,
        notes: args.notes || null,
        grounding_data: args.grounding_data || null
      });

      return {
        success: true,
        item_id: item.id,
        message: `Added ${args.place_type}: ${args.place_name}`,
        item
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  updateBudget: async (args: any, context: ToolContext) => {
    try {
      const breakdown = {
        accommodation: args.accommodation || 0,
        transportation: args.transportation || 0,
        food: args.food || 0,
        activities: args.activities || 0,
        other: args.other || 0
      };

      await useTrip.getState().updateBudget({ breakdown });

      const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

      return {
        success: true,
        message: `Updated budget breakdown (Total: $${total})`,
        breakdown
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getCurrentTrip: async (args: any, context: ToolContext) => {
    try {
      const { currentTrip, days, items } = useTrip.getState();

      if (!currentTrip) {
        return {
          success: false,
          error: 'No active trip found. Please create a trip first using createTrip.'
        };
      }

      // Organize items by day
      const daysWithItems = days.map(day => ({
        ...day,
        items: items.filter(item => item.day_id === day.id)
      }));

      return {
        success: true,
        trip: {
          ...currentTrip,
          days: daysWithItems
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  showTripModal: async (args: any, context: ToolContext) => {
    try {
      // Open the trip overview modal
      // We'll implement useUI.openModal in the next step
      const { openModal } = await import('../modal-store');
      openModal('trip-overview');

      return {
        success: true,
        message: 'Displaying trip overview modal'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
