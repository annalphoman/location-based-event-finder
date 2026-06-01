import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const initialUser = JSON.parse(localStorage.getItem('user'));
    const [user, setUser] = useState(initialUser);
    const [myEvents, setMyEvents] = useState([]);

    // NEW: Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');

    useEffect(() => {
        if (user?.role === 'Organizer') fetchMyEvents();
    }, [user?._id, user?.role]);

    const fetchMyEvents = () => {
        axios.get('https://event-sphere-uk4j.onrender.com/api/events')
            .then(res => setMyEvents(res.data.filter(e => e.organizer?._id === user._id)))
            .catch(err => console.error(err));
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await axios.delete(`https://event-sphere-uk4j.onrender.com/api/events/${eventId}`);
            setMyEvents(myEvents.filter(event => event._id !== eventId));
        } catch (error) { console.error(error); }
    };

    // NEW: Save the updated profile to the database and localStorage
    const handleSaveProfile = async () => {
        try {
            const res = await axios.put('https://event-sphere-uk4j.onrender.com/api/auth/update', {
                userId: user._id,
                newName: editName
            });

            // Keep the security token but update the user details
            const updatedUser = { ...res.data, token: user.token };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
            <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #007BFF', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>👤 Account Settings</h2>
                    <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={styles.editBtn}>
                        {isEditing ? '💾 Save Changes' : '✏️ Edit Profile'}
                    </button>
                </div>

                {isEditing ? (
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Name: </strong>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                ) : (
                    <p style={{ fontSize: '18px', margin: '5px 0' }}><strong>Name:</strong> {user?.name}</p>
                )}

                {/* NEW: Display previous name if Organizer changed it */}
                {user?.role === 'Organizer' && user?.previousName && (
                    <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', margin: '0 0 10px 0' }}>
                        (Previously known as: {user.previousName})
                    </p>
                )}

                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account Type:</strong> <span style={styles.badge}>{user?.role}</span></p>
            </div>

            {user?.role === 'Organizer' && (
                <div style={{ marginTop: '30px' }}>
                    <h3>🛠️ Manage Your Posted Events</h3>
                    {myEvents.map(event => (
                        <div key={event._id} style={styles.eventItem}>
                            <div>
                                <strong>{event.title}</strong>
                                <p style={{ fontSize: '12px', color: '#555' }}>📍 {event.location?.address}</p>
                                <p style={{ fontSize: '12px', color: '#28a745' }}>👥 {event.interestedUsers?.length || 0} Interested</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => navigate(`/edit-event/${event._id}`)} style={styles.editEventBtn}>✏️ Edit</button>
                                <button onClick={() => handleDelete(event._id)} style={styles.deleteBtn}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    badge: { marginLeft: '10px', backgroundColor: '#e7f3ff', color: '#007BFF', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    eventItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' },
    deleteBtn: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    editEventBtn: { backgroundColor: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    editBtn: { backgroundColor: '#f0f0f0', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};