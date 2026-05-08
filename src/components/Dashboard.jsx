import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  Smartphone, 
  Scissors, 
  Lock, 
  LogIn,
  MessageSquare,
  TrendingUp,
  Users,
  LogOut
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // CONFIGURACIÓN: Cambiá esta clave por la que le darás al barbero
  const MASTER_PASSWORD = 'barbero22'; 

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
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('fecha', selectedDate)
      .order('hora', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }

  const handleDelete = async (id, cliente) => {
    const result = await Swal.fire({
      title: '¿Eliminar turno?',
      text: `Se liberará el horario de ${cliente}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) {
        Swal.fire({ title: 'Borrado', icon: 'success', timer: 1000, showConfirmButton: false });
      }
    }
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  // VISTA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border-b-8 border-indigo-600">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-indigo-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tighter">admin<span className="text-indigo-600">.barber</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Ingresá la clave de gestión</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500 text-center font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
              <LogIn className="w-4 h-4" /> ENTRAR AL PANEL
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA DEL PANEL (LOGUEADO)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <header className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Scissors className="w-5 h-5" />
             </div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">admin<span className="text-indigo-600">.barber</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 p-2 px-4 rounded-2xl border border-slate-200">
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              <input 
                type="date" 
                className="bg-transparent outline-none text-xs font-black text-slate-600 uppercase" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <Users className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Turnos</p>
            <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-indigo-100 shadow-xl text-white">
            <TrendingUp className="w-5 h-5 opacity-60 mb-2" />
            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Caja Est.</p>
            <div className="text-2xl font-black italic">$ {(appointments.length * 10000).toLocaleString()}</div>
          </div>
        </div>

        {/* LISTADO */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Agenda del día</h2>
          
          {loading ? (
            <div className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase italic tracking-tighter text-2xl">Sincronizando...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-white p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
              <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay turnos agendados</p>
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:bg-indigo-600 transition-colors">
                    <span className="text-[10px] font-bold opacity-60 leading-none">HORA</span>
                    <span className="text-sm font-black">{apt.hora.substring(0, 5)}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{apt.cliente}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">{apt.servicio}</span>
                      <span className="text-slate-400 text-[9px] font-bold flex items-center gap-1 uppercase tracking-tighter"><Smartphone className="w-3 h-3 text-indigo-300" /> {apt.telefono}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openWhatsApp(apt.telefono)}
                    className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(apt.id, apt.cliente)}
                    className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 text-center">
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
           Villa Constitución • <span className="text-slate-900 font-black tracking-tighter italic lowercase">daaneri.dev</span>
         </p>
      </footer>
    </div>
  );
}