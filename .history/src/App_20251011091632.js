import React from 'react';
import './App.css';
import Home from './page/Home';

import Login from './page/Login';
import POIedit from './page/POIedit';
import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { queryClient } from './services/queryClient';

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
