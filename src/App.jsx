import React from 'react'; // <--- AGREGÁ ESTA LÍNEA
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Turnero from './components/Turnero'; 
import AdminPanel from './AdminPanel'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Turnero />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;