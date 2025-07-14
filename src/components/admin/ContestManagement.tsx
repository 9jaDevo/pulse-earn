import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Trophy, Users, Play, Edit, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface Contest {
  id: string;
  title: string;
  description: string;
  entry_fee: number;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'enrolling' | 'active' | 'ended' | 'disbursed' | 'cancelled';
  prize_pool_amount: number;
  prize_pool_currency: string;
  num_winners: number;
  payout_structure: Array<{ rank: number; percentage: number }>;
  trivia_game_id: string;
  trivia_game?: {
    title: string;
  };
  created_at: string;
  enrollment_count?: number;
}

interface TriviaGame {
  id: string;
  title: string;
}

export function ContestManagement() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [triviaGames, setTriviaGames] = useState<TriviaGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_fee: 0,
    start_time: '',
    end_time: '',
    prize_pool_amount: 0,
    prize_pool_currency: 'USD',
    num_winners: 3,
    payout_structure: [
      { rank: 1, percentage: 50 },
      { rank: 2, percentage: 30 },
      { rank: 3, percentage: 20 }
    ],
    trivia_game_id: ''
  });
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchContests();
    fetchTriviaGames();
  }, []);

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from('trivia_contests')
        .select(`
          *,
          trivia_game:trivia_games(title),
          contest_enrollments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contestsWithCounts = data?.map(contest => ({
        ...contest,
        enrollment_count: contest.contest_enrollments?.[0]?.count || 0
      })) || [];

      setContests(contestsWithCounts);
    } catch (error) {
      console.error('Error fetching contests:', error);
      showToast('Failed to fetch contests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTriviaGames = async () => {
    try {
      const { data, error } = await supabase
        .from('trivia_games')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setTriviaGames(data || []);
    } catch (error) {
      console.error('Error fetching trivia games:', error);
    }
  };

  const handleCreateContest = () => {
    setEditingContest(null);
    setFormData({
      title: '',
      description: '',
      entry_fee: 0,
      start_time: '',
      end_time: '',
      prize_pool_amount: 0,
      prize_pool_currency: 'USD',
      num_winners: 3,
      payout_structure: [
        { rank: 1, percentage: 50 },
        { rank: 2, percentage: 30 },
        { rank: 3, percentage: 20 }
      ],
      trivia_game_id: ''
    });
    setShowCreateModal(true);
  };

  const handleEditContest = (contest: Contest) => {
    setEditingContest(contest);
    setFormData({
      title: contest.title,
      description: contest.description,
      entry_fee: contest.entry_fee,
      start_time: new Date(contest.start_time).toISOString().slice(0, 16),
      end_time: new Date(contest.end_time).toISOString().slice(0, 16),
      prize_pool_amount: contest.prize_pool_amount,
      prize_pool_currency: contest.prize_pool_currency,
      num_winners: contest.num_winners,
      payout_structure: contest.payout_structure,
      trivia_game_id: contest.trivia_game_id
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contestData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (editingContest) {
        const { error } = await supabase
          .from('trivia_contests')
          .update(contestData)
          .eq('id', editingContest.id);

        if (error) throw error;
        showToast('Contest updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('trivia_contests')
          .insert([contestData]);

        if (error) throw error;
        showToast('Contest created successfully!', 'success');
      }

      setShowCreateModal(false);
      fetchContests();
    } catch (error) {
      console.error('Error saving contest:', error);
      showToast('Failed to save contest', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (contestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('disburse_contest_prizes', {
        p_admin_id: user.id,
        p_contest_id: contestId
      });

      if (error) throw error;

      showToast('Prizes disbursed successfully!', 'success');
      fetchContests();
    } catch (error) {
      console.error('Error disbursing prizes:', error);
      showToast('Failed to disburse prizes', 'error');
    }
  };

  const getStatusColor = (status: Contest['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'enrolling': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-orange-100 text-orange-800';
      case 'disbursed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contest Management</h2>
        <button
          onClick={handleCreateContest}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Contest
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prize Pool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contests.map((contest) => (
                <tr key={contest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contest.title}</div>
                      <div className="text-sm text-gray-500">{contest.trivia_game?.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contest.status)}`}>
                      {contest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contest.entry_fee} points
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contest.prize_pool_currency} {contest.prize_pool_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(contest.start_time)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(contest.end_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {contest.enrollment_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedContest(contest)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditContest(contest)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {contest.status === 'ended' && (
                      <button
                        onClick={() => handleDisburse(contest.id)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      >
                        <Trophy className="w-4 h-4" />
                        Disburse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {contests.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contests</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new contest.</p>
        </div>
      )}

      {/* Create/Edit Contest Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingContest ? 'Edit Contest' : 'Create New Contest'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contest Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Fee (Points)
                    </label>
                    <input
                      type="number"
                      value={formData.entry_fee}
                      onChange={(e) => setFormData({ ...formData, entry_fee: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prize Pool Amount ($)
                    </label>
                    <input
                      type="number"
                      value={formData.prize_pool_amount}
                      onChange={(e) => setFormData({ ...formData, prize_pool_amount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trivia Game
                  </label>
                  <select
                    value={formData.trivia_game_id}
                    onChange={(e) => setFormData({ ...formData, trivia_game_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a trivia game</option>
                    {triviaGames.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Winners
                  </label>
                  <input
                    type="number"
                    value={formData.num_winners}
                    onChange={(e) => setFormData({ ...formData, num_winners: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : editingContest ? 'Update Contest' : 'Create Contest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}