import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { PollService } from '../../services/pollService';
import type { PollCategory } from '../../types/api';

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category?: PollCategory | null;
}

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    is_active: true
  });

  // Set form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active
      });
    } else {
      // Reset form for new category
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      errorToast('Category name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      if (category) {
        // Update existing category
        const { error } = await PollService.updatePollCategory(
          category.id,
          {
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Category updated successfully');
      } else {
        // Create new category
        const { error } = await PollService.createPollCategory(
          formData.name.trim(),
          formData.description.trim() || undefined
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Category created successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      errorToast('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Tag className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? 'Edit Category' : 'Create Category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter category name"
              required
            />
          </div>

          {/* Category Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide a description for this category"
              rows={3}
            />
          </div>

          {/* Active Status */}
          {category && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Category is active
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
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};