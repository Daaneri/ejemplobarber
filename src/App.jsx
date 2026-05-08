import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Turnero from './components/Turnero'; // Tu archivo principal
import AdminPanel from './components/AdminPanel'; // El archivo nuevo

function App() {
  return (
    <Router>
      <Routes>
        {/* Esta es la ruta que ya tenías para los clientes */}
        <Route path="/" element={<Turnero />} />
        
        {/* ESTA ES LA RUTA QUE TENÉS QUE AGREGAR PARA EL BARBERO */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;