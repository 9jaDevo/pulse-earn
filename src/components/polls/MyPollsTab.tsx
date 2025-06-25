// src/components/polls/MyPollsTab.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePolls } from '../../hooks/usePolls'
import { useToast } from '../../hooks/useToast'
import { PollService } from '../../services/pollService'
import type { Poll } from '../../types/api'

export const MyPollsTab: React.FC = () => {
  const { user } = useAuth()
  const { polls, loading, error, refetch } = usePolls(user?.id)
  const { errorToast, successToast } = useToast()

  const [subTab, setSubTab] = useState<'created'|'voted'>('created')
  const [status, setStatus] = useState<'all'|'active'|'inactive'|'expired'>('all')
  const [sortField, setSortField] = useState<'created_at'|'total_votes'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')

  // restore + refetch
  const handleRestore = async (pollId: string) => {
    if (!user) return
    const res = await PollService.restorePoll(user.id, pollId)
    if (res.data) {
      successToast('Restored')
      refetch()
    } else {
      errorToast(res.error || 'Restore failed')
    }
  }

  // slice out created vs voted
  const created = polls.filter(p => p.created_by === user?.id)
  const voted   = polls.filter(p => p.hasVoted && p.created_by !== user?.id)
  const list    = subTab === 'created' ? created : voted

  // apply status + sort
  const filtered = list
    .filter(poll => {
      if (status === 'all') return true
      const now = Date.now()
      const start = poll.start_date ? Date.parse(poll.start_date) : -Infinity
      const end   = poll.active_until ? Date.parse(poll.active_until) : Infinity
      if (status === 'active')   return poll.is_active && start <= now && end > now
      if (status === 'inactive') return !poll.is_active
      if (status === 'expired')  return poll.is_active && end <= now
      return true
    })
    .sort((a, b) => {
      if (sortField === 'created_at') {
        return sortOrder === 'asc'
          ? Date.parse(a.created_at) - Date.parse(b.created_at)
          : Date.parse(b.created_at) - Date.parse(a.created_at)
      }
      return sortOrder === 'asc'
        ? a.total_votes - b.total_votes
        : b.total_votes - a.total_votes
    })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p>Loading your polls…</p>
      </div>
    )
  }
  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex border-b">
        {(['created','voted'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`py-3 px-4 border-b-2 ${
              subTab === tab
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'created'
              ? `You Created (${created.length})`
              : `You Voted (${voted.length})`}
          </button>
        ))}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <label>
          Status
          <select
            className="ml-2 p-2 border rounded"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Archived</option>
            <option value="expired">Expired</option>
          </select>
        </label>

        <label className="flex items-center">
          Sort by
          <button
            onClick={() => {
              if (sortField === 'created_at') {
                setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))
              } else {
                setSortField('created_at')
                setSortOrder('desc')
              }
            }}
            className={`ml-2 p-2 border rounded ${
              sortField === 'created_at' ? 'bg-primary-50 border-primary-500' : ''
            }`}
          >
            <Clock className="inline h-4 w-4" /> Date
            {sortField === 'created_at'
              ? sortOrder === 'asc' ? <ArrowUp/> : <ArrowDown/>
              : null}
          </button>
          <button
            onClick={() => {
              if (sortField === 'total_votes') {
                setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))
              } else {
                setSortField('total_votes')
                setSortOrder('desc')
              }
            }}
            className={`ml-2 p-2 border rounded ${
              sortField === 'total_votes' ? 'bg-primary-50 border-primary-500' : ''
            }`}
          >
            <Users className="inline h-4 w-4" /> Votes
            {sortField === 'total_votes'
              ? sortOrder === 'asc' ? <ArrowUp/> : <ArrowDown/>
              : null}
          </button>
        </label>

        <button
          onClick={() => {
            refetch()
            successToast('Refreshed')
          }}
          className="ml-auto p-2 border rounded hover:bg-gray-50 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </button>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg mb-2">
            {subTab === 'created'
              ? "You haven't created any polls."
              : "You haven't voted on any polls."}
          </h3>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map(poll => (
          <div
            key={poll.id}
            className={`p-4 bg-white rounded-lg shadow-sm border ${
              poll.is_active ? 'hover:shadow-md' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex justify-between">
              <div>
                <Link
                  to={`/polls/${poll.slug}`}
                  className="text-lg font-semibold hover:text-primary-600"
                >
                  {poll.title}
                </Link>
                <div className="flex gap-2 text-sm text-gray-500 mt-1">
                  <span>
                    <Users className="inline h-4 w-4" /> {poll.total_votes} votes
                  </span>
                  <span>
                    <Clock className="inline h-4 w-4" /> {poll.timeLeft}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/polls/${poll.slug}`} title="View">
                  <Eye className="h-5 w-5 text-primary-600" />
                </Link>
                {subTab === 'created' && (
                  <>
                    <Link to={`/polls/${poll.slug}`} title="Edit">
                      <Edit className="h-5 w-5" />
                    </Link>
                    {!poll.is_active ? (
                      <button
                        onClick={() => handleRestore(poll.id)}
                        title="Restore"
                      >
                        <RefreshCw className="h-5 w-5 text-green-600" />
                      </button>
                    ) : (
                      <Trash2
                        className="h-5 w-5 text-red-600"
                        title="Archive (use poll detail)"
                      />
                    )}
                  </>
                )}
                {subTab === 'voted' && poll.hasVoted && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
