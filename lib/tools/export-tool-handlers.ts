/**
 * Export Tool Handlers
 * Implementations for export tools that the LLM can call
 */

import { ToolContext } from './tool-registry';
import { useTrip } from '../stores/trip-store';
import { exportTripToGoogleMaps, openInGoogleMaps } from '../exports/google-maps';
import { downloadTripCalendar } from '../exports/calendar';
import { supabase } from '../supabase';
import { format, parseISO } from 'date-fns';

export const exportToolHandlers = {
  /**
   * Export trip to Google Maps directions URLs
   */
  exportToGoogleMaps: async (args: any, context: ToolContext) => {
    const { currentTrip } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      const exports = await exportTripToGoogleMaps(currentTrip.id);

      if (exports.length === 0) {
        return 'No locations with coordinates found in the itinerary. Please add some places first.';
      }

      // Format response with clickable URLs
      let response = `Here are your Google Maps directions for "${currentTrip.name}":\n\n`;

      for (const exp of exports) {
        const dateStr = format(parseISO(exp.date), 'MMM d, yyyy');
        const dayTitle = exp.title || `Day ${exp.dayNumber}`;

        response += `**${dayTitle}** (${dateStr})\n`;
        response += `${exp.url}\n\n`;
      }

      response += '\nClick any link to open directions in Google Maps!';

      return response;
    } catch (error: any) {
      console.error('Error exporting to Google Maps:', error);
      return `Failed to export to Google Maps: ${error.message}`;
    }
  },

  /**
   * Export trip to calendar (.ics file)
   */
  exportToCalendar: async (args: any, context: ToolContext) => {
    const { currentTrip } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      await downloadTripCalendar(currentTrip.id, currentTrip.name);

      return `Calendar file downloaded! The itinerary for "${currentTrip.name}" has been exported as a .ics file. You can now import it into:\n\n- Google Calendar\n- Apple Calendar\n- Outlook\n- Any calendar app that supports .ics files\n\nThe file should be in your Downloads folder.`;
    } catch (error: any) {
      console.error('Error exporting to calendar:', error);
      return `Failed to export to calendar: ${error.message}`;
    }
  },

  /**
   * Get a formatted text summary of the trip
   */
  getTripSummary: async (args: any, context: ToolContext) => {
    const { currentTrip, days, items, budget } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      let summary = `# ${currentTrip.name}\n`;
      summary += `**Destination:** ${currentTrip.destination}\n`;
      summary += `**Dates:** ${format(parseISO(currentTrip.start_date), 'MMM d, yyyy')} - ${format(parseISO(currentTrip.end_date), 'MMM d, yyyy')}\n`;

      if (budget) {
        summary += `**Budget:** $${budget.total_budget} ${budget.currency}\n`;
      }

      summary += '\n---\n\n';

      // Add each day's itinerary
      const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);

      for (const day of sortedDays) {
        const dayItems = items[day.id] || [];
        const dateStr = format(parseISO(day.date), 'EEEE, MMMM d, yyyy');

        summary += `## Day ${day.day_number}: ${day.title || dateStr}\n`;
        summary += `${dateStr}\n\n`;

        if (dayItems.length === 0) {
          summary += '*No activities planned yet*\n\n';
        } else {
          for (const item of dayItems) {
            let timeStr = '';
            if (item.start_time) {
              timeStr = `**${item.start_time}`;
              if (item.end_time) {
                timeStr += ` - ${item.end_time}`;
              }
              timeStr += ':** ';
            }

            summary += `${item.order_index + 1}. ${timeStr}${item.place_name}\n`;

            if (item.address) {
              summary += `   *${item.address}*\n`;
            }

            if (item.notes) {
              summary += `   ${item.notes}\n`;
            }

            if (item.estimated_cost) {
              summary += `   Cost: $${item.estimated_cost}\n`;
            }

            summary += '\n';
          }
        }

        summary += '---\n\n';
      }

      if (budget && budget.breakdown) {
        summary += '## Budget Breakdown\n\n';
        summary += `- Accommodation: $${budget.breakdown.accommodation || 0}\n`;
        summary += `- Transportation: $${budget.breakdown.transportation || 0}\n`;
        summary += `- Food: $${budget.breakdown.food || 0}\n`;
        summary += `- Activities: $${budget.breakdown.activities || 0}\n`;
        summary += `- Other: $${budget.breakdown.other || 0}\n\n`;
        summary += `**Total Budget:** $${budget.total_budget}\n`;
        if (budget.actual_spent) {
          summary += `**Spent So Far:** $${budget.actual_spent}\n`;
        }
      }

      return summary;
    } catch (error: any) {
      console.error('Error generating trip summary:', error);
      return `Failed to generate trip summary: ${error.message}`;
    }
  },

  /**
   * Export trip to PDF
   */
  exportToPDF: async (args: any, context: ToolContext) => {
    const { currentTrip } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      const { downloadTripPDF } = await import('../exports/pdf');
      await downloadTripPDF(currentTrip.id, currentTrip.name);

      return `PDF downloaded! Your beautifully formatted itinerary for "${currentTrip.name}" is ready to print. Check your Downloads folder for the PDF file.`;
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      return `Failed to export to PDF: ${error.message}. Note: PDF export requires the jspdf library.`;
    }
  },

  /**
   * Export trip to JSON
   */
  exportToJSON: async (args: any, context: ToolContext) => {
    const { currentTrip } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      const { downloadTripJSON } = await import('../exports/json');
      await downloadTripJSON(currentTrip.id, currentTrip.name);

      return `JSON file downloaded! Complete trip data for "${currentTrip.name}" has been exported. You can use this for backup, data analysis, or importing into other systems.`;
    } catch (error: any) {
      console.error('Error exporting to JSON:', error);
      return `Failed to export to JSON: ${error.message}`;
    }
  },

  /**
   * Export trip to CSV
   */
  exportToCSV: async (args: any, context: ToolContext) => {
    const { currentTrip } = useTrip.getState();

    if (!currentTrip) {
      return 'No active trip found. Please create a trip first.';
    }

    try {
      const { downloadTripCSV } = await import('../exports/csv');
      await downloadTripCSV(currentTrip.id, currentTrip.name);

      return `CSV file downloaded! Your itinerary for "${currentTrip.name}" is now in spreadsheet format. Open it with Excel, Google Sheets, or any spreadsheet application.`;
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      return `Failed to export to CSV: ${error.message}`;
    }
  }
};
