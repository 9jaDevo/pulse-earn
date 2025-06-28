import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Image, 
  File, 
  Video, 
  AlertCircle, 
  Info, 
  X, 
  Save, 
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MarketingService } from '../../services/marketingService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import type { MarketingMaterial, MarketingMaterialCreateRequest } from '../../types/api';
import { supabase } from '../../lib/supabase';

interface MarketingMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  material?: MarketingMaterial | null;
}

const MarketingMaterialModal: React.FC<MarketingMaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  material
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    material_type: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    material_type: 'banner',
    is_active: true
  });
  
  const [materialTypes, setMaterialTypes] = useState<string[]>([
    'banner', 'social_template', 'flyer', 'video', 'presentation'
  ]);
  
  // Set form data when material changes
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        description: material.description || '',
        material_type: material.material_type,
        is_active: material.is_active
      });
    } else {
      // Reset form for new material
      setFormData({
        name: '',
        description: '',
        material_type: 'banner',
        is_active: true
      });
      setFile(null);
    }
  }, [material]);
  
  // Load material types from settings
  useEffect(() => {
    const fetchMaterialTypes = async () => {
      try {
        // First try to get distinct types from existing materials
        const { data: distinctTypes } = await MarketingService.getDistinctMaterialTypes();
        
        if (distinctTypes && distinctTypes.length > 0) {
          setMaterialTypes(distinctTypes);
          return;
        }
        
        // If no existing types, get default types from settings
        const { data: settings } = await supabase
          .from('app_settings')
          .select('settings')
          .eq('category', 'marketing')
          .single();
        
        if (settings?.settings?.default_material_types) {
          setMaterialTypes(settings.settings.default_material_types);
        }
      } catch (err) {
        console.error('Error fetching material types:', err);
      }
    };
    
    fetchMaterialTypes();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    // Validate form
    if (!formData.name.trim()) {
      errorToast('Material name is required');
      return;
    }
    
    if (!material && !file) {
      errorToast('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    
    try {
      if (material) {
        // Update existing material
        const { error } = await MarketingService.updateMaterial(
          user.id,
          material.id,
          {
            name: formData.name,
            description: formData.description || undefined,
            material_type: formData.material_type,
            is_active: formData.is_active
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Marketing material updated successfully');
      } else if (file) {
        // Create new material
        const fileType = file.type.split('/')[0]; // 'image', 'video', 'application', etc.
        
        const { error } = await MarketingService.uploadMaterial(
          user.id,
          file,
          {
            name: formData.name,
            description: formData.description || undefined,
            material_type: formData.material_type,
            file_type: fileType
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Marketing material uploaded successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving marketing material:', err);
      errorToast(err instanceof Error ? err.message : 'Failed to save marketing material');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? 'Edit Marketing Material' : 'Add Marketing Material'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter material name"
              required
            />
          </div>

          {/* Material Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide a description for this material"
              rows={3}
            />
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Type *
            </label>
            <select
              value={formData.material_type}
              onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload (only for new materials) */}
          {!material && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-primary-500" />
                      ) : file.type.startsWith('video/') ? (
                        <Video className="h-8 w-8 text-primary-500" />
                      ) : (
                        <File className="h-8 w-8 text-primary-500" />
                      )}
                    </div>
                    <p className="text-gray-700 font-medium">{file.name}</p>
                    <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-error-600 hover:text-error-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-gray-500">Drag and drop a file here, or click to select a file</p>
                    <p className="text-gray-400 text-sm">Supported formats: JPG, PNG, GIF, PDF, MP4</p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,application/pdf,video/mp4"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Status (only for editing) */}
          {material && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Material is active
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!material && !file)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{material ? 'Update Material' : 'Upload Material'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MarketingMaterialsManagement: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [isModuleEnabled, setIsModuleEnabled] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    fetchMaterials();
    checkModuleStatus();
  }, [currentPage, selectedType, searchTerm]);
  
  const checkModuleStatus = async () => {
    try {
      const { data, error } = await MarketingService.isMarketingModuleEnabled();
      
      if (error) {
        console.error('Error checking marketing module status:', error);
        return;
      }
      
      setIsModuleEnabled(data !== false);
    } catch (err) {
      console.error('Exception checking marketing module status:', err);
    }
  };
  
  const fetchMaterials = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offset based on current page and items per page
      const offset = (currentPage - 1) * itemsPerPage;
      
      const options: any = {
        limit: itemsPerPage,
        offset: offset
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
      setTotalItems(data?.totalCount || 0);
      
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
  
  const handleDeleteMaterial = async (materialId: string) => {
    if (!user) {
      errorToast('You must be logged in to delete materials');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this marketing material?')) {
      return;
    }
    
    try {
      const { error } = await MarketingService.deleteMaterial(user.id, materialId);
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast('Marketing material deleted successfully');
      fetchMaterials();
    } catch (err) {
      errorToast('Failed to delete marketing material');
      console.error(err);
    }
  };
  
  const handleToggleStatus = async (material: MarketingMaterial) => {
    if (!user) {
      errorToast('You must be logged in to update materials');
      return;
    }
    
    try {
      const { error } = await MarketingService.updateMaterial(
        user.id,
        material.id,
        { is_active: !material.is_active }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast(`Marketing material ${material.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchMaterials();
    } catch (err) {
      errorToast('Failed to update marketing material');
      console.error(err);
    }
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Marketing Module Disabled</h3>
        <p className="text-yellow-700 mb-4">
          The marketing materials module is currently disabled. Please enable it in the system settings.
        </p>
        <button
          onClick={() => window.location.href = '/admin?section=settings'}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Go to Settings
        </button>
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
        <button
          onClick={() => {
            setSelectedMaterial(null);
            setShowAddModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Material</span>
        </button>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Marketing Materials</h3>
          <p className="text-blue-700 text-sm">
            Marketing materials help ambassadors promote the platform. You can upload banners, social media templates, 
            flyers, videos, and presentations. These materials will be available to ambassadors to download and use 
            in their marketing efforts.
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when search changes
                }}
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
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
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setCurrentPage(1);
              fetchMaterials();
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 md:w-auto w-full justify-center"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
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
              : 'Add your first marketing material to help ambassadors promote the platform.'
            }
          </p>
          <button
            onClick={() => {
              setSelectedMaterial(null);
              setShowAddModal(true);
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add First Material
          </button>
        </div>
      )}
      
      {/* Materials Grid */}
      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`bg-white rounded-xl p-6 shadow-sm border ${
                material.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    material.is_active ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    {getFileTypeIcon(material.file_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{material.material_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMaterial(material);
                      setShowAddModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 p-1"
                    title="Edit Material"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(material)}
                    className="text-gray-600 hover:text-gray-900 p-1"
                    title={material.is_active ? 'Deactivate Material' : 'Activate Material'}
                  >
                    {material.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="text-error-600 hover:text-error-900 p-1"
                    title="Delete Material"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
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
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Added {new Date(material.created_at).toLocaleDateString()}</span>
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Add/Edit Material Modal */}
      {showAddModal && (
        <MarketingMaterialModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedMaterial(null);
          }}
          onSave={fetchMaterials}
          material={selectedMaterial}
        />
      )}
    </div>
  );
};