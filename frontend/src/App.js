// hello/frontend/src/App.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import MapTimelinePage from './pages/MapTimelinePage';
import EventFormPage from './pages/EventFormPage';
import './App.css'; // Add some basic styling

function App() {
  return (
    <div className="App">
      <nav className="main-nav">
        <Link to="/">Map & Timeline</Link>
        <Link to="/create">Create Event</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<MapTimelinePage />} />
          <Route path="/create" element={<EventFormPage />} />
          {/* Add other routes here if needed */}
        </Routes>
      </main>
    </div>
  );
}

export default App;