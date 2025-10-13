import React from 'react';

const SearchBar = ({ searchQuery, onSearchChange, onFocus, onBlur }) => {
  return (
    <div className="search-container">
      <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        placeholder="Search songs or artists..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="search-input"
        autoComplete="off"
      />
      {searchQuery && (
        <button 
          className="clear-search" 
          onClick={() => onSearchChange('')}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;