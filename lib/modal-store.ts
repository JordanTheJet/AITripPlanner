import { create } from 'zustand';

export type ModalType =
  | 'trip-overview'
  | 'day-detail'
  | 'activity-detail'
  | 'budget-tracker'
  | 'lobby-join'
  | 'lobby-create'
  | null;

interface ModalState {
  activeModal: ModalType;
  modalData: any;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
  activeModal: null,
  modalData: null,

  openModal: (type, data) => {
    set({ activeModal: type, modalData: data });
  },

  closeModal: () => {
    set({ activeModal: null, modalData: null });
  }
}));

// Export convenience functions
export const openModal = (type: ModalType, data?: any) => {
  useModal.getState().openModal(type, data);
};

export const closeModal = () => {
  useModal.getState().closeModal();
};
