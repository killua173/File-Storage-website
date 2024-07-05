import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { username, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token); // Store token in localStorage
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.msg || 'Server error'); // Display server error message
    }

    return (
      <div>
        <h1>Home</h1>
        <nav>
          <ul>
            <li><Link to="/signup">Sign Up</Link></li>
            <li><Link to="/upload">Upload</Link></li>
            <li><Link to="/folder-management">Folder Management</Link></li>
          </ul>
        </nav>
      </div>
    );

  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <input
          type="text"
          name="username"
          value={username}
          onChange={onChange}
          placeholder="Username"
          required
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          placeholder="Password"
          required
        />
        <button type="submit">Log In</button>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  );
};



export default Home;
