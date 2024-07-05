import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MoveModal = ({ selectedItem, onClose, onMove }) => {
  const [targetFolderId, setTargetFolderId] = useState('');
  const [availableFolders, setAvailableFolders] = useState([]);

  useEffect(() => {
    fetchAvailableFolders();
  }, []);

  const fetchAvailableFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/folders', {
        headers: { 'x-auth-token': token },
      });
      setAvailableFolders(res.data.folders);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const handleMove = async () => {
    try {
      const token = localStorage.getItem('token');
      const { _id: itemId } = selectedItem;
      const itemType = selectedItem.filename ? 'file' : 'folder'; // Determine item type

      // Construct payload based on selected target folder
      let payload;
      if (targetFolderId === 'mainMenu') {
        // Move to main menu option
        payload = { itemId, itemType, targetFolderId: null }; // Adjust to your backend logic
      } else {
        // Move to selected folder
        payload = { itemId, itemType, targetFolderId };
      }

      await axios.put('http://localhost:5000/api/folders/move', payload, {
        headers: { 'x-auth-token': token },
      });

      // Refresh data after move
      onMove();
      onClose();
    } catch (err) {
      console.error('Error moving item:', err);
    }
  };

  return (
    <div className="move-modal-overlay">
      <div className="move-modal">
        <h2>Move {selectedItem.filename ? 'File' : 'Folder'}</h2>
        <select value={targetFolderId} onChange={(e) => setTargetFolderId(e.target.value)}>
          <option value="">Select target folder</option>
          {availableFolders.map((folder) => (
            <option key={folder._id} value={folder._id} disabled={folder._id === selectedItem._id}>
              {folder.name}
            </option>
          ))}
          <option value="mainMenu">Main Menu</option> {/* Option to move to main menu */}
        </select>
        <div className="move-modal-buttons">
          <button className="move-button" onClick={handleMove}>Move</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
