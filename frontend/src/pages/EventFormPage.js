// hello/frontend/src/pages/EventFormPage.js
import React from 'react';
import EventForm from '../components/EventForm'; // We'll move EventForm to components

function EventFormPage() {
  return (
    <div>
      <h2>Create New Event</h2>
      <EventForm />
    </div>
  );
}

export default EventFormPage;