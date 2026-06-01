import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export default function PostEvent() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [formData, setFormData] = useState({
        title: '', description: '', date: '', locationName: '',
        eventType: 'Tech Meetup', regLink: '', lat: null, lng: null
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState([10.5, 76.5]);

    const handleMapSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);

                setMapCenter([newLat, newLng]);
                setFormData({ ...formData, lat: newLat, lng: newLng });
            } else {
                alert("Place not found! Try adding the state or country.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const ChangeMapView = ({ center }) => {
        const map = useMap();
        map.flyTo(center, 16);
        return null;
    };

    const LocationPicker = () => {
        useMapEvents({
            click(e) {
                setFormData({ ...formData, lat: e.latlng.lat, lng: e.latlng.lng });
            },
        });
        return formData.lat === null ? null : (
            <Marker position={[formData.lat, formData.lng]}></Marker>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.lat || !formData.lng) {
            alert("📍 Please search for a location or click on the map to drop a pin!");
            return;
        }

        try {
            await axios.post('https://event-sphere-uk4j.onrender.com/api/events', {
                ...formData,
                location: { address: formData.locationName, lat: formData.lat, lng: formData.lng },
                organizer: user._id
            });
            alert("Event Published to Map!");
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || "Post failed.");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#28a745', textAlign: 'center', marginBottom: '20px' }}>📢 Post New Event</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Event Title" required style={styles.input} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                <textarea placeholder="Description" required style={{ ...styles.input, height: '80px' }} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" required style={{ ...styles.input, flex: 1 }} onChange={e => setFormData({ ...formData, date: e.target.value })} />

                    <select style={{ ...styles.input, flex: 1 }} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
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
                </div>

                <input type="url" placeholder="Registration Link (Optional)" style={styles.input} onChange={e => setFormData({ ...formData, regLink: e.target.value })} />

                <hr style={{ width: '100%', border: '1px solid #eee', margin: '10px 0' }} />

                <h3 style={{ margin: '0', fontSize: '16px' }}>📍 Event Location</h3>
                <input type="text" placeholder="Venue Name (e.g., Main Town Hall)" required style={styles.input} onChange={e => setFormData({ ...formData, locationName: e.target.value })} />

                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                    <input
                        type="text"
                        placeholder="Search city or area to drop pin..."
                        style={{ ...styles.input, flex: 3 }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleMapSearch} style={{ flex: 1, backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Search & Drop Pin 📍
                    </button>
                </div>

                <p style={{ fontSize: '13px', color: '#666', margin: '0' }}>You can also click anywhere on the map to manually move the pin with precision.</p>

                <div style={{ height: '350px', width: '100%', border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>

                        {/* --- CORRECTED LAYER CONTROL TOGGLE --- */}
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

                        <ChangeMapView center={mapCenter} />
                        <LocationPicker />
                    </MapContainer>
                </div>

                <button type="submit" style={styles.button}>Publish Event 🚀</button>
            </form>
        </div>
    );
}

const styles = {
    input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', width: '100%' },
    button: { padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }
};