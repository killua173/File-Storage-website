import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import './FolderManagement.css';
import MoveModal from './MoveModal';
import FolderList from './FolderList'; // Import the FolderList component
import PDFViewer from './PDFViewer'; // Import the PDFViewer component

const FolderManagement = () => {
  const [folders, setFolders] = useState([]); // State for folders
  const [files, setFiles] = useState([]); // State for files
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false); // State for PDF viewer
  const [pdfFileUrl, setPdfFileUrl] = useState(''); // State to hold PDF file URL
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
          navigate('/Home');
        }
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/Home');
      }
    };

    checkToken();
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const delayedSearch = debounce(handleSearch, 300);
    return () => {
      delayedSearch.cancel();
    };
  }, []);

  const fetchData = async (folderId = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = folderId ? `http://localhost:5000/api/folders/${folderId}` : 'http://localhost:5000/api/folders';
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token },
      });

      setCurrentFolder(folderId);
      setFolders(res.data.folders);
      setFiles(res.data.files);

      if (folderId) {
        const parentRes = await axios.get(`http://localhost:5000/api/folders/parent/${folderId}`, {
          headers: { 'x-auth-token': token },
        });
        setParentFolder(parentRes.data.parentFolder);
      } else {
        setParentFolder(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createFolder = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/folders', { name: newFolderName, parentId: currentFolder }, {
        headers: { 'x-auth-token': token },
      });

      setFolders([...folders, res.data]);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileIcon = (mimetype) => {
    switch (mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return '🖼️';
      case 'application/pdf':
        return '📄';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '📃';
      default:
        return '📁';
    }
  };

  const handleFolderIcon = () => '📁';

  const openRenameModal = (item) => {
    const itemType = item.filename ? 'file' : 'folder';
    setSelectedItem({ ...item, itemType });
    setNewItemName(item.name || item.filename);
    setRenameModalOpen(true);
  };

  const openMoveModal = (item) => {
    const itemType = item.filename ? 'file' : 'folder';
    setSelectedItem({ ...item, itemType });
    setMoveModalOpen(true);
  };

  const openDeleteModal = (item) => {
    const itemType = item.filename ? 'file' : 'folder';
    setSelectedItem({ ...item, itemType });
    setDeleteModalOpen(true);
  };

  const renameItem = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/folders/rename`,
        { itemId: selectedItem._id, itemType: selectedItem.itemType, newName: newItemName },
        {
          headers: { 'x-auth-token': token },
        }
      );
      fetchData(currentFolder);
      setRenameModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/folders/${selectedItem._id}`, {
        headers: { 'x-auth-token': token },
        params: { itemType: selectedItem.itemType }
      });
      fetchData(currentFolder);
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const navigateFolder = async (folderId) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/folders/${folderId}`;
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token },
      });
  
      setCurrentFolder(folderId);
      setFolders(res.data.folders);
      setFiles(res.data.files);
  
      const parentRes = await axios.get(`http://localhost:5000/api/folders/parent/${folderId}`, {
        headers: { 'x-auth-token': token },
      });
      setParentFolder(parentRes.data.parentFolder);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (item) => {
    const itemType = item.filename ? 'file' : 'folder';
    if (selectedItem && selectedItem._id === item._id) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ ...item, itemType });
    }
  };

  const handleItemDoubleClick = (item) => {
    if (item.name) {
      navigateFolder(item._id);
    }
  };

  const goBack = async () => {
    try {
      const token = localStorage.getItem('token');
      if (parentFolder) {
        const url = `http://localhost:5000/api/folders/${parentFolder._id}`;
        const res = await axios.get(url, {
          headers: { 'x-auth-token': token },
        });

        setCurrentFolder(parentFolder._id);
        setFolders(res.data.folders);
        setFiles(res.data.files);

        const grandparentRes = await axios.get(`http://localhost:5000/api/folders/parent/${parentFolder._id}`, {
          headers: { 'x-auth-token': token },
        });
        setParentFolder(grandparentRes.data.parentFolder);
      } else {
        fetchData(); // Fetch root data if no parent folder
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (searchTerm) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      if (!searchTerm) {
        fetchData();
        return;
      }

      const response = await axios.get('http://localhost:5000/api/folders/search', {
        params: { search: searchTerm },
        headers: { 'x-auth-token': token }
      });
      
      setFolders(response.data.folders);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error during search request:', error.message);
    }
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);
    handleSearch(searchTerm);
  };

  const generateDownloadLink = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/folders/generate-download-link', {
        itemId: selectedItem._id,
        itemType: selectedItem.itemType,
      }, {
        headers: { 'x-auth-token': token },
      });

      const { link } = res.data;
      setDownloadLink(link);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(downloadLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const openPdfViewer = async (item) => {
    if (item.filename && item.mimetype === 'application/pdf') {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/folders/generate-download-link', {
        itemId: item._id,
        itemType: 'file',
      }, {
        headers: { 'x-auth-token': token },
      });

      const { link } = res.data;
      setPdfFileUrl(link);
      setPdfViewerOpen(true);
    }
  };


  return (
    <div className="folder-management-container">
      <div className="sidebar">
        <h2>Folders and Files</h2>
        {currentFolder && <button onClick={goBack}>Back</button>}
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search folders and files..."
          className="search-input"
        />
        <FolderList currentFolder={currentFolder} parentFolder={parentFolder} fetchData={fetchData} />
        {selectedItem && (
          <div className="item-actions">
            <button className="small-button" onClick={() => openRenameModal(selectedItem)}>Rename</button>
            <button className="small-button" onClick={() => openMoveModal(selectedItem)}>Move</button>
            <button className="small-button" onClick={() => openDeleteModal(selectedItem)}>Delete</button>
            <button className="small-button" onClick={generateDownloadLink}>Generate Download Link</button>
          </div>
        )}
        {downloadLink && (
          <div className="download-link">
            <input type="text" value={downloadLink} readOnly />
            <button onClick={copyToClipboard}>Copy Link</button>
          </div>
        )}
        <div className="create-folder">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
          />
          <button className="small-button" onClick={createFolder}>Create Folder</button>
        </div>
      </div>
      <div className="files-section">
        <h2>Items</h2>
        <div className="file-grid">
          {[...folders, ...files].map((item) => (
            <div
              key={item._id}
              className={`file ${selectedItem && selectedItem._id === item._id ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
              onDoubleClick={() => handleItemDoubleClick(item)}
            >
              <div className="file-icon">
                {item.name ? handleFolderIcon() : handleFileIcon(item.mimetype)}
              </div>
              <div className="file-name">{item.name || item.filename}</div>
            </div>
          ))}
        </div>
      </div>

      {renameModalOpen && (
        <div className="modal">
          <h2>Rename Item</h2>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New name"
          />
          <button onClick={renameItem}>Rename</button>
          <button onClick={() => setRenameModalOpen(false)}>Cancel</button>
        </div>
      )}

      {moveModalOpen && (
        <MoveModal
          selectedItem={selectedItem}
          onClose={() => setMoveModalOpen(false)}
          onMove={() => fetchData(currentFolder)}
        />
      )}

      {deleteModalOpen && (
        <div className="modal">
          <h2>Are you sure you want to delete this item?</h2>
          <button onClick={deleteItem}>Delete</button>
          <button onClick={() => setDeleteModalOpen(false)}>Cancel</button>
        </div>
      )}

      {pdfViewerOpen && (
        <PDFViewer fileUrl={pdfFileUrl} onClose={() => setPdfViewerOpen(false)} />
      )}
    </div>
  );
};

export default FolderManagement;
