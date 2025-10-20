/**
 * Export Tools for LLM
 * Tools that allow the LLM to export trip data to various formats
 */

import { FunctionCall } from '../state';

export const exportTools: FunctionCall[] = [
  {
    name: 'exportToGoogleMaps',
    description: `
    Exports the current trip itinerary to Google Maps directions URLs.
    Creates one URL per day with waypoints for all locations on that day.
    Returns clickable links that the user can open in their browser.

    Use this when the user asks to:
    - "Export to Google Maps"
    - "Send to Google Maps"
    - "Open in Google Maps"
    - "Get directions"

    Returns: A message with Google Maps URLs for each day of the trip.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  },
  {
    name: 'exportToCalendar',
    description: `
    Exports the current trip itinerary as a downloadable .ics calendar file.
    Creates calendar events for each activity in the itinerary with:
    - Event times (if specified)
    - Location names and addresses
    - Notes and descriptions
    - Geographic coordinates

    Use this when the user asks to:
    - "Export to calendar"
    - "Download calendar"
    - "Add to my calendar"
    - "Create calendar events"
    - "Get .ics file"

    The calendar file can be imported into:
    - Google Calendar
    - Apple Calendar
    - Outlook
    - Any calendar app that supports .ics format

    Returns: Downloads a .ics file to the user's device.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  },
  {
    name: 'getTripSummary',
    description: `
    Gets a formatted text summary of the current trip for sharing via email or message.
    Includes:
    - Trip name and destination
    - Dates
    - Day-by-day itinerary with all activities
    - Addresses and times
    - Budget information

    Use this when the user asks to:
    - "Share the itinerary"
    - "Email the trip"
    - "Get a summary"
    - "Export as text"

    Returns: A formatted text summary that can be copied and shared.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  },
  {
    name: 'exportToPDF',
    description: `
    Exports the current trip itinerary as a printable PDF document.
    Creates a beautifully formatted PDF with:
    - Cover page with trip details
    - Day-by-day itinerary with maps
    - Activity list with times and addresses
    - Budget breakdown
    - Notes section

    Use this when the user asks to:
    - "Export to PDF"
    - "Download as PDF"
    - "Print the itinerary"
    - "Create a PDF"

    Returns: Downloads a PDF file to the user's device.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  },
  {
    name: 'exportToJSON',
    description: `
    Exports the complete trip data as a JSON file for developers or backup purposes.
    Includes all trip data in structured JSON format:
    - Trip metadata
    - All days with complete details
    - All itinerary items with grounding data
    - Budget information
    - Timestamps

    Use this when the user asks to:
    - "Export as JSON"
    - "Download trip data"
    - "Backup my trip"
    - "Get the raw data"

    Returns: Downloads a JSON file with complete trip data.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  },
  {
    name: 'exportToCSV',
    description: `
    Exports the trip itinerary as a CSV spreadsheet file.
    Creates a CSV with columns:
    - Day Number
    - Date
    - Time
    - Activity Name
    - Type (restaurant, activity, accommodation, etc.)
    - Address
    - Coordinates
    - Estimated Cost
    - Notes

    Perfect for importing into Excel, Google Sheets, or other spreadsheet tools.

    Use this when the user asks to:
    - "Export to CSV"
    - "Download as spreadsheet"
    - "Export to Excel"
    - "Get CSV file"

    Returns: Downloads a CSV file that can be opened in any spreadsheet application.
    `,
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    },
    isEnabled: true
  }
];
