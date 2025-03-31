import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, startOfDay, isValid } from 'date-fns';

import MapDisplay from '../components/MapDisplay';
import Timeline from '../components/Timeline';
import EventTable from '../components/EventTable';
import EventFilter from '../components/EventFilter'; // Ensure correct component name

// Define API URL (use environment variable)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function MapTimelinePage() {
  const [allEvents, setAllEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Store Date object or null
  const [filters, setFilters] = useState({ title: '', people: '', tags: '' }); // people/tags store selected value
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all events on mount
  useEffect(() => {
    setLoading(true);
    setError(null); // Reset error on new fetch
    // console.log("Fetching events from:", `${API_URL}/events`);
    axios.get(`${API_URL}/events`)
      .then(response => {
        // console.log("Raw events received:", response.data);
        if (!Array.isArray(response.data)) {
           throw new Error("Invalid data format received from server.");
        }
        // Parse date strings into Date objects safely
        const eventsWithDates = response.data.map(event => {
           const parsedDate = event?.date ? parseISO(event.date) : null;
           return {
            ...event,
            // Store Date object if valid, otherwise null
            date: parsedDate && isValid(parsedDate) ? parsedDate : null
           }
        }).filter(event => event?.date !== null); // Filter out events with invalid/missing dates

        // console.log("Processed events with dates:", eventsWithDates);
        setAllEvents(eventsWithDates);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching events:", err);
        const message = err.response?.data?.message || err.message || "Failed to load events. Please try again later.";
        setError(message);
        setAllEvents([]); // Clear events on error
      })
      .finally(() => {
        setLoading(false);
        // console.log("Finished fetching events.");
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Generate unique lists for dropdowns ---
  const uniquePeople = useMemo(() => {
      if (!allEvents) return [];
      // Flatten all people arrays, filter out empty/null/undefined, create Set, sort
      const allPeople = allEvents.flatMap(event => event?.people || []).filter(p => p);
      return [...new Set(allPeople)].sort();
  }, [allEvents]);

  const uniqueTags = useMemo(() => {
      if (!allEvents) return [];
      // Flatten all tags arrays, filter out empty/null/undefined, create Set, sort
      const allTags = allEvents.flatMap(event => event?.tags || []).filter(t => t);
      return [...new Set(allTags)].sort();
  }, [allEvents]);
  // --- End unique list generation ---

  // Memoize filtered events based on date and text/dropdown filters
  const filteredEvents = useMemo(() => {
    // console.log("Recalculating filteredEvents. Selected Date:", selectedDate, "Filters:", filters);
    return allEvents.filter(event => {
        // Ensure event and event.date are valid before comparing
        if (!event || !event.date) return false;

        // Date filter: Check if event date matches the START of the selected date
        const matchesDate = !selectedDate || (startOfDay(event.date).getTime() === startOfDay(selectedDate).getTime());

        // Title Filter (case-insensitive partial match)
        const lowerTitleFilter = filters.title.toLowerCase();
        const matchesTitle = !lowerTitleFilter || (event.title && event.title.toLowerCase().includes(lowerTitleFilter));

        // People Filter (exact match from dropdown)
        // Check if the event's people array includes the selected person filter (if a person is selected)
        const matchesPeople = !filters.people || (Array.isArray(event.people) && event.people.includes(filters.people));

        // Tags Filter (exact match from dropdown)
        // Check if the event's tags array includes the selected tag filter (if a tag is selected)
        const matchesTags = !filters.tags || (Array.isArray(event.tags) && event.tags.includes(filters.tags));

        return matchesDate && matchesTitle && matchesPeople && matchesTags;
    });
  }, [allEvents, selectedDate, filters]);

  // Derive events specifically for the table (only those matching selected date and filters)
  const tableEvents = useMemo(() => {
    if (!selectedDate) return []; // Show empty table if no date selected
    // Filter from the already filtered events for efficiency
    // Ensure event and event.date are valid
    return filteredEvents.filter(event =>
        event?.date && startOfDay(event.date).getTime() === startOfDay(selectedDate).getTime()
    );
  }, [filteredEvents, selectedDate]);


  const handleDateSelect = (date) => {
    // console.log("Date selected on timeline:", date);
    // Toggle selection: if clicking the same date, deselect it (set to null)
    // Ensure date is valid before comparing
    setSelectedDate(prevDate =>
        prevDate && date && isValid(date) && isValid(prevDate) &&
        startOfDay(prevDate).getTime() === startOfDay(date).getTime()
        ? null
        : (date && isValid(date) ? date : null) // Set to the new valid date or null
    );
  };

  const handleFilterChange = (newFilters) => {
    // console.log("Filters changed:", newFilters);
    setFilters(newFilters);
    // When filters change, keep the selected date, but filters will re-apply via useMemo
  };

  // Render different states: Loading, Error, No Events, Events available
  if (loading) {
    // console.log("Rendering: Loading state");
    return <div className="page-container"><h1>Event Map & Timeline</h1><div>Loading events...</div></div>;
  }

  if (error) {
    // console.log("Rendering: Error state", error);
    return <div className="page-container"><h1>Event Map & Timeline</h1><div style={{ color: 'red' }}>Error: {error}</div></div>;
  }

  // Check after loading and no error if there are still no events fetched
  if (!loading && !error && allEvents.length === 0) {
    // console.log("Rendering: No events found state");
    return (
        <div className="page-container">
            <h1>Event Map & Timeline</h1>
            <p>No events have been created yet. Go to the "Create Event" page to add some!</p>
            {/* Optionally show an empty map centered globally */}
            <MapDisplay events={[]} />
        </div>
    );
  }

  // Render the main view with events
  // console.log("Rendering: Main view with events. All:", allEvents.length, "Filtered:", filteredEvents.length, "Table:", tableEvents.length);
  return (
    <div className="page-container">
      <h1>Event Map & Timeline</h1>

      {/* Pass unique lists to the filter component */}
      <EventFilter
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          peopleOptions={uniquePeople}
          tagOptions={uniqueTags}
      />

      <MapDisplay events={filteredEvents} />

      <Timeline
          events={allEvents} // Timeline shows dates derived from all events
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
      />

      {/* Table only shows events for the specifically selected date + filters */}
       {selectedDate ? (
         // Pass the correctly filtered tableEvents
         <EventTable events={tableEvents} selectedDate={selectedDate} />
       ) : (
         // Show message only if there are events overall but no date selected
         allEvents.length > 0 && <p>Select a date on the timeline to see event details for that day.</p>
       )}
    </div>
  );
}

export default MapTimelinePage;