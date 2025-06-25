import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, Globe, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Poll } from '../../types/api';

interface PollAnalyticsProps {
  poll: Poll;
}

interface VoteDistribution {
  date: string;
  count: number;
}

interface VoterDemographics {
  country: string;
  count: number;
}

export const PollAnalytics: React.FC<PollAnalyticsProps> = ({ poll }) => {
  const [voteDistribution, setVoteDistribution] = useState<VoteDistribution[]>([]);
  const [voterDemographics, setVoterDemographics] = useState<VoterDemographics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAnalytics();
  }, [poll.id]);
  
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch vote distribution over time
      const { data: voteData, error: voteError } = await supabase
        .from('poll_votes')
        .select('created_at')
        .eq('poll_id', poll.id)
        .order('created_at', { ascending: true });
      
      if (voteError) {
        setError(voteError.message);
        return;
      }
      
      // Group votes by date
      const votesMap = new Map<string, number>();
      
      (voteData || []).forEach(vote => {
        const date = new Date(vote.created_at).toISOString().split('T')[0];
        votesMap.set(date, (votesMap.get(date) || 0) + 1);
      });
      
      // Convert to array for chart
      const distribution = Array.from(votesMap.entries()).map(([date, count]) => ({
        date,
        count
      }));
      
      setVoteDistribution(distribution);
      
      // Fetch voter demographics (countries)
      const { data: voterData, error: voterError } = await supabase
        .from('poll_votes')
        .select(`
          profiles:user_id (
            country
          )
        `)
        .eq('poll_id', poll.id);
      
      if (voterError) {
        setError(voterError.message);
        return;
      }
      
      // Group voters by country
      const countriesMap = new Map<string, number>();
      
      (voterData || []).forEach(vote => {
        const country = vote.profiles?.country || 'Unknown';
        countriesMap.set(country, (countriesMap.get(country) || 0) + 1);
      });
      
      // Convert to array for chart
      const demographics = Array.from(countriesMap.entries())
        .map(([country, count]) => ({
          country,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 countries
      
      setVoterDemographics(demographics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }
  
  // Calculate the maximum vote count for scaling
  const maxVotes = Math.max(...voteDistribution.map(d => d.count), 1);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
        Poll Analytics
      </h2>
      
      {/* Vote Distribution Over Time */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h3>
        
        {voteDistribution.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No vote data available yet</p>
          </div>
        ) : (
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {voteDistribution.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md transition-all duration-500 hover:from-primary-600 hover:to-primary-500 relative group"
                    style={{ height: `${(data.count / maxVotes) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.count} votes
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Voter Demographics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voter Demographics</h3>
        
        {voterDemographics.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No demographic data available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {voterDemographics.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{data.country || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                      style={{ width: `${(data.count / poll.total_votes) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {data.count} ({Math.round((data.count / poll.total_votes) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary-600 mr-2" />
              <span className="text-gray-700 font-medium">Total Votes</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{poll.total_votes}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-secondary-600 mr-2" />
              <span className="text-gray-700 font-medium">Created</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {new Date(poll.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {poll.type === 'global' ? (
                <Globe className="h-5 w-5 text-accent-600 mr-2" />
              ) : (
                <MapPin className="h-5 w-5 text-accent-600 mr-2" />
              )}
              <span className="text-gray-700 font-medium">Type</span>
            </div>
            <span className="text-xl font-bold text-gray-900 capitalize">
              {poll.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};