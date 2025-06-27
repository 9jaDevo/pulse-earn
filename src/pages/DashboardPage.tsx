import React from 'react';
import { 
  TrendingUp, 
  Trophy, 
  Zap, 
  Calendar, 
  Users, 
  BarChart3, 
  Brain, 
  Gift,
  Star,
  Clock,
  Target,
  Award
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    {
      label: 'Total Points',
      value: '12,450',
      change: '+285',
      changeType: 'increase',
      icon: Zap,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Current Streak',
      value: '15 days',
      change: '+1',
      changeType: 'increase',
      icon: Calendar,
      color: 'from-success-500 to-success-600'
    },
    {
      label: 'Global Rank',
      value: '#247',
      change: '+12',
      changeType: 'increase',
      icon: Trophy,
      color: 'from-warning-500 to-warning-600'
    },
    {
      label: 'Level',
      value: 'Expert',
      change: '8,550/10,000 XP',
      changeType: 'neutral',
      icon: Star,
      color: 'from-primary-500 to-primary-600'
    }
  ];

  const recentActivities = [
    {
      type: 'poll',
      title: 'Voted in "Best Programming Language 2025"',
      points: 50,
      time: '2 hours ago',
      icon: BarChart3
    },
    {
      type: 'trivia',
      title: 'Completed Space Exploration Quiz',
      points: 150,
      time: '1 day ago',
      icon: Brain
    },
    {
      type: 'reward',
      title: 'Daily login bonus claimed',
      points: 25,
      time: '1 day ago',
      icon: Gift
    },
    {
      type: 'achievement',
      title: 'Earned "Quiz Master" badge',
      points: 100,
      time: '2 days ago',
      icon: Award
    }
  ];

  const achievements = [
    { name: 'First Vote', description: 'Participated in your first poll', completed: true },
    { name: 'Quiz Master', description: 'Scored 90%+ in 10 trivia games', completed: true },
    { name: 'Streak Keeper', description: 'Maintain a 30-day login streak', completed: false, progress: 50 },
    { name: 'Community Leader', description: 'Create 5 popular polls', completed: false, progress: 20 },
    { name: 'Trivia Champion', description: 'Win 100 trivia games', completed: false, progress: 75 },
    { name: 'Point Collector', description: 'Earn 50,000 total points', completed: false, progress: 25 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and manage your PulseEarn journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 mr-1 ${
                      stat.changeType === 'increase' ? 'text-success-500' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm ${
                      stat.changeType === 'increase' ? 'text-success-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <activity.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{activity.title}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-accent-600 font-semibold">+{activity.points}</span>
                      <p className="text-gray-500 text-xs">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Points Progress</h2>
              <div className="h-64 flex items-end justify-between space-x-2">
                {[320, 280, 450, 380, 520, 480, 600].map((height, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                      style={{ height: `${(height / 600) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Achievements</h2>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                      {achievement.completed ? (
                        <Award className="h-5 w-5 text-success-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    {!achievement.completed && achievement.progress && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white p-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Vote in Polls</span>
                </button>
                <button className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white p-3 rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all flex items-center justify-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Play Trivia</span>
                </button>
                <button className="w-full bg-gradient-to-r from-accent-600 to-accent-700 text-white p-3 rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all flex items-center justify-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Claim Rewards</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};