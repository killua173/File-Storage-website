import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Storage-Site</Link>
      </div>
      <ul className="navbar-list">
        {!token && (
          <>
            <li className="navbar-item">
              <Link to="/">Log In</Link>
            </li>
            <li className="navbar-item">
              <Link to="/signup">Signup</Link>
            </li>
          </>
        )}
        {token && (
          <>
            <li className="navbar-item">
              <Link to="/upload">Upload</Link>
            </li>
            <li className="navbar-item">
              <Link to="/folders">Folder Management</Link>
            </li>
            <li className="navbar-item">
              <button onClick={handleLogout} className="navbar-button">Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
