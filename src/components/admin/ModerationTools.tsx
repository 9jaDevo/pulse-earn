import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Flag,
  Clock,
  User,
  MessageSquare,
  BarChart3,
  FileText
} from 'lucide-react';
import { ModerationService } from '../../services/moderationService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import type { ContentReport } from '../../types/api';

interface ReportDetailModalProps {
  report: ContentReport;
  onClose: () => void;
  onStatusUpdate: (status: 'reviewed' | 'resolved' | 'rejected', notes?: string) => Promise<void>;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose, onStatusUpdate }) => {
  const [notes, setNotes] = useState(report.resolution_notes || '');
  const [loading, setLoading] = useState(false);
  
  const handleUpdateStatus = async (status: 'reviewed' | 'resolved' | 'rejected') => {
    setLoading(true);
    await onStatusUpdate(status, notes);
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Report Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Report ID</h3>
            <p className="text-gray-900">{report.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              report.status === 'pending' ? 'bg-warning-100 text-warning-700' :
              report.status === 'reviewed' ? 'bg-primary-100 text-primary-700' :
              report.status === 'resolved' ? 'bg-success-100 text-success-700' :
              'bg-error-100 text-error-700'
            }`}>
              {report.status}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Content Type</h3>
            <p className="text-gray-900 capitalize">{report.content_type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Content ID</h3>
            <p className="text-gray-900">{report.content_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Reported By</h3>
            <p className="text-gray-900">{report.reporter?.name || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Reported On</h3>
            <p className="text-gray-900">{new Date(report.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Reason</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900">{report.reason}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Moderation Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add notes about this report..."
            rows={3}
          />
        </div>
        
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={() => handleUpdateStatus('reviewed')}
            disabled={loading || report.status === 'reviewed'}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Mark as Reviewed
          </button>
          
          <button
            onClick={() => handleUpdateStatus('rejected')}
            disabled={loading || report.status === 'rejected'}
            className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
          >
            Reject Report
          </button>
          
          <button
            onClick={() => handleUpdateStatus('resolved')}
            disabled={loading || report.status === 'resolved'}
            className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
          >
            Resolve Report
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModerationTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'actions' | 'queue'>('reports');
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { successToast, errorToast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  useEffect(() => {
    fetchReports();
  }, [statusFilter, currentPage, itemsPerPage]);
  
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offset based on current page and items per page
      const offset = (currentPage - 1) * itemsPerPage;
      
      const { data, error: fetchError } = await ModerationService.getContentReports({
        status: statusFilter as any,
        limit: itemsPerPage,
        offset: offset
      });
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setReports(data || []);
      
      // Get total count for pagination
      // In a real implementation, this would be returned from the API
      // For now, we'll simulate it with a separate query
      const { count } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', statusFilter);
      
      setTotalItems(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateReportStatus = async (reportId: string, status: 'reviewed' | 'resolved' | 'rejected', notes?: string) => {
    if (!reportId) return;
    
    try {
      const { data, error } = await ModerationService.updateReportStatus(
        // @ts-ignore - We know user.id exists in this context
        user.id,
        reportId,
        status,
        notes
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast(`Report marked as ${status}`);
        setSelectedReport(null);
        fetchReports();
      }
    } catch (err) {
      errorToast('Failed to update report status');
    }
  };

  const moderatorActions = [
    {
      id: '1',
      moderator: 'admin@email.com',
      action: 'Poll Removed',
      target: 'Inappropriate Content Poll',
      reason: 'Violated community guidelines',
      timestamp: '2025-01-18T11:00:00Z'
    },
    {
      id: '2',
      moderator: 'mod1@email.com',
      action: 'User Warned',
      target: 'user456@email.com',
      reason: 'Spam posting',
      timestamp: '2025-01-18T10:45:00Z'
    }
  ];

  const reviewQueue = [
    {
      id: '1',
      type: 'poll',
      title: 'Climate Change Solutions',
      content: 'What do you think is the most effective solution to climate change?',
      author: 'enviro_user@email.com',
      created: '2025-01-18T12:00:00Z',
      status: 'pending'
    },
    {
      id: '2',
      type: 'trivia',
      title: 'Geography Question',
      content: 'What is the capital of Australia?',
      author: 'quiz_master@email.com',
      created: '2025-01-18T11:30:00Z',
      status: 'pending'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-700';
      case 'medium':
        return 'bg-warning-100 text-warning-700';
      case 'low':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'reviewed':
        return 'bg-primary-100 text-primary-700';
      case 'resolved':
        return 'bg-success-100 text-success-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Content Reports</h2>
        <div className="flex space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when items per page changes
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      ) : error ? (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Flag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">
            There are no {statusFilter} reports to review at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.content_type === 'poll' ? 'Poll Report' : 'Comment Report'}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">{report.reason}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {report.content_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                        {report.content_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              className="text-success-600 hover:text-success-900"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'rejected')}
                              className="text-error-600 hover:text-error-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );

  const renderActions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Moderator Actions</h2>
        <div className="text-sm text-gray-500">
          Last 24 hours: {moderatorActions.length} actions
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {moderatorActions.map((action) => (
              <div key={action.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{action.action}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(action.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Target:</span> {action.target}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {action.reason}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Moderator:</span> {action.moderator}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderQueue = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Review Queue</h2>
        <div className="text-sm text-gray-500">
          {reviewQueue.length} items pending review
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reviewQueue.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.type === 'poll' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'
                }`}>
                  {item.type}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-700">
                  {item.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="text-success-600 hover:text-success-900">
                  <CheckCircle className="h-5 w-5" />
                </button>
                <button className="text-error-600 hover:text-error-900">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.content}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{item.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(item.created).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Moderation Tools</h1>
        <p className="text-gray-600">Review reports, manage content, and maintain community standards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-warning-100 p-3 rounded-lg">
              <Flag className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Review Queue</p>
              <p className="text-2xl font-bold text-gray-900">{reviewQueue.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-success-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-error-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'reports', label: 'Reports', icon: Flag },
            { key: 'actions', label: 'Actions', icon: Shield },
            { key: 'queue', label: 'Review Queue', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'actions' && renderActions()}
      {activeTab === 'queue' && renderQueue()}
      
      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusUpdate={async (status, notes) => {
            await handleUpdateReportStatus(selectedReport.id, status, notes);
          }}
        />
      )}
    </div>
  );
};