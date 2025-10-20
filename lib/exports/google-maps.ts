/**
 * Google Maps Export Utilities
 * Generates Google Maps URLs with waypoints for trip itineraries
 */

import { supabase, type Trip, type ItineraryDay, type ItineraryItem } from '../supabase';

export interface GoogleMapsExport {
  url: string;
  dayNumber: number;
  date: string;
  title: string | null;
}

/**
 * Generate Google Maps directions URL with waypoints for a single day
 */
export function generateDayDirectionsUrl(items: ItineraryItem[]): string {
  if (items.length === 0) return '';

  // Filter items that have coordinates
  const itemsWithCoords = items.filter(item => item.lat && item.lng);

  if (itemsWithCoords.length === 0) return '';

  // First location is origin
  const origin = itemsWithCoords[0];
  const originStr = `${origin.lat},${origin.lng}`;

  // Last location is destination
  const destination = itemsWithCoords[itemsWithCoords.length - 1];
  const destinationStr = `${destination.lat},${destination.lng}`;

  // Middle locations are waypoints
  const waypoints = itemsWithCoords.slice(1, -1).map(item =>
    `${item.lat},${item.lng}`
  ).join('|');

  // Build Google Maps Directions URL
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destinationStr)}`;

  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  // Add travel mode (default to driving)
  url += '&travelmode=driving';

  return url;
}

/**
 * Generate Google Maps search URL for viewing all locations as markers
 */
export function generateDayMarkersUrl(items: ItineraryItem[]): string {
  if (items.length === 0) return '';

  const itemsWithCoords = items.filter(item => item.lat && item.lng);

  if (itemsWithCoords.length === 0) return '';

  // Create a search query with place names
  const placeNames = itemsWithCoords
    .map(item => item.place_name)
    .filter(name => name)
    .join(' | ');

  // Use the first item's coordinates as the center point
  const centerLat = itemsWithCoords[0].lat!;
  const centerLng = itemsWithCoords[0].lng!;

  return `https://www.google.com/maps/search/${encodeURIComponent(placeNames)}/@${centerLat},${centerLng},13z`;
}

/**
 * Export all days of a trip to Google Maps URLs
 */
export async function exportTripToGoogleMaps(tripId: string): Promise<GoogleMapsExport[]> {
  // Fetch trip days
  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number');

  if (daysError) throw daysError;
  if (!days || days.length === 0) {
    throw new Error('No itinerary days found for this trip');
  }

  const exports: GoogleMapsExport[] = [];

  // For each day, fetch items and generate URL
  for (const day of days) {
    const { data: items, error: itemsError } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('day_id', day.id)
      .order('order_index');

    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      const url = generateDayDirectionsUrl(items);

      if (url) {
        exports.push({
          url,
          dayNumber: day.day_number,
          date: day.date,
          title: day.title
        });
      }
    }
  }

  return exports;
}

/**
 * Open Google Maps URL in a new tab
 */
export function openInGoogleMaps(url: string) {
  window.open(url, '_blank');
}
