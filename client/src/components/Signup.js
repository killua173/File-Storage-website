import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css'; // Import the CSS file for styling

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { username, email, password, password2 } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      console.log(res.data);
      navigate('/Home');
    } catch (err) {
      console.error(err.response);
      if (err.response && err.response.status === 400) {
        setError('User already exists. Please use a different email or username.'); // Display specific error message
      } else {
        setError('Something went wrong. Please try again.'); // Generic error message
      }
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>Sign Up</h2>
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
          type="email" 
          name="email" 
          value={email} 
          onChange={onChange} 
          placeholder="Email" 
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
        <input 
          type="password" 
          name="password2" 
          value={password2} 
          onChange={onChange} 
          placeholder="Confirm Password" 
          required 
        />
        <button type="submit">Sign Up</button>
        <p className="login-link">Already have an account? <Link to="/Home">Log In</Link></p>
      </form>
    </div>
  );
};

export default Signup;
