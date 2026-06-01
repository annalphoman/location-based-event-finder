import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function InterestedEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) return;
        axios.get('https://event-sphere-uk4j.onrender.com/api/events')
            .then(res => {
                // Filter events where the interestedUsers array contains the current user ID
                const interested = res.data.filter(event => event.interestedUsers.includes(user._id));
                setEvents(interested);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [user]);

    if (!user) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Please log in to view your interested events.</h2></div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#007BFF', textAlign: 'center', marginBottom: '20px' }}>⭐ My Interested Events</h2>

            {loading ? (
                <p style={{ textAlign: 'center' }}>Loading...</p>
            ) : events.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#555' }}>You haven't marked any events as interested yet. Go <Link to="/">explore events</Link>!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {events.map((event) => (
                        <div key={event._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{event.title}</h3>
                                <span style={{ backgroundColor: '#e7f3ff', color: '#007BFF', padding: '3px 8px', fontSize: '11px', borderRadius: '12px', fontWeight: 'bold' }}>{event.eventType}</span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>📍 {event.location.address}</p>
                            <p style={{ fontSize: '14px', color: '#555', margin: '5px 0' }}>📅 {new Date(event.date).toLocaleDateString()}</p>
                            <p style={{ fontSize: '14px', color: '#444', marginTop: '10px' }}>{event.description}</p>

                            {event.regLink && (
                                <a href={event.regLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '13px' }}>🔗 Registration Link</a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
