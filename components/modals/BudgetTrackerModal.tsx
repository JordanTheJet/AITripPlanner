import { useTrip } from '@/lib/stores/trip-store';
import { closeModal } from '@/lib/modal-store';

export default function BudgetTrackerModal() {
  const { budget, currentTrip } = useTrip();

  if (!budget || !currentTrip) return null;

  const breakdown = budget.breakdown;
  const totalAllocated = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const remaining = budget.total_budget - totalAllocated;

  const categories = [
    { key: 'accommodation', label: 'Accommodation', color: 'bg-purple-500' },
    { key: 'transportation', label: 'Transportation', color: 'bg-green-500' },
    { key: 'food', label: 'Food', color: 'bg-orange-500' },
    { key: 'activities', label: 'Activities', color: 'bg-blue-500' },
    { key: 'other', label: 'Other', color: 'bg-gray-500' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Budget Tracker</h2>
        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">
          ×
        </button>
      </div>

      {/* Total Budget */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total Budget</span>
          <span className="text-2xl font-bold text-gray-900">${budget.total_budget.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Allocated</span>
          <span className="text-lg font-semibold text-gray-700">${totalAllocated.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-600">Remaining</span>
          <span className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {categories.map(({ key, label, color }) => {
          const amount = breakdown[key as keyof typeof breakdown];
          const percentage = budget.total_budget > 0 ? (amount / budget.total_budget) * 100 : 0;

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-semibold text-gray-900">${amount.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of budget</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
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
