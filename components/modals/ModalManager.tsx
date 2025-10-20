import { useModal } from '@/lib/modal-store';
import TripOverviewModal from './TripOverviewModal';
import DayDetailModal from './DayDetailModal';
import BudgetTrackerModal from './BudgetTrackerModal';
import LobbyJoinModal from './LobbyJoinModal';
import LobbyCreateModal from './LobbyCreateModal';

export default function ModalManager() {
  const { activeModal, modalData, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeModal}
      />

      {/* Modal Content */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-auto">
        {activeModal === 'trip-overview' && <TripOverviewModal />}
        {activeModal === 'day-detail' && <DayDetailModal data={modalData} />}
        {activeModal === 'budget-tracker' && <BudgetTrackerModal />}
        {activeModal === 'lobby-join' && <LobbyJoinModal />}
        {activeModal === 'lobby-create' && <LobbyCreateModal />}
      </div>
    </div>
  );
}
