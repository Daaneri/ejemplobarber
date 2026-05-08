import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Turnero from './components/Turnero.jsx'; 
import AdminPanel from './components/AdminPanel.jsx'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta para los clientes de Villa Constitución */}
        <Route path="/" element={<Turnero />} />
        
        {/* Ruta privada para el barbero */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;