import { useTrip } from '@/lib/stores/trip-store';
import { closeModal, openModal } from '@/lib/modal-store';
import { format } from 'date-fns';

export default function TripOverviewModal() {
  const { currentTrip, days, items, budget } = useTrip();

  if (!currentTrip) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">No Active Trip</h2>
        <p>Create a trip by chatting with the AI!</p>
        <button
          onClick={closeModal}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    );
  }

  const totalDays = days.length;
  const totalActivities = Object.values(items).reduce((sum, dayItems) => sum + dayItems.length, 0);

  return (
    <div className="bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{currentTrip.name}</h2>
            <p className="text-gray-600 mt-1">{currentTrip.destination}</p>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(currentTrip.start_date), 'MMM d, yyyy')} - {format(new Date(currentTrip.end_date), 'MMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalDays}</div>
            <div className="text-sm text-gray-600">Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalActivities}</div>
            <div className="text-sm text-gray-600">Activities</div>
          </div>
          {budget && (
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${budget.total_budget}</div>
              <div className="text-sm text-gray-600">Budget</div>
            </div>
          )}
        </div>

        {/* Budget Breakdown */}
        {budget && (
          <button
            onClick={() => openModal('budget-tracker')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            View Budget Breakdown →
          </button>
        )}
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto p-6">
        {days.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No days added yet. Ask the AI to plan your itinerary!</p>
        ) : (
          <div className="space-y-6">
            {days.map((day) => {
              const dayItems = items[day.id] || [];
              return (
                <div
                  key={day.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => openModal('day-detail', { day, items: dayItems })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Day {day.day_number}: {day.title || format(new Date(day.date), 'MMMM d')}
                      </h3>
                      <p className="text-sm text-gray-500">{format(new Date(day.date), 'EEEE, MMM d, yyyy')}</p>
                    </div>
                    <span className="text-sm text-gray-400">{dayItems.length} activities</span>
                  </div>

                  {day.notes && (
                    <p className="text-sm text-gray-600 mb-3">{day.notes}</p>
                  )}

                  {/* Activity Preview */}
                  {dayItems.length > 0 && (
                    <div className="space-y-2">
                      {dayItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400">{item.start_time || '–'}</span>
                          <span className="font-medium">{item.place_name}</span>
                          <span className="text-gray-400">({item.place_type})</span>
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <p className="text-sm text-gray-400">+ {dayItems.length - 3} more activities</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
        <button
          onClick={closeModal}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          Close
        </button>
        <button
          onClick={() => {
            // TODO: Implement export
            alert('Export functionality coming soon!');
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export Trip
        </button>
      </div>
    </div>
  );
}
