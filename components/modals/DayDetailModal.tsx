import { closeModal } from '@/lib/modal-store';
import { format } from 'date-fns';
import type { ItineraryDay, ItineraryItem } from '@/lib/supabase';

interface DayDetailModalProps {
  data: {
    day: ItineraryDay;
    items: ItineraryItem[];
  };
}

export default function DayDetailModal({ data }: DayDetailModalProps) {
  if (!data) return null;

  const { day, items } = data;

  const getPlaceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      restaurant: 'bg-orange-100 text-orange-800',
      activity: 'bg-blue-100 text-blue-800',
      accommodation: 'bg-purple-100 text-purple-800',
      transport: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Day {day.day_number}: {day.title || format(new Date(day.date), 'MMMM d')}
            </h2>
            <p className="text-gray-600 mt-1">{format(new Date(day.date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {day.notes && (
          <p className="mt-4 text-gray-700">{day.notes}</p>
        )}
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto p-6">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activities planned for this day yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.place_name}</h3>
                    {item.place_address && (
                      <p className="text-sm text-gray-500 mt-1">{item.place_address}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPlaceTypeColor(item.place_type)}`}>
                    {item.place_type}
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-gray-600">
                  {item.start_time && (
                    <div>
                      <span className="font-medium">Start:</span> {item.start_time}
                    </div>
                  )}
                  {item.end_time && (
                    <div>
                      <span className="font-medium">End:</span> {item.end_time}
                    </div>
                  )}
                </div>

                {item.notes && (
                  <p className="mt-2 text-sm text-gray-700">{item.notes}</p>
                )}

                {item.lat && item.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 flex justify-end">
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
