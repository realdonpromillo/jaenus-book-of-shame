import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Icon Fix ---
import markerIconPng from "leaflet/dist/images/marker-icon.png"
import markerShadowPng from "leaflet/dist/images/marker-shadow.png"
import { Icon } from 'leaflet'
const defaultIcon = new Icon({
    iconUrl: markerIconPng, shadowUrl: markerShadowPng, iconSize: [25, 41],
    iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;
// --- End Icon Fix ---

// Define the correct base URL for static assets (images)
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000');

// --- FitBounds Component ---
const FitBounds = ({ events }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !Array.isArray(events)) { return; }
        if (events.length === 0) { return; }
        const validCoordinates = events
            .map(event => event?.location?.coordinates)
            .filter(coords => Array.isArray(coords) && coords.length === 2 && typeof coords[1] === 'number' && typeof coords[0] === 'number')
            .map(coords => [coords[1], coords[0]]); // Map to [lat, lng] for Leaflet
        if (validCoordinates.length === 0) { return; }
        const bounds = L.latLngBounds(validCoordinates);
        if (bounds.isValid()) { map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16 }); }
        else if (validCoordinates.length === 1) { map.flyTo(validCoordinates[0], 13); }
    }, [events, map]);
    return null;
};
// --- End FitBounds ---


function MapDisplay({ events }) {
    const defaultCenter = [20, 0]; // A more global center
    const defaultZoom = 2;

    // Ensure events is an array before filtering
    const validEvents = Array.isArray(events) ? events.filter(event =>
        event && // Check if event object exists
        event.location &&
        event.location.coordinates &&
        event.location.coordinates.length === 2 &&
        typeof event.location.coordinates[0] === 'number' && // longitude
        typeof event.location.coordinates[1] === 'number'    // latitude
    ) : [];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            style={{ height: '500px', width: '100%' }}
            className="leaflet-container"
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validEvents.map((event) => (
                // Ensure event and _id exist before rendering marker
                event?._id ? (
                    <Marker
                        key={event._id} // Use unique MongoDB ID as key
                        position={[event.location.coordinates[1], event.location.coordinates[0]]} // Leaflet uses [lat, lng]
                    >
                        <Popup>
                            <div style={{ maxWidth: '200px' }}> {/* Set max width for popup content */}
                                <strong>{event.title || 'Untitled Event'}</strong><br />
                                {/* Display Description - check if it exists and is not empty */}
                                {event.description && event.description.trim() !== '' && (
                                    <p style={{ fontStyle: 'italic', margin: '5px 0', fontSize: '0.9em' }}>
                                        {event.description}
                                    </p>
                                )}
                                <small>{event.location?.address || 'No Address'}</small><br />
                                <small>Date: {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</small>
                                {/* Display Image */}
                                {Array.isArray(event.images) && event.images.length > 0 && event.images[0] && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img
                                            src={`${BACKEND_BASE_URL}${event.images[0]}`}
                                            alt={`${event.title || 'Event'} image`}
                                            style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: 'auto', border: '1px solid #eee' }} // Adjusted styling
                                            onError={(e) => { e.target.style.display='none'; }}
                                        />
                                    </div>
                                )}
                                {/* Display People and Tags */}
                                {Array.isArray(event.people) && event.people.length > 0 && (
                                    <><br/><small>People: {event.people.join(', ')}</small></>
                                )}
                                {Array.isArray(event.tags) && event.tags.length > 0 && (
                                    <><br/><small>Tags: {event.tags.join(', ')}</small></>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ) : null // Don't render marker if event or _id is missing
            ))}
            <FitBounds events={validEvents} />
        </MapContainer>
    );
}

export default MapDisplay;