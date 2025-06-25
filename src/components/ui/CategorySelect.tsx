import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Tag, Check, Plus } from 'lucide-react';
import { PollService } from '../../services/pollService';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  allowNew?: boolean;
  onCreateCategory?: (category: string) => Promise<void>;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'Select a category',
  className = '',
  disabled = false,
  required = false,
  allowNew = true,
  onCreateCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<string[]>(categories);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [newCategory, setNewCategory] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      setNewCategory('');
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = categories.filter(category => 
      category.toLowerCase().includes(query)
    );
    
    setFilteredCategories(filtered);
    
    // If no exact match and allowNew is true, set newCategory
    const hasExactMatch = filtered.some(cat => 
      cat.toLowerCase() === query
    );
    
    if (!hasExactMatch && allowNew && searchQuery.trim()) {
      setNewCategory(searchQuery.trim());
    } else {
      setNewCategory('');
    }
    
    setHighlightedIndex(-1);
  }, [searchQuery, categories, allowNew]);

  // Handle category creation
  const handleCreateCategory = async (category: string) => {
    if (!allowNew || !category.trim()) return;
    
    setIsCreating(true);
    
    try {
      if (onCreateCategory) {
        await onCreateCategory(category);
      } else {
        // Default implementation - create category in database
        await PollService.createPollCategory(category);
      }
      
      // Select the new category
      onChange(category);
      setIsOpen(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const totalItems = filteredCategories.length + (newCategory ? 1 : 0);
          return prev < totalItems - 1 ? prev + 1 : 0;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const totalItems = filteredCategories.length + (newCategory ? 1 : 0);
          return prev > 0 ? prev - 1 : totalItems - 1;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < filteredCategories.length) {
            handleSelect(filteredCategories[highlightedIndex]);
          } else if (newCategory) {
            handleSelect(newCategory);
          }
        } else if (newCategory) {
          handleSelect(newCategory);
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = async (category: string) => {
    // Check if this is a new category
    const isNewCat = !categories.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    );
    
    if (isNewCat && allowNew) {
      await handleCreateCategory(category);
    } else {
      onChange(category);
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-3 border border-gray-200 rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'
        } ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {value ? (
            <>
              <Tag className="h-5 w-5 text-primary-500 flex-shrink-0" />
              <span className="truncate text-gray-900">{value}</span>
            </>
          ) : (
            <>
              <Tag className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 truncate">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Categories List */}
          <ul 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
            aria-label="Categories"
          >
            {filteredCategories.length === 0 && !newCategory ? (
              <li className="px-3 py-8 text-center text-gray-500">
                <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No categories found</p>
                {allowNew && (
                  <p className="text-sm">Type to create a new category</p>
                )}
              </li>
            ) : (
              <>
                {filteredCategories.map((category, index) => (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => handleSelect(category)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                        index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                      } ${value === category ? 'bg-primary-100' : ''}`}
                      role="option"
                      aria-selected={value === category}
                    >
                      <Tag className={`h-4 w-4 flex-shrink-0 ${
                        value === category ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <span className="flex-1 truncate">{category}</span>
                      {value === category && (
                        <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
                
                {/* Add new category option */}
                {newCategory && allowNew && (
                  <li>
                    <button 
                      type="button"
                      onClick={() => handleCreateCategory(newCategory)}
                      disabled={isCreating}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors relative ${
                        highlightedIndex === filteredCategories.length ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                      } ${isCreating ? 'opacity-70' : ''}`}
                      role="option"
                    >
                      <Plus className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      <span className="flex-1 truncate">
                        {isCreating ? 'Creating...' : `Create "${newCategory}"`}
                      </span>
                      {isCreating && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        </span>
                      )}
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};