// Stub for @react-pdf/renderer
import React from 'react';

// Mock basic components
export const Document = ({ children }) => React.createElement('div', { className: 'pdf-document' }, children);
export const Page = ({ children, style }) => React.createElement('div', { className: 'pdf-page', style }, children);
export const View = ({ children, style }) => React.createElement('div', { className: 'pdf-view', style }, children);
export const Text = ({ children, style }) => React.createElement('p', { className: 'pdf-text', style }, children);
export const Image = ({ src, style }) => React.createElement('img', { className: 'pdf-image', src, style });
export const Link = ({ children, src }) => React.createElement('a', { className: 'pdf-link', href: src }, children);

// Mock the StyleSheet utility
export const StyleSheet = {
  create: (styles) => styles
};

// Mock the pdf functionality
export const pdf = {
  create: async () => ({
    toBlob: async () => new Blob(['mock-pdf-content'], { type: 'application/pdf' }),
    toBuffer: async () => Buffer.from('mock-pdf-content'),
    toString: async () => 'mock-pdf-content',
    save: async () => console.log('PDF save method called (stub)')
  })
};

// Mock Font registration
export const Font = {
  register: ({ family, src }) => {
    console.log(`Registered font ${family} (stub)`);
  }
};

// Mock other utilities
export const usePDF = () => [{ loading: false, url: 'data:application/pdf;base64,' }, () => {}];
export const PDFViewer = ({ children }) => React.createElement('div', { className: 'pdf-viewer' }, children);
export const PDFDownloadLink = ({ children }) => React.createElement('a', { className: 'pdf-download' }, children);
export const BlobProvider = ({ children }) => React.createElement('div', { className: 'pdf-blob-provider' }, children); 