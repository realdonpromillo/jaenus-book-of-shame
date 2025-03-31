import React from 'react';
import { format } from 'date-fns';

// Define the correct base URL for static assets (images)
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000');

function EventTable({ events, selectedDate }) {

  // Handle cases where events might not be an array yet or is empty
  if (!Array.isArray(events) || events.length === 0) {
    return (
        <div className="event-table-container">
            {selectedDate instanceof Date && !isNaN(selectedDate) ? (
                <p>No events found for {format(selectedDate, 'MMMM dd, yyyy')} matching the current filters.</p>
            ) : (
                // Avoid showing this if selectedDate is null but events exist elsewhere
                selectedDate !== null && <p>Invalid date selected.</p>
                // If selectedDate is null, the parent component shows the prompt message
            )}
        </div>
    );
  }

  // Format the selected date once for the heading (ensure selectedDate is valid)
  const formattedDate = selectedDate instanceof Date && !isNaN(selectedDate)
    ? format(selectedDate, 'MMMM dd, yyyy')
    : 'Invalid Date';

  return (
    <div className="event-table-container">
      <h2>Events for {formattedDate}</h2>
      <table className="event-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th> {/* Added header */}
            <th>People</th>
            <th>Address</th>
            <th>Tags</th>
            <th>Images</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            // Ensure event has an _id before rendering row
            event?._id ? (
              <tr key={event._id}>
                <td>{event.title || '-'}</td>
                <td>{event.description || '-'}</td> {/* Added data cell for description */}
                <td>{Array.isArray(event.people) && event.people.length > 0 ? event.people.join(', ') : '-'}</td>
                <td>{event.location?.address || '-'}</td>
                <td>{Array.isArray(event.tags) && event.tags.length > 0 ? event.tags.join(', ') : '-'}</td>
                <td>
                  {/* Check if images exist and is an array */}
                  {Array.isArray(event.images) && event.images.length > 0 ? (
                    event.images.map((imgSrc, index) => (
                      // Ensure imgSrc is a non-empty string before rendering image
                      imgSrc && typeof imgSrc === 'string' ? (
                        <img
                          key={`${event._id}-img-${index}`} // More unique key
                          src={`${BACKEND_BASE_URL}${imgSrc}`}
                          alt={`${event.title || 'Event'} image ${index + 1}`}
                          onError={(e) => {
                              console.warn(`Failed to load image: ${e.target.src}`);
                              e.target.style.display='none'; // Hide broken images
                          }}
                          style={{ maxWidth: '50px', maxHeight: '50px', marginRight: '5px', verticalAlign: 'middle', border: '1px solid #eee' }}
                        />
                      ) : null // Don't render img tag if imgSrc is empty/null or not a string
                    ))
                  ) : (
                    '-' // Display hyphen if no images
                  )}
                </td>
              </tr>
            ) : null // Don't render row if event or event._id is missing
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EventTable;