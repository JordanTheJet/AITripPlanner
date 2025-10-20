import { useState } from 'react';
import { useLobby } from '@/lib/stores/lobby-store';
import { closeModal } from '@/lib/modal-store';

export default function LobbyCreateModal() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const { createLobby } = useLobby();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a lobby name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lobby = await createLobby(name.trim(), description.trim() || undefined);
      setCreatedCode(lobby.invite_code);
    } catch (err: any) {
      setError(err.message || 'Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  if (createdCode) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lobby Created!</h2>

        <p className="text-gray-600 mb-4">
          Share this invite code with others to let them join your trip planning session:
        </p>

        <div className="bg-gray-100 p-4 rounded text-center mb-4">
          <code className="text-3xl font-bold text-blue-600">{createdCode}</code>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(createdCode);
            alert('Invite code copied!');
          }}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mb-2"
        >
          Copy Invite Code
        </button>

        <button
          onClick={closeModal}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Planning
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Trip Planning Lobby</h2>

      <p className="text-gray-600 mb-4">
        Create a collaborative space where you and others can plan a trip together.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lobby Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Europe Summer 2025"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your trip plans..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
          onClick={handleCreate}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Lobby'}
        </button>
      </div>
    </div>
  );
}
