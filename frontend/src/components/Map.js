import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

function Map() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/events").then((response) => {
      setEvents(response.data);
    });
  }, []);

  return (
    <MapContainer center={[51.505, -0.09]} zoom={3} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {events.map((event, index) => (
        <Marker key={index} position={[event.location.coordinates[1], event.location.coordinates[0]]}>
          <Popup>{event.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map;
