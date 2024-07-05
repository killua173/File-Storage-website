import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FolderList = ({ currentFolder, fetchData }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFoldersAndFiles();
  }, [currentFolder]);

  const fetchFoldersAndFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = currentFolder ? `http://localhost:5000/api/folders/${currentFolder}` : 'http://localhost:5000/api/folders';
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token },
      });

      setFolders(res.data.folders);
      setFiles(res.data.files);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="folder-list">
      <h2>Folders</h2>
      <ul>
        {folders.map(folder => (
          <li key={folder._id}>{folder.name}</li>
        ))}
      </ul>
      <h2>Files</h2>
      <ul>
        {files.map(file => (
          <li key={file._id}>{file.filename}</li>
        ))}
      </ul>
    </div>
  );
};

export default FolderList;
