import { useState } from 'react';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 1. Send request to backend
            const response = await axios.post('https://event-sphere-uk4j.onrender.com/api/auth/login', { email, password });

            // 2. Save the ENTIRE user object (including role and isApproved) to browser memory
            localStorage.setItem('user', JSON.stringify(response.data));

            alert(`Success! Logged in as ${response.data.name}`);

            // 3. Force page refresh to update the App.jsx Navbar
            window.location.href = "/";

        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Failed: Please check your credentials or backend connection.");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    Sign In
                </button>
            </form>
        </div>
    );
}