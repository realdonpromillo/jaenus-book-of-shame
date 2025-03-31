import React, { useState, useEffect } from 'react';

// Receive unique options as props
function EventFilter({ currentFilters, onFilterChange, peopleOptions = [], tagOptions = [] }) {

    // Use local state tied to props for controlled components
    // Initialize directly from props
    const [title, setTitle] = useState(currentFilters.title || '');
    const [selectedPerson, setSelectedPerson] = useState(currentFilters.people || '');
    const [selectedTag, setSelectedTag] = useState(currentFilters.tags || '');

    // Effect to update local state if props change from parent (e.g., filters cleared)
    // This ensures consistency if filters are reset externally
    useEffect(() => {
        setTitle(currentFilters.title || '');
        setSelectedPerson(currentFilters.people || '');
        setSelectedTag(currentFilters.tags || '');
    }, [currentFilters]);

    // Unified handler for all filter changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Update local state immediately based on input name
        if (name === 'title') setTitle(value);
        if (name === 'people') setSelectedPerson(value);
        if (name === 'tags') setSelectedTag(value);

        // IMPORTANT: Update parent state with the latest values
        // We construct the new filter object based on the change
        const newFilters = {
            ...currentFilters, // Spread existing filters
            [name]: value       // Update the changed one
        };
        onFilterChange(newFilters);
    };

    // Handler to clear all filters
    const handleClearFilters = () => {
        // Reset local state
        setTitle('');
        setSelectedPerson('');
        setSelectedTag('');
        // Notify parent to clear filters fully
        onFilterChange({ title: '', people: '', tags: '' });
    };

    return (
        <div className="filters">
            <h3>Filter Events:</h3>
            {/* Title Filter - Text Input */}
            <input
                type="text"
                name="title" // Matches state key and filter key
                placeholder="Filter by Title"
                value={title}
                onChange={handleChange}
                aria-label="Filter by Title" // Accessibility
                style={{ marginRight: '10px' }} // Add some spacing
            />

            {/* People Filter - Dropdown */}
            <select
                name="people" // Matches state key and filter key
                value={selectedPerson}
                onChange={handleChange}
                aria-label="Filter by Person" // Accessibility
                style={{ marginRight: '10px' }} // Add some spacing
            >
                <option value="">-- All People --</option>
                {/* Ensure peopleOptions is an array before mapping */}
                {Array.isArray(peopleOptions) && peopleOptions.map(person => (
                    <option key={person} value={person}>
                        {person}
                    </option>
                ))}
            </select>

            {/* Tags Filter - Dropdown */}
            <select
                name="tags" // Matches state key and filter key
                value={selectedTag}
                onChange={handleChange}
                aria-label="Filter by Tag" // Accessibility
                style={{ marginRight: '10px' }} // Add some spacing
            >
                <option value="">-- All Tags --</option>
                 {/* Ensure tagOptions is an array before mapping */}
                {Array.isArray(tagOptions) && tagOptions.map(tag => (
                    <option key={tag} value={tag}>
                        {tag}
                    </option>
                ))}
            </select>

            <button onClick={handleClearFilters} style={{ padding: '8px 12px' }}>Clear Filters</button>
        </div>
    );
}

export default EventFilter;