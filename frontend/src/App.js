import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Portfolio from '@/pages/Portfolio';
import AddProject from '@/pages/AddProject';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin/add-project" element={<AddProject />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors
        toastOptions={{
          style: {
            background: '#F5F1E8',
            color: '#000',
            border: '1px solid #E89B6D'
          }
        }}
      />
    </div>
  );
}

export default App;