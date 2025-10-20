/**
 * Calendar Export Utilities (.ics format)
 * Generates iCalendar files for trip itineraries
 */

import { supabase, type Trip, type ItineraryDay, type ItineraryItem } from '../supabase';
import { format, parseISO } from 'date-fns';

/**
 * Format a date for iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a single iCalendar event for an itinerary item
 */
function generateICalEvent(
  item: ItineraryItem,
  dayDate: string,
  tripName: string
): string {
  const date = parseISO(dayDate);

  // Parse time if available, otherwise use default times
  let startTime = new Date(date);
  let endTime = new Date(date);

  if (item.start_time) {
    const [hours, minutes] = item.start_time.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    if (item.end_time) {
      const [endHours, endMinutes] = item.end_time.split(':').map(Number);
      endTime.setHours(endHours, endMinutes, 0, 0);
    } else {
      // Default to 1 hour duration
      endTime.setHours(hours + 1, minutes, 0, 0);
    }
  } else {
    // Default times: 9 AM - 10 AM
    startTime.setHours(9, 0, 0, 0);
    endTime.setHours(10, 0, 0, 0);
  }

  const uid = `${item.id}@aitripplanner`;
  const dtstamp = formatICalDate(new Date());
  const dtstart = formatICalDate(startTime);
  const dtend = formatICalDate(endTime);
  const summary = escapeICalText(`${tripName}: ${item.place_name}`);

  let description = escapeICalText(item.notes || '');
  if (item.address) {
    description += `\\nAddress: ${escapeICalText(item.address)}`;
  }

  const location = item.address ? escapeICalText(item.address) : '';

  let geo = '';
  if (item.lat && item.lng) {
    geo = `GEO:${item.lat};${item.lng}`;
  }

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
    location ? `LOCATION:${location}` : '',
    geo,
    'END:VEVENT'
  ].filter(line => line).join('\r\n');
}

/**
 * Generate full iCalendar (.ics) content for a trip
 */
export async function generateTripCalendar(tripId: string): Promise<string> {
  // Fetch trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');

  // Fetch days
  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number');

  if (daysError) throw daysError;
  if (!days || days.length === 0) {
    throw new Error('No itinerary days found for this trip');
  }

  // Start building iCalendar
  const events: string[] = [];

  // For each day, fetch items and create events
  for (const day of days) {
    const { data: items, error: itemsError } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('day_id', day.id)
      .order('order_index');

    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      for (const item of items) {
        events.push(generateICalEvent(item, day.date, trip.name));
      }
    }
  }

  // Build complete iCalendar file
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Trip Planner//EN',
    `X-WR-CALNAME:${escapeICalText(trip.name)}`,
    `X-WR-CALDESC:${escapeICalText(`Trip to ${trip.destination}`)}`,
    'X-WR-TIMEZONE:UTC',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  return icalContent;
}

/**
 * Download trip itinerary as .ics file
 */
export async function downloadTripCalendar(tripId: string, tripName: string) {
  const icalContent = await generateTripCalendar(tripId);

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
