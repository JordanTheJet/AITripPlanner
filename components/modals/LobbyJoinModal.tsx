import { useState } from 'react';
import { useLobby } from '@/lib/stores/lobby-store';
import { closeModal } from '@/lib/modal-store';

export default function LobbyJoinModal() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinLobby } = useLobby();

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinLobby(inviteCode.trim());
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to join lobby');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Trip Planning Lobby</h2>

      <p className="text-gray-600 mb-4">
        Enter the invite code shared with you to join a collaborative trip planning session.
      </p>

      <input
        type="text"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
        placeholder="Enter invite code"
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        maxLength={8}
      />

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleJoin}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Lobby'}
        </button>
      </div>
    </div>
  );
}
