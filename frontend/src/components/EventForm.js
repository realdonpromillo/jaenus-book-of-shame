import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

// Define API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function EventForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // Added description state
  const [people, setPeople] = useState('');
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState(null); // Initialize as null or empty FileList
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const addressInputRef = useRef(null); // Ref for address input container
  const fileInputRef = useRef(null); // Ref for file input

  // Debounced function to fetch address suggestions
  const fetchAddressSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setAddressSuggestions([]);
        setLoadingSuggestions(false); // Ensure loading is off
        return;
      }
      // console.log("Fetching address suggestions for:", query);
      setLoadingSuggestions(true);
      setError(''); // Clear previous errors
      try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: query, format: "json", limit: 5, addressdetails: 1 },
          headers: {
             // IMPORTANT: Replace with your actual app name/email for Nominatim TOS
            'User-Agent': 'TimelineMapApp/1.0 (nick@example.com)'
          }
        });
        // console.log("Nominatim response:", response.data);
        setAddressSuggestions(response.data || []);
      } catch (err) {
        console.error("Error fetching address suggestions:", err);
        // Check network error vs API error
        if (err.response) {
            console.error("Nominatim Error Data:", err.response.data);
            console.error("Nominatim Error Status:", err.response.status);
             setError(`Could not fetch suggestions (Status: ${err.response.status}).`);
        } else if (err.request) {
             console.error("Nominatim request made but no response received:", err.request);
             setError('Network error: Could not reach address suggestion service.');
        } else {
            setError('Error setting up address suggestion request.');
        }
        setAddressSuggestions([]); // Clear suggestions on error
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500), // 500ms delay
    [] // Empty dependency array for useCallback
  );

  const handleAddressChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setError(''); // Clear previous errors on new input
    setSuccess(''); // Clear success message
    fetchAddressSuggestions(newAddress);
  };

  const handleSuggestionClick = (suggestion) => {
    // console.log("Suggestion selected:", suggestion);
    setAddress(suggestion.display_name); // Use the full display name
    setAddressSuggestions([]); // Hide suggestions
    setError(''); // Clear error if suggestion selected
  };

  const handleImageChange = (e) => {
    // e.target.files is a FileList, store it directly
    setImages(e.target.files);
    setSuccess(''); // Clear success message
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log("Form submission started.");

    if (!title || !date || !address) {
        setError("Please fill in Title, Date, and Address.");
        console.error("Form validation failed: Missing required fields.");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description); // Added description to form data
    formData.append('people', people);
    formData.append('date', date);
    formData.append('address', address);
    formData.append('tags', tags);

    // Append images from the FileList state
    if (images) { // Check if images FileList is not null/undefined
        for (let i = 0; i < images.length; i++) {
            formData.append('images', images[i]); // Append each File object
        }
    }

    // console.log("Submitting FormData (excluding file content):", Object.fromEntries(formData.entries()));

    try {
      // Use the API_URL defined earlier
      const response = await axios.post(`${API_URL}/events`, formData, {
        // Content-Type is set automatically by browser for FormData
      });
      console.log("Event creation successful:", response.data);
      setSuccess(`Event "${response.data.title}" created successfully!`);
      // Reset form fields
      setTitle('');
      setDescription(''); // Added reset for description
      setPeople('');
      setDate('');
      setAddress('');
      setTags('');
      setImages(null); // Reset image state to null or empty FileList
      setAddressSuggestions([]); // Clear suggestions
      // Clear file input visually using the ref
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error("Error submitting event:", err);
      // Provide more specific feedback from backend if available
      let message = "Failed to create event.";
       if (err.response) {
          console.error("Backend Error Data:", err.response.data);
          console.error("Backend Error Status:", err.response.status);
          // Try to extract specific errors if backend provides them
          if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
              message = `Validation Error: ${err.response.data.errors.join(', ')}`;
          } else {
               message = err.response.data?.message || `Server error (Status: ${err.response.status}). Check address validity.`;
          }
       } else if (err.request) {
          console.error("Backend request made but no response received:", err.request);
          message = 'Network error: Could not reach the server.';
       } else {
           message = 'Error setting up the event creation request.';
       }
       setError(message);
    }
  };

  // Close suggestions when clicking outside the address input container
  useEffect(() => {
      const handleClickOutside = (event) => {
          // Check if the click target is outside the element referenced by addressInputRef
          if (addressInputRef.current && !addressInputRef.current.contains(event.target)) {
              setAddressSuggestions([]); // Hide suggestions
          }
      };
      // Add listener on mount
      document.addEventListener('mousedown', handleClickOutside);
      // Clean up listener on unmount
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {/* Display Success and Error Messages */}
        {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}
        {success && <p style={{ color: 'green', border: '1px solid green', padding: '10px', borderRadius: '4px' }}>{success}</p>}

        <div>
          <label htmlFor="title">Title *</label>
          <input type="text" id="title" placeholder="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* Description Textarea */}
        <div>
            <label htmlFor="description">Description</label>
            <textarea
                id="description"
                name="description" // Add name attribute
                placeholder="Add a description for the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4} // Adjust height as needed
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} // Ensure consistent styling
            />
        </div>

        <div>
            <label htmlFor="people">People</label>
            <input type="text" id="people" placeholder="Comma separated names (e.g., Alice, Bob)" value={people} onChange={(e) => setPeople(e.target.value)} />
        </div>

        <div>
          <label htmlFor="date">Date *</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        {/* Container for address input and suggestions, referenced by addressInputRef */}
        <div className="address-input-container" ref={addressInputRef}>
          <label htmlFor="address">Address *</label>
          <input
            type="text"
            id="address"
            placeholder="Start typing an address..."
            value={address}
            onChange={handleAddressChange}
            required
            autoComplete="off" // Disable browser autocomplete
          />
          {/* Display loading indicator OR suggestions */}
          {loadingSuggestions ? (
             <small style={{ display: 'block', marginTop: '5px' }}>Searching addresses...</small>
          ) : addressSuggestions.length > 0 && (
            <ul className="address-suggestions">
              {addressSuggestions.map((suggestion) => (
                // Ensure suggestion and place_id exist
                suggestion?.place_id ? (
                  <li key={suggestion.place_id} onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion.display_name || 'Unnamed location'}
                  </li>
                ) : null
              ))}
            </ul>
          )}
        </div>

         <div>
             <label htmlFor="tags">Tags</label>
             <input type="text" id="tags" placeholder="Comma separated tags (e.g., conference, meetup)" value={tags} onChange={(e) => setTags(e.target.value)} />
         </div>

        <div>
           <label htmlFor="images">Images</label>
           <input
             type="file"
             id="images"
             name="images" // Name attribute can be useful
             multiple
             onChange={handleImageChange}
             accept="image/*" // Accept only image files
             ref={fileInputRef} // Assign the ref here
            />
        </div>

        <button type="submit">Add Event</button>
      </form>
    </div>
  );
}

export default EventForm;