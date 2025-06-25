import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe, Check } from 'lucide-react';
import { COUNTRIES, searchCountries, getPopularCountries, type Country } from '../../utils/countries';

interface CountrySelectProps {
  value?: string;
  onChange: (country: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showFlag?: boolean;
  showPopular?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value = '',
  onChange,
  placeholder = 'Select a country',
  className = '',
  disabled = false,
  required = false,
  showFlag = true,
  showPopular = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(COUNTRIES);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCountry = COUNTRIES.find(country => country.name === value);
  const popularCountries = getPopularCountries();

  // Handle search
  useEffect(() => {
    const results = searchCountries(searchQuery);
    setFilteredCountries(results);
    setHighlightedIndex(-1);
  }, [searchQuery]);

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
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
          handleSelect(filteredCountries[highlightedIndex]);
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

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const displayCountries = showPopular && !searchQuery 
    ? [...popularCountries, ...filteredCountries.filter(c => !popularCountries.some(p => p.code === c.code))]
    : filteredCountries;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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
          {selectedCountry ? (
            <>
              {showFlag && (
                <span className="text-lg flex-shrink-0" role="img" aria-label={`${selectedCountry.name} flag`}>
                  {selectedCountry.flag}
                </span>
              )}
              <span className="truncate text-gray-900">{selectedCountry.name}</span>
            </>
          ) : (
            <>
              <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
                placeholder="Search countries..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Countries List */}
          <ul 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
            aria-label="Countries"
          >
            {showPopular && !searchQuery && popularCountries.length > 0 && (
              <>
                <li className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  Popular Countries
                </li>
                {popularCountries.map((country, index) => (
                  <li key={`popular-${country.code}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(country)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                        index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                      } ${selectedCountry?.code === country.code ? 'bg-primary-100' : ''}`}
                      role="option"
                      aria-selected={selectedCountry?.code === country.code}
                    >
                      {showFlag && (
                        <span className="text-lg flex-shrink-0" role="img" aria-label={`${country.name} flag`}>
                          {country.flag}
                        </span>
                      )}
                      <span className="flex-1 truncate">{country.name}</span>
                      {selectedCountry?.code === country.code && (
                        <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
                <li className="border-b border-gray-100"></li>
              </>
            )}

            {displayCountries.length === 0 ? (
              <li className="px-3 py-8 text-center text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No countries found</p>
                <p className="text-sm">Try adjusting your search</p>
              </li>
            ) : (
              displayCountries
                .filter(country => !showPopular || searchQuery || !popularCountries.some(p => p.code === country.code))
                .map((country, index) => {
                  const adjustedIndex = showPopular && !searchQuery ? index + popularCountries.length : index;
                  return (
                    <li key={country.code}>
                      <button
                        type="button"
                        onClick={() => handleSelect(country)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          adjustedIndex === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                        } ${selectedCountry?.code === country.code ? 'bg-primary-100' : ''}`}
                        role="option"
                        aria-selected={selectedCountry?.code === country.code}
                      >
                        {showFlag && (
                          <span className="text-lg flex-shrink-0" role="img" aria-label={`${country.name} flag`}>
                            {country.flag}
                          </span>
                        )}
                        <span className="flex-1 truncate">{country.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{country.code}</span>
                        {selectedCountry?.code === country.code && (
                          <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};