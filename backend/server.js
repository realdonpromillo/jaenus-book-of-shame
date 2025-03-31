import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from 'fs'; // Import fs for checking directory

dotenv.config();

// --- Calculate __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End Calculate __dirname ---


const app = express();
const PORT = process.env.PORT || 5000;
const UPLOADS_DIR = path.join(__dirname, "uploads"); // Define uploads directory path

// --- Ensure Uploads Directory Exists ---
if (!fs.existsSync(UPLOADS_DIR)){
    console.log(`Creating uploads directory at: ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} else {
    console.log(`Uploads directory already exists at: ${UPLOADS_DIR}`);
}

// --- Event Schema --- (Define before use in seeding/routes)
const EventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Event title is required.'] },
  description: { type: String }, // Description field (optional)
  people: [String],
  date: { type: Date, required: [true, 'Event date is required.'] },
  location: {
    address: { type: String, required: [true, 'Event address is required.'] },
    // Coordinates: [longitude, latitude] for GeoJSON
    coordinates: {
        type: [Number],
        index: "2dsphere", // Geospatial index
        required: [true, 'Event coordinates are required after geocoding.'],
        validate: {
            validator: function(coords) {
                // Basic validation: array of 2 numbers
                return Array.isArray(coords) && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number';
            },
            message: 'Coordinates must be an array of two numbers [longitude, latitude].'
        }
    },
  },
  tags: [String],
  images: [String], // Store relative paths like '/uploads/filename.jpg'
});

const Event = mongoose.model("Event", EventSchema);
// --- End Event Schema ---

// --- Seeding Function ---
async function seedDatabase() {
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log("No events found, seeding database with dummy data...");
      const dummyEvents = [
        {
          title: "Team Meeting @ Apple Park",
          description: "Weekly sync meeting to discuss project progress and blockers.",
          people: ["Alice", "Bob"],
          date: new Date("2024-07-15T10:00:00Z"),
          location: {
            address: "Apple Park Visitor Center, 10600 N Tantau Ave, Cupertino, CA 95014, USA",
            coordinates: [-122.0099, 37.3328] // lon, lat for Apple Park Visitor Center
          },
          tags: ["work", "planning"],
          images: []
        },
        {
          title: "Project Launch Party @ Eiffel Tower",
          description: "Celebrating the successful launch of Project Phoenix!",
          people: ["Charlie", "Dana", "Eve"],
          date: new Date("2024-07-15T18:30:00Z"),
          location: {
            address: "Eiffel Tower, Champ de Mars, 5 Av. Anatole France, 75007 Paris, France",
            coordinates: [2.2945, 48.8584] // lon, lat for Eiffel Tower
          },
          tags: ["celebration", "social", "paris"],
          images: []
        },
         {
          title: "Conference Talk @ Moscone Center",
          description: "Presenting on the future of Web APIs at the annual TechConf.",
          people: ["Bob"],
          date: new Date("2024-07-16T14:00:00Z"),
          location: {
            address: "Moscone Center, 747 Howard St, San Francisco, CA 94103, USA",
            coordinates: [-122.4013, 37.7837] // lon, lat for Moscone Center
          },
          tags: ["conference", "tech", "sf"],
          images: []
        },
        {
          title: "Central Park Picnic",
          description: "Casual get-together in the park. Bring snacks!",
          people: ["Alice", "Charlie"],
          date: new Date("2024-07-17T12:00:00Z"),
          location: {
            address: "Sheep Meadow, Central Park, New York, NY 10024, USA",
            coordinates: [-73.9742, 40.7749] // lon, lat for Sheep Meadow approx.
          },
          tags: ["social", "park", "nyc"],
          images: []
        }
      ];
      await Event.insertMany(dummyEvents);
      console.log("Database seeded successfully with dummy events.");
    } else {
      console.log(`Database already contains ${eventCount} events, skipping seeding.`);
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
// --- End Seeding Function ---


// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
      console.log("MongoDB connected successfully.");
      // Call seeding function after successful connection
      seedDatabase();
  })
  .catch(err => console.error("MongoDB connection error:", err)); // Log full error


// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve uploaded images statically from the '/uploads' route
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve static files from the React frontend build directory
// This needs to be defined BEFORE the catch-all route but AFTER API routes usually
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
console.log(`Serving static files from: ${frontendBuildPath}`);
app.use(express.static(frontendBuildPath));
// --- End Middleware ---


// --- Multer Setup for Image Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the UPLOADS_DIR variable
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and make it unique
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${safeOriginalName}`);
  },
});
// Optional: Add file filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept file
    } else {
        // Use standard Error object for rejection
        cb(new Error('Not an image! Please upload only images.'), false); // Reject file
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Example: 5MB limit
});
// --- End Multer Setup ---


// --- API Routes --- (Prefixed with /api)

// POST /api/events - Create a new event
app.post("/api/events", upload.array("images", 5), async (req, res) => { // Limit to 5 images
   console.log("Received POST /api/events request.");
   try {
      // Destructure description along with other fields
      const { title, description, people, date, address, tags } = req.body;

      // Basic validation (Mongoose schema handles more)
      if (!title || !date || !address) {
        console.log("Validation failed: Missing required fields.");
        return res.status(400).json({ message: "Title, date, and address are required fields." });
      }

      // --- Geocode address using Nominatim ---
      let coordinates;
      try {
        console.log(`Geocoding address: "${address}"`);
        const geoResponse = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: address, format: "json", limit: 1, addressdetails: 1 },
           // IMPORTANT: Replace with your actual app name/email for Nominatim TOS
          headers: { 'User-Agent': 'TimelineMapApp/1.0 (nick@example.com)' }
        });

        if (!geoResponse.data || geoResponse.data.length === 0) {
           console.log('Geocoding failed: No results found from Nominatim.');
           return res.status(400).json({ message: "Could not geocode address. Please provide a valid address or check Nominatim status." });
        }
        console.log('Geocoding successful. Result:', geoResponse.data[0]);
        const { lat, lon } = geoResponse.data[0];
        // Ensure coordinates are numbers and in [longitude, latitude] order
        const longitude = parseFloat(lon);
        const latitude = parseFloat(lat);
        if (isNaN(longitude) || isNaN(latitude)) {
            console.error('Invalid coordinates received from geocoding service.');
            throw new Error('Invalid coordinates received from geocoding service.');
        }
        coordinates = [longitude, latitude];

      } catch (geoError) {
          console.error("Geocoding error:", geoError.message);
          if (geoError.response) {
              console.error("Nominatim Response Status:", geoError.response.status);
              console.error("Nominatim Response Data:", geoError.response.data);
          } else if (geoError.request) {
              console.error("Nominatim request made but no response received.");
          } else {
               console.error("Error setting up Nominatim request:", geoError.message);
          }
          // Provide a user-friendly error
          return res.status(500).json({ message: "Failed to verify address location. Please try again or contact support." });
      }
      // --- End Geocoding ---

      // Process optional fields and images
      const peopleArray = people ? people.split(",").map(p => p.trim()).filter(p => p) : [];
      const tagsArray = tags ? tags.split(",").map(t => t.trim()).filter(t => t) : [];
      // Store relative paths for images, prefixed with /uploads/
      const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

      const newEvent = new Event({
        title,
        description: description || '', // Use empty string if null/undefined
        people: peopleArray,
        date: new Date(date), // Ensure date is stored as Date object
        location: {
          address: address, // Store the original address
          coordinates: coordinates,
        },
        tags: tagsArray,
        images: imagePaths,
      });

      console.log("Attempting to save new event."); // Removed object logging for brevity
      const savedEvent = await newEvent.save(); // Use savedEvent to ensure it worked
      console.log("Event saved successfully:", savedEvent._id);
      res.status(201).json(savedEvent); // Return the full created event

    } catch (error) {
      console.error("Error creating event:", error);
      // Handle Mongoose validation errors specifically
      if (error.name === 'ValidationError') {
          // Construct a user-friendly message from validation errors
          const messages = Object.values(error.errors).map(e => e.message);
          return res.status(400).json({ message: "Validation Error", errors: messages });
      }
      // Handle Multer errors (e.g., file size limit)
      if (error instanceof multer.MulterError) {
          return res.status(400).json({ message: `File upload error: ${error.message}` });
      }
      // Handle custom file filter errors (check if error message exists)
      if (error && error.message && error.message.startsWith('Not an image')) {
           return res.status(400).json({ message: error.message });
      }
      // Generic server error
      res.status(500).json({ message: "Server error creating event.", error: error.message });
    }
});

// GET /api/events - Fetch events with optional filtering
app.get("/api/events", async (req, res) => {
   console.log("Received GET /api/events request with query:", req.query);
   try {
      // Basic filtering (can be expanded)
      const query = {};
      const { search, date } = req.query;

      if (search) {
          const searchRegex = new RegExp(search, "i"); // Case-insensitive search
          // Include description in the search $or
          query.$or = [
              { title: searchRegex },
              { description: searchRegex }, // Added description search
              { people: searchRegex }, // Searches if any element in the array matches
              { tags: searchRegex },   // Searches if any element in the array matches
              { "location.address": searchRegex },
          ];
      }

      if (date) {
          // Assumes date is in 'YYYY-MM-DD' format from client filter potentially
          // Find events exactly on that day (UTC based)
          try {
              const startDate = new Date(date);
              // Check if date is valid before using it
              if (isNaN(startDate.getTime())) {
                  console.warn('Invalid date format received for filtering:', date);
                  // Decide how to handle: ignore filter, return error?
                  // Here we choose to ignore the invalid date filter.
              } else {
                  startDate.setUTCHours(0, 0, 0, 0);
                  const endDate = new Date(date);
                  endDate.setUTCHours(23, 59, 59, 999);
                  query.date = { $gte: startDate, $lte: endDate };
              }
          } catch (dateError) {
               console.error("Error processing date filter:", dateError);
               // Ignore filter on error
          }
      }
      console.log("Executing DB query:", query);
      // Add sorting, e.g., by date descending
      const events = await Event.find(query).sort({ date: -1 });
      console.log(`Found ${events.length} events.`);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Server error fetching events.", error: error.message });
    }
});
// --- End API Routes ---


// --- Catch-all for SPA Routing ---
// This MUST be defined AFTER all other API routes and static file middleware.
// It ensures that any GET request not handled above serves the React app's entry point.
app.get('*', (req, res) => {
  // Avoid logging for static assets if possible, check if request accepts HTML
  if (req.accepts('html')) {
      console.log(`Catch-all route hit for: ${req.originalUrl}. Serving index.html.`);
  }
  // Use path.resolve for robustness
  res.sendFile(path.resolve(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
          console.error('Error sending index.html:', err);
          // Check if the error is because the file doesn't exist
          if (err.status === 404) {
              res.status(404).send('Frontend entry point not found.');
          } else {
              res.status(500).send('Server error serving frontend.');
          }
      }
  });
});
// --- End Catch-all ---


// --- Global Error Handler (Optional but Recommended) ---
// Add this AFTER all routes and middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  // Respond with a generic server error
  // Avoid sending stack trace in production
  res.status(err.status || 500).json({ // Use error status if available
      message: err.message || 'Something broke!',
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
// --- End Global Error Handler ---


// --- Start Server ---
app.listen(PORT, () => console.log(`Server running successfully on http://localhost:${PORT}`));