import React from 'react';
import './App.css';
import Home from './page/Home';
import Signup from './page/Signup';
import Login from './page/Login';
import POIedit from './page/POIedit';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { queryClient } from './services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider } from './context/AppStateContext';

console.log('🚀 App.js: Application starting');

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div>
          <section>
            <Routes>
              <Route path="/Home" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Login />} />
              <Route path="/POIedit" element={<POIedit />} />
            </Routes>
          </section>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
