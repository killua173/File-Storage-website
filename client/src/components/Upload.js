import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/Home');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { 'x-auth-token': token },
        });

        if (!res.data.valid) {
          localStorage.removeItem('token');
          console.log("not valid1")
          navigate('/Home');
        }
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/Home');
      }
    };

    checkToken();
  }, [navigate]);

  const onChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setUploadPercentage(0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('No file selected!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token'); // Retrieve token from local storage
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token, // Include token in headers
        },
        onUploadProgress: (progressEvent) => {
          setUploadPercentage(
            parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
          );
        },
      });

      setMessage(res.data.msg);
      setUploadPercentage(0);
    } catch (err) {
      if (err.response.status === 500) {
        setMessage('There was a problem with the server');
      } else {
        setMessage(err.response.data.msg);
      }
      setUploadPercentage(0);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={onSubmit}>
        <h2>Upload a File</h2>
        {message && <p className="message">{message}</p>}
        <input type="file" onChange={onChange} />
        <button type="submit">Upload</button>
        {uploadPercentage > 0 && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${uploadPercentage}%` }}></div>
          </div>
        )}
      </form>
      <div className="supported-files">
        <h3>Supported file types:</h3>
        <p>JPEG, JPG, PNG, GIF, PDF, DOC, DOCX</p>
      </div>
    </div>
  );
};

export default Upload;
