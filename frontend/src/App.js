import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import HomePage from './components/HomePage'; 
import ServiceCard from './components/ServiceCard';
import ServiceInfoPage from './components/ServiceInfoPage';
import ComponentCard from './components/ComponentCard';
import ComponentInfoPage from './components/ComponentInfoPage';

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServiceCard />} />
        <Route path="/services/:serviceName" element={<ServiceInfoPage />} /> 
        <Route path="/components" element={<ComponentCard />} /> 
        <Route path="/components/:id" element={<ComponentInfoPage />} /> 
      </Routes>
    </Router>
  );
}

export default App;