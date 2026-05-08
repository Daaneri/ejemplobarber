import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { Trash2, Calendar as CalendarIcon, Clock, Smartphone, Scissors, Lock, LogIn } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // CLAVE MAESTRA (Cambiá 'admin123' por la que quieras)
  const MASTER_PASSWORD = 'tu_clave_aca'; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Acceso concedido al panel de ejemplo.barber',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Contraseña incorrecta',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDailyAppointments();
      const channel = supabase.channel('admin_realtime').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchDailyAppointments();
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedDate, isAuthenticated]);

  async function fetchDailyAppointments() {
    setLoading(true);
    const { data } = await supabase.from('appointments').select('*').eq('fecha', selectedDate).order('hora', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }

  // --- VISTA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-indigo-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 italic">admin<span className="text-indigo-600">.barber</span></h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Ingresá la clave de acceso</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500 text-center font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all">
              <LogIn className="w-4 h-4" /> ENTRAR AL PANEL
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- EL RESTO DEL CÓDIGO (TABLA, FETCH, ETC) VA ACÁ ABAJO IGUAL QUE ANTES ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800">
      {/* ... (Todo el contenido del return que ya tenías) ... */}
    </div>
  );
}