import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Shield, 
  Ban, 
  CheckCircle,
  XCircle,
  Crown,
  Star,
  User
} from 'lucide-react';
import { ProfileService } from '../../services/profileService';
import { Database } from '../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.fetchProfiles({
      limit: 100,
      orderBy: 'created_at',
      order: 'desc'
    });
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setUsers(data || []);
    }
    
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: Profile['role']) => {
    setEditLoading(true);
    
    const { error } = await ProfileService.updateUserProfile(userId, { role: newRole });
    
    if (error) {
      alert('Failed to update user role: ' + error);
    } else {
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setShowEditModal(false);
      setSelectedUser(null);
    }
    
    setEditLoading(false);
  };

  const getRoleIcon = (role: Profile['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-error-600" />;
      case 'ambassador':
        return <Star className="h-4 w-4 text-accent-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-warning-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: Profile['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-700';
      case 'ambassador':
        return 'bg-accent-100 text-accent-700';
      case 'moderator':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            {filteredUsers.length} users
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="moderator">Moderators</option>
              <option value="ambassador">Ambassadors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.points.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.country || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been registered yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-slide-up">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User Role</h2>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name || 'No name'}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              {(['user', 'moderator', 'ambassador', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(selectedUser.id, role)}
                  disabled={editLoading}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedUser.role === role
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${editLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {getRoleIcon(role)}
                  <span className="font-medium text-gray-900 capitalize">{role}</span>
                  {selectedUser.role === role && (
                    <CheckCircle className="h-4 w-4 text-primary-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            {editLoading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Updating role...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};