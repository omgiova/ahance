import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Portfolio from '@/pages/Portfolio';
import AddProject from '@/pages/AddProject';
import AdminDashboard from '@/pages/AdminDashboard';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add-project" element={<AddProject />} />
          <Route path="/admin/edit-project/:id" element={<AddProject />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors
        toastOptions={{
          style: {
            background: '#fffeec',
            color: '#000',
            border: '1px solid #e38e4d'
          }
        }}
      />
    </div>
  );
}

export default App;