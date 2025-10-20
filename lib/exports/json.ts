/**
 * JSON Export Utilities
 * Exports complete trip data as structured JSON
 */

import { supabase } from '../supabase';

/**
 * Generate and download complete trip data as JSON
 */
export async function downloadTripJSON(tripId: string, tripName: string) {
  // Fetch complete trip data
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');

  // Fetch days with items
  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('*, itinerary_items(*)')
    .eq('trip_id', tripId)
    .order('day_number');

  if (daysError) throw daysError;

  // Fetch budget
  const { data: budget } = await supabase
    .from('trip_budgets')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  // Build complete trip object
  const exportData = {
    trip: {
      ...trip,
      days: days || [],
      budget: budget || null
    },
    exported_at: new Date().toISOString(),
    version: '1.0'
  };

  // Create JSON string
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-data.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
