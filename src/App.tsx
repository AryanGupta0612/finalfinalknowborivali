import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resources from './pages/Resources';
import AddResource from './pages/AddResource';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/add-resource" element={<AddResource />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;