import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Image, 
  File, 
  Video, 
  AlertCircle, 
  Info, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MarketingService } from '../../services/marketingService';
import { useToast } from '../../hooks/useToast';
import { useSettings } from '../../contexts/SettingsContext';
import type { MarketingMaterial } from '../../types/api';

export const MarketingMaterialsSection: React.FC = () => {
  const { user } = useAuth();
  const { generalSettings } = useSettings();
  const { errorToast } = useToast();
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [isModuleEnabled, setIsModuleEnabled] = useState(true);
  
  useEffect(() => {
    // Check if marketing module is enabled in settings
    setIsModuleEnabled(generalSettings.marketingEnabled !== false);
    
    if (user && generalSettings.marketingEnabled !== false) {
      fetchMaterials();
    }
  }, [user, generalSettings.marketingEnabled]);
  
  const fetchMaterials = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const options: any = {
        isActive: true,
        limit: 100 // Get all active materials
      };
      
      if (selectedType !== 'all') {
        options.materialType = selectedType;
      }
      
      if (searchTerm) {
        options.searchTerm = searchTerm;
      }
      
      const { data, error: fetchError } = await MarketingService.getMaterials(options);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setMaterials(data?.materials || []);
      
      // Get distinct material types for filter
      const { data: types } = await MarketingService.getDistinctMaterialTypes();
      if (types && types.length > 0) {
        setMaterialTypes(types);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketing materials');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchMaterials();
  };
  
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5 text-primary-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-secondary-600" />;
      case 'application':
        return <FileText className="h-5 w-5 text-accent-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };
  
  if (!isModuleEnabled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Marketing Materials Unavailable</h3>
        <p className="text-gray-600">
          The marketing materials feature is currently disabled. Please contact the administrator for more information.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <FileText className="h-6 w-6 mr-3 text-primary-600" />
          Marketing Materials
        </h2>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">Promote Effectively</h3>
          <p className="text-blue-700 text-sm">
            Use these marketing materials to promote the platform on social media, your website, or other channels.
            Download and share these assets to attract new users and earn more commissions.
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleSearch}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 md:w-auto w-full justify-center"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketing materials...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && materials.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No marketing materials found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No marketing materials are available yet. Check back later.'
            }
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              fetchMaterials();
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      )}
      
      {/* Materials Grid */}
      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    {getFileTypeIcon(material.file_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{material.material_type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
              
              {material.description && (
                <p className="text-gray-600 text-sm mb-4">{material.description}</p>
              )}
              
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {material.file_type === 'image' ? (
                  <img 
                    src={material.file_url} 
                    alt={material.name} 
                    className="w-full h-full object-contain"
                  />
                ) : material.file_type === 'video' ? (
                  <video 
                    src={material.file_url} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Added {new Date(material.created_at).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View</span>
                  </a>
                  <a
                    href={material.file_url}
                    download
                    className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};