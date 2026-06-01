import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker, LayersControl, LayerGroup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

/** * FIX FOR LEAFLET DEFAULT ICON ASSETS 
 * This ensures markers show up correctly after deployment on Vercel
 */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
});

/**
 * CUSTOM BLINKING RED ICON COMPONENT
 * Created using Leaflet DivIcon and CSS animations
 */
const blinkingIcon = new L.DivIcon({
    className: 'custom-blinking-icon',
    html: '<div class="blinking-dot"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

/**
 * MAP CONTROLLER COMPONENT
 * Handles smooth flying/panning to new coordinates
 */
function MapController({ targetLoc }) {
    const map = useMap();
    useEffect(() => {
        if (targetLoc) {
            map.flyTo([targetLoc.lat, targetLoc.lng], 14, {
                duration: 2.5,
                easeLinearity: 0.25
            });
        }
    }, [targetLoc, map]);
    return null;
}

export default function Home() {
    // --- STATE MANAGEMENT ---
    const [events, setEvents] = useState([]);
    const [userLoc, setUserLoc] = useState(null);
    const [locSource, setLocSource] = useState(null); // 'GPS' or 'MANUAL'
    const [isManualPinning, setIsManualPinning] = useState(false);
    const [mapTarget, setMapTarget] = useState(null);
    const [nearbyEvents, setNearbyEvents] = useState([]);
    const [isSearchingGPS, setIsSearchingGPS] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Radius Control and Interactive Syncing
    const [radiusKm, setRadiusKm] = useState(5);
    const [hoveredEventId, setHoveredEventId] = useState(null);

    // Routing and Navigation States
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeDistance, setRouteDistance] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Auth context
    const user = JSON.parse(localStorage.getItem('user'));

    // --- SIDE EFFECTS (USEEFFECT) ---
    useEffect(() => {
        fetchEvents();
    }, []);

    // Logic to filter events based on the dynamic Radius Slider
    useEffect(() => {
        if (userLoc && events.length > 0) {
            const userLatLng = L.latLng(userLoc.lat, userLoc.lng);
            const nearby = events.filter(event => {
                if (!event.location?.lat) return false;
                const dist = userLatLng.distanceTo(L.latLng(event.location.lat, event.location.lng));
                return dist <= (radiusKm * 1000);
            });
            setNearbyEvents(nearby);
        }
    }, [userLoc, radiusKm, events]);

    // --- API HANDLERS ---
    const fetchEvents = () => {
        axios.get('https://event-sphere-uk4j.onrender.com/api/events')
            .then(res => setEvents(res.data))
            .catch(err => console.error("Fetch Error:", err));
    };

    const handleInterest = async (eventId, eventTitle) => {
        if (!user) return alert("Please Login First!");
        try {
            await axios.put(`https://event-sphere-uk4j.onrender.com/api/events/${eventId}/interested`, {
                userId: user._id
            });
            fetchEvents();
            alert(`Interest noted for ${eventTitle}!`);
        } catch (error) {
            console.error("Interest Error:", error);
        }
    };

    const handleTextSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                const loc = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setMapTarget(loc);
                setUserLoc(loc);
            } else {
                alert("Place not found! Try being more specific (e.g. Kidangoor, Kerala).");
            }
        } catch (err) {
            console.error("Search Error:", err);
        }
    };

    const getRoute = async (eventLat, eventLng, eventId) => {
        if (!userLoc) return alert("📍 Please search for your location or click 'Near Me' first!");
        setSelectedEventId(eventId);
        try {
            const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${eventLng},${eventLat}?overview=full&geometries=geojson`);
            if (res.data.routes && res.data.routes.length > 0) {
                const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                setRouteCoords(coords);
                setRouteDistance((res.data.routes[0].distance / 1000).toFixed(2));
            }
        } catch (err) {
            alert("Routing API is currently busy. Try again in a moment.");
        }
    };

    const findNearbyEvents = () => {
        if (!navigator.geolocation) return alert("GPS hardware not found.");
        setIsSearchingGPS(true);

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                navigator.geolocation.clearWatch(watchId);
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLoc(loc);
                setLocSource('GPS');
                setMapTarget(loc);
                setIsSearchingGPS(false);
            },
            (error) => {
                navigator.geolocation.clearWatch(watchId);
                alert("GPS Denied. Using Manual Search Override instead.");
                setIsSearchingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleManualUnpin = () => {
        if (locSource === 'MANUAL') {
            if (window.confirm("Unpin the current location?")) {
                setUserLoc(null);
                setLocSource(null);
                setRouteCoords([]);
                setRouteDistance(null);
            }
        }
    };

    const ManualPinController = () => {
        useMapEvents({
            click(e) {
                if (isManualPinning) {
                    if (window.confirm("Are you here?")) {
                        const loc = { lat: e.latlng.lat, lng: e.latlng.lng };
                        setUserLoc(loc);
                        setLocSource('MANUAL');
                        setMapTarget(loc);
                        setIsManualPinning(false);
                    }
                }
            }
        });
        return null;
    };

    // --- RENDER LOGIC ---
    const displayedEvents = events.filter(e => filterCategory === 'All' || e.eventType === filterCategory);
    const displayedNearbyEvents = nearbyEvents.filter(e => filterCategory === 'All' || e.eventType === filterCategory);

    return (
        <div className="home-layout">

            {/* CSS STYLES BLOCK 
              This section contains the logic for Desktop vs Mobile viewing 
            */}
            <style>{`
                /* CORE LAYOUT */
                .home-layout { display: flex; gap: 20px; height: 85vh; width: 100%; box-sizing: border-box; padding: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                
                /* DESKTOP MAP BOX */
                .map-container-box { flex: 3; position: relative; border-radius: 15px; overflow: hidden; border: 1px solid #ddd; box-shadow: 0 10px 30px rgba(0,0,0,0.1); min-height: 50vh; }
                
                /* DESKTOP SEARCH OVERLAY */
                .search-box { position: absolute; top: 20px; left: 60px; z-index: 1000; display: flex; width: 450px; border-radius: 30px; overflow: hidden; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 1px solid #eee; }
                .search-input { flex: 2; padding: 12px 20px; border: none; outline: none; font-size: 14px; }
                .category-dropdown { flex: 1; padding: 12px; border: none; border-left: 1px solid #eee; outline: none; background: #f9f9f9; cursor: pointer; color: #555; }
                .search-btn { padding: 0 20px; background: #007BFF; color: white; border: none; cursor: pointer; font-size: 16px; transition: 0.3s; }
                .search-btn:hover { background: #0056b3; }

                /* FLOATING GPS BUTTON */
                .near-me-btn { position: absolute; top: 20px; right: 20px; z-index: 1000; padding: 12px 20px; background: #007BFF; color: white; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: 0.3s; }
                .near-me-btn:hover { transform: scale(1.05); background: #0056b3; }

                /* DESKTOP SIDEBAR */
                .sidebar-box { flex: 1; padding: 20px; background: #fff; border-radius: 15px; border: 1px solid #ddd; overflow-y: auto; height: 100%; }

                /* SMARTPHONE RESPONSIVE OVERRIDES */
                @media (max-width: 768px) {
                    .home-layout { flex-direction: column; height: auto; overflow-y: visible; padding: 5px; }
                    .map-container-box { flex: none; height: 55vh; width: 100%; border-radius: 10px; }
                    .sidebar-box { flex: none; width: 100%; height: auto; margin-top: 10px; padding: 15px; box-sizing: border-box; box-shadow: none; border: 1px solid #eee; }
                    .search-box { top: 10px; left: 5%; width: 90%; flex-direction: column; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .search-input { width: 100%; box-sizing: border-box; border-bottom: 1px solid #eee; padding: 10px; }
                    .category-dropdown { width: 100%; border-left: none; border-bottom: 1px solid #eee; padding: 10px; }
                    .search-btn { width: 100%; padding: 12px; border-radius: 0 0 15px 15px; }
                    .near-me-btn { top: auto; bottom: 20px; right: 10px; font-size: 13px; padding: 8px 15px; opacity: 0.9; }
                }

                /* ANIMATED BLINKING PIN */
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(255, 51, 51, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 51, 51, 0); }
                }
                .blinking-dot { background-color: #ff3333; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; animation: pulse 1.5s infinite; }
                
                /* TAG STYLING */
                .category-badge { background-color: #e7f3ff; color: #007BFF; padding: 3px 10px; font-size: 11px; border-radius: 12px; font-weight: bold; text-transform: uppercase; }
            `}</style>

            {/* --- LEFT SECTION: MAP & SEARCH --- */}
            <div className="map-container-box">

                {/* Overlay Search Bar */}
                <form onSubmit={handleTextSearch} className="search-box">
                    <input type="text" placeholder="Search area (e.g., Kidangoor)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="category-dropdown">
                        <option value="All">All Types</option>
                        <option value="Tech Meetup">Tech Meetup</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Music & Arts">Music & Arts</option>
                        <option value="Sports">Sports</option>
                        <option value="Food & Drink">Food & Drink</option>
                        <option value="Health & Wellness">Health & Wellness</option>
                        <option value="Business & Networking">Business & Networking</option>
                        <option value="Education & Learning">Education & Learning</option>
                        <option value="Science & Tech">Science & Tech</option>
                        <option value="Community & Culture">Community & Culture</option>
                        <option value="Charity & Causes">Charity & Causes</option>
                        <option value="Gaming & Esports">Gaming & Esports</option>
                        <option value="Fashion & Beauty">Fashion & Beauty</option>
                        <option value="Film & Media">Film & Media</option>
                        <option value="Travel & Outdoors">Travel & Outdoors</option>
                        <option value="Spirituality & Religion">Spirituality & Religion</option>
                        <option value="Book Club">Book Club</option>
                        <option value="Startup Pitch">Startup Pitch</option>
                    </select>
                    <button type="submit" className="search-btn">🔍 Search</button>
                </form>

                {/* GPS Trigger Button */}
                <button onClick={findNearbyEvents} className="near-me-btn">
                    {isSearchingGPS ? "Locating..." : "📍 Near Me"}
                </button>

                {/* Drop Pin Button */}
                <button 
                    onClick={() => setIsManualPinning(!isManualPinning)} 
                    className="near-me-btn" 
                    style={{ right: '140px', backgroundColor: isManualPinning ? '#dc3545' : '#9C27B0' }}
                >
                    {isManualPinning ? "❌ Cancel Pin" : "📌 Drop Pin"}
                </button>

                {/* Leaflet Core Map Component */}
                <MapContainer center={[10.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 1, cursor: isManualPinning ? 'crosshair' : 'grab' }}>
                    <LayersControl position="bottomright">
                        <LayersControl.BaseLayer checked name="Satellite View">
                            <LayerGroup>
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                            </LayerGroup>
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Normal Map">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    <MapController targetLoc={mapTarget} />
                    <ManualPinController />

                    {/* User Location Visuals */}
                    {userLoc && (
                        <>
                            <Circle
                                center={[userLoc.lat, userLoc.lng]}
                                radius={radiusKm * 1000}
                                pathOptions={{ 
                                    fillColor: locSource === 'MANUAL' ? '#9C27B0' : '#4285F4', 
                                    color: locSource === 'MANUAL' ? '#9C27B0' : '#4285F4', 
                                    weight: 1.5, fillOpacity: 0.12 
                                }}
                            />
                            <CircleMarker
                                eventHandlers={{ click: handleManualUnpin }}
                                center={[userLoc.lat, userLoc.lng]}
                                radius={locSource === 'MANUAL' ? 10 : 8}
                                pathOptions={{ 
                                    fillColor: locSource === 'MANUAL' ? '#9C27B0' : '#4285F4', 
                                    color: '#ffffff', weight: 2, fillOpacity: 1 
                                }}
                            >
                                <Popup>
                                    <strong>{locSource === 'MANUAL' ? '📌 Manually Pinned Location' : '📍 You are here'}</strong>
                                    {locSource === 'MANUAL' && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Click this circle to unpin.</p>}
                                </Popup>
                            </CircleMarker>
                        </>
                    )}

                    {/* Road Routing Line */}
                    {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#ff3333" weight={5} opacity={0.8} />}

                    {/* Event Markers with Detailed Tooltips */}
                    {displayedEvents.map(event => (
                        <Marker
                            key={event._id}
                            position={[event.location.lat, event.location.lng]}
                            icon={hoveredEventId === event._id ? blinkingIcon : new L.Icon.Default()}
                            zIndexOffset={hoveredEventId === event._id ? 1000 : 0}
                        >
                            <Popup>
                                <div style={{ minWidth: '230px', padding: '5px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#007BFF', fontSize: '18px' }}>{event.title}</h3>

                                        {/* THE DETAILED INFO TOOLTIP LOGIC */}
                                        <div style={{ position: 'relative', display: 'inline-block' }}
                                            onMouseEnter={(e) => { e.currentTarget.querySelector('.info-card').style.display = 'block'; }}
                                            onMouseLeave={(e) => { e.currentTarget.querySelector('.info-card').style.display = 'none'; }}
                                        >
                                            <div style={{ backgroundColor: '#e7f3ff', color: '#007BFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '1px solid #007BFF', cursor: 'help' }}>i</div>

                                            <div className="info-card" style={{ display: 'none', position: 'absolute', top: '-10px', left: '30px', width: '300px', maxHeight: '350px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 9999 }}>
                                                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Event Overview</h4>
                                                <div style={{ fontSize: '12px', color: '#444', lineHeight: '1.6' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>🏷️ Category:</strong> {event.eventType}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>📍 Location:</strong> {event.location.address}</p>
                                                    <p style={{ margin: '0 0 10px 0' }}><strong>📝 Desc:</strong> {event.description}</p>
                                                    {event.regLink && (
                                                        <a href={event.regLink} target="_blank" rel="noreferrer" style={{ color: '#28a745', fontWeight: 'bold', textDecoration: 'none', display: 'block', marginTop: '10px' }}>Register Now →</a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '13px', margin: '5px 0', color: '#666' }}>📍 {event.location.address}</p>

                                    {/* NEW: Conditional Display Logic for Interest Count */}
                                    {event.showInterestCount !== false && (
                                        <p style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#333', fontWeight: 'bold' }}>⭐ {event.interestedUsers?.length || 0} People Interested</p>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {user && (
                                            <button
                                                onClick={() => handleInterest(event._id, event.title)}
                                                style={{ padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                Mark Interested
                                            </button>
                                        )}
                                        <button
                                            onClick={() => getRoute(event.location.lat, event.location.lng, event._id)}
                                            style={{ padding: '8px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            🧭 Navigation Route
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* --- RIGHT SECTION: RADIUS & NEARBY LIST --- */}
            {userLoc && (
                <div className="sidebar-box">
                    {/* Interactive Radius Slider */}
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>📍 Search Distance</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input
                                type="range"
                                min="1" max="100"
                                value={radiusKm}
                                onChange={e => setRadiusKm(Number(e.target.value))}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <div style={{ background: '#fff', padding: '5px 10px', borderRadius: '5px', border: '1px solid #ccc', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
                                {radiusKm} km
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '18px', borderBottom: '2px solid #007BFF', paddingBottom: '8px', marginBottom: '15px' }}>
                        Nearby Events ({radiusKm}km)
                    </h3>

                    {displayedNearbyEvents.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center', marginTop: '30px' }}>No events found. Try increasing the radius.</p>
                    ) : (
                        displayedNearbyEvents.map(event => (
                            <div
                                key={event._id}
                                onMouseEnter={() => setHoveredEventId(event._id)}
                                onMouseLeave={() => setHoveredEventId(null)}
                                style={{
                                    padding: '15px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    backgroundColor: hoveredEventId === event._id ? '#f0f7ff' : '#fff',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '10px',
                                    marginBottom: '8px'
                                }}
                            >
                                <span className="category-badge">{event.eventType}</span>
                                <h4 style={{ margin: '8px 0 5px 0', color: '#007BFF', fontSize: '16px' }}>{event.title}</h4>
                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{event.location.address}</p>
                                
                                {/* NEW: Conditional Display on the Sidebar panel too */}
                                {event.showInterestCount !== false && (
                                    <p style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>👥 {event.interestedUsers?.length || 0} Interested</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}