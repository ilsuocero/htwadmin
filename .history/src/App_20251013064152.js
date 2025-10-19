import React from 'react';
import './App.css';
import Home from './page/Home';
import Signup from './page/Signup';
import Login from './page/Login';
import POIedit from './page/POIedit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { queryClient } from './services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider } from './context/AppStateContext'; // ADD THIS

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider> {/* WRAP WITH STATE PROVIDER */}
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/POIedit" element={<POIedit />} />
          </Routes>
        </Router>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

    </QueryClientProvider>
  );
}

export default App;
