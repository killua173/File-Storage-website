import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Upload from './components/Upload';
import Home from './components/Home';
import FolderManagement from './components/FolderManagement';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={token ? <Upload /> : <Navigate to="/" />} />
            <Route path="/folders" element={token ? <FolderManagement /> : <Navigate to="/" />} />
            <Route path="*" element={<Home />} /> {/* Wildcard route */}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
