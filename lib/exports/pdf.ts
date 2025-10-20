/**
 * PDF Export Utilities
 * Generates printable PDF documents for trip itineraries
 */

import { supabase, type Trip } from '../supabase';
import { format, parseISO } from 'date-fns';

/**
 * Generate and download a PDF itinerary
 * Uses jsPDF library for PDF generation
 */
export async function downloadTripPDF(tripId: string, tripName: string) {
  // Dynamically import jsPDF to avoid bundling issues
  const { default: jsPDF } = await import('jspdf');

  // Fetch trip data
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');

  // Fetch days and items
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

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Cover Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(trip.name, pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(trip.destination, pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(12);
  const dateRange = `${format(parseISO(trip.start_date), 'MMM d, yyyy')} - ${format(parseISO(trip.end_date), 'MMM d, yyyy')}`;
  doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });

  if (budget) {
    yPos += 10;
    doc.text(`Budget: $${budget.total_budget} ${budget.currency}`, pageWidth / 2, yPos, { align: 'center' });
  }

  // Add days and itinerary
  yPos += 30;

  for (const day of days || []) {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Day header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const dayTitle = day.title || `Day ${day.day_number}`;
    doc.text(dayTitle, margin, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(format(parseISO(day.date), 'EEEE, MMMM d, yyyy'), margin, yPos);

    yPos += 10;

    // Day items
    const items = (day as any).itinerary_items || [];

    for (const item of items) {
      // Check page space
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');

      let itemText = `${item.order_index + 1}. ${item.place_name}`;
      if (item.start_time) {
        itemText = `${item.start_time} - ${itemText}`;
      }

      doc.text(itemText, margin + 5, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (item.address) {
        const addressLines = doc.splitTextToSize(item.address, pageWidth - margin * 2 - 10);
        doc.text(addressLines, margin + 5, yPos);
        yPos += addressLines.length * 5;
      }

      if (item.notes) {
        const notesLines = doc.splitTextToSize(item.notes, pageWidth - margin * 2 - 10);
        doc.text(notesLines, margin + 5, yPos);
        yPos += notesLines.length * 5;
      }

      yPos += 5;
    }

    yPos += 10;
  }

  // Budget page
  if (budget && budget.breakdown) {
    doc.addPage();
    yPos = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget Breakdown', margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const breakdown = budget.breakdown as any;
    doc.text(`Accommodation: $${breakdown.accommodation || 0}`, margin, yPos);
    yPos += 8;
    doc.text(`Transportation: $${breakdown.transportation || 0}`, margin, yPos);
    yPos += 8;
    doc.text(`Food: $${breakdown.food || 0}`, margin, yPos);
    yPos += 8;
    doc.text(`Activities: $${breakdown.activities || 0}`, margin, yPos);
    yPos += 8;
    doc.text(`Other: $${breakdown.other || 0}`, margin, yPos);
    yPos += 15;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Budget: $${budget.total_budget}`, margin, yPos);

    if (budget.actual_spent) {
      yPos += 8;
      doc.text(`Spent: $${budget.actual_spent}`, margin, yPos);
      yPos += 8;
      doc.text(`Remaining: $${budget.total_budget - budget.actual_spent}`, margin, yPos);
    }
  }

  // Save PDF
  const fileName = `${tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.pdf`;
  doc.save(fileName);
}
