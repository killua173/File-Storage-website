import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css'; // Assuming you have a CSS file for styling

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setMessage('File uploaded successfully.');
      setUploadProgress(0);
      setFile(null);
    } catch (err) {
      setMessage('Error uploading file.');
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit} className="upload-form">
        <h2>Upload Files</h2>
        {message && <p className="message">{message}</p>}
        <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt" />
        <button type="submit">Upload</button>
        {uploadProgress > 0 && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
        <p className="supported-files">Supported file types: .jpg, .jpeg, .png, .pdf, .doc, .docx, .txt</p>
      </form>
    </div>
  );
};

export default FileUpload;
