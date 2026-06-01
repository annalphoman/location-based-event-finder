import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Attendee' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://event-sphere-uk4j.onrender.com/api/auth/register', formData);
            alert(formData.role === 'Organizer'
                ? "Application sent! Please wait for Admin (Garry) to approve your organization."
                : "Registration successful! You can now login.");
            navigate('/login');
        } catch (err) { alert("Registration failed. Email might already exist."); }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px' }}>
            <h2 style={{ textAlign: 'center' }}>Create Account</h2>
            <form onSubmit={handleRegister}>
                <input type="text" placeholder="Full Name / Org Name" required onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                <input type="email" placeholder="Email" required onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                <input type="password" placeholder="Password" required onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Register as:</label>
                <select onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '20px' }}>
                    <option value="Attendee">Standard User (Attendee)</option>
                    <option value="Organizer">Organization (Requires Admin Approval)</option>
                </select>

                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                    Sign Up
                </button>
            </form>
        </div>
    );
}