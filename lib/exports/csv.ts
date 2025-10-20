/**
 * CSV Export Utilities
 * Exports trip itinerary as CSV spreadsheet
 */

import { supabase } from '../supabase';
import { format, parseISO } from 'date-fns';

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';

  const str = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate and download trip itinerary as CSV
 */
export async function downloadTripCSV(tripId: string, tripName: string) {
  // Fetch trip data
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

  // CSV header
  const headers = [
    'Day Number',
    'Date',
    'Day Title',
    'Order',
    'Start Time',
    'End Time',
    'Place Name',
    'Type',
    'Address',
    'Latitude',
    'Longitude',
    'Place ID',
    'Estimated Cost',
    'Notes'
  ];

  const rows: string[][] = [headers];

  // Add data rows
  for (const day of days || []) {
    const items = (day as any).itinerary_items || [];
    const dateStr = format(parseISO(day.date), 'yyyy-MM-dd');
    const dayTitle = day.title || '';

    if (items.length === 0) {
      // Add empty row for day with no items
      rows.push([
        String(day.day_number),
        dateStr,
        dayTitle,
        '',
        '',
        '',
        '(No activities)',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    } else {
      for (const item of items) {
        rows.push([
          String(day.day_number),
          dateStr,
          dayTitle,
          String(item.order_index + 1),
          item.start_time || '',
          item.end_time || '',
          item.place_name || '',
          item.place_type || '',
          item.address || '',
          item.lat ? String(item.lat) : '',
          item.lng ? String(item.lng) : '',
          item.place_id || '',
          item.estimated_cost ? String(item.estimated_cost) : '',
          item.notes || ''
        ]);
      }
    }
  }

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(escapeCSVField).join(','))
    .join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
