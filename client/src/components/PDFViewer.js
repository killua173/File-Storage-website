import React from 'react';
import { Document, Page } from 'react-pdf';
import './PDFViewer.css'; // Import styles for the PDF viewer

const PDFViewer = ({ fileUrl, onClose }) => {
  return (
    <div className="pdf-viewer">
      <div className="pdf-header">
        <button onClick={onClose}>Close</button>
      </div>
      <div className="pdf-document">
        <Document file={fileUrl}>
          <Page pageNumber={1} />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
