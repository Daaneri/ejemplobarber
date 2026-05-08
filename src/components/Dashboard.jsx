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
  LogOut,
  CheckCircle,
  Activity
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

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
        customClass: { popup: 'rounded-[2.5rem]' }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Contraseña incorrecta',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
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
      customClass: { popup: 'rounded-[2.5rem]' }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-b-[12px] border-indigo-600">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock className="text-indigo-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 italic tracking-tighter">admin<span className="text-indigo-600">.barber</span></h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 text-center">Panel de Gestión</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Clave de acceso" 
              className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 ring-indigo-200 text-center font-bold text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95">
              <LogIn className="w-5 h-5" /> ENTRAR AHORA
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER IDÉNTICO */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 px-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter lowercase italic">
              admin<span className="text-indigo-600">.barber</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
              Gestión de Turnos Real-Time
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
             <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <input 
                  type="date" 
                  className="bg-transparent outline-none text-xs font-black text-slate-900 uppercase" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                />
             </div>
             <button onClick={() => setIsAuthenticated(false)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
          
          {/* COLUMNA IZQUIERDA: STATS */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
               <Activity className="w-4 h-4 text-indigo-600" /> Resumen Hoy
            </h3>

            <div className="space-y-4 mb-8">
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest relative z-10">Turnos Totales</p>
                  <div className="text-4xl font-black text-slate-900 relative z-10">{appointments.length}</div>
                  <Users className="w-8 h-8 text-indigo-50 absolute right-6 bottom-6 group-hover:scale-110 transition-transform" />
               </div>

               <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-100 text-white">
                  <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Caja Estimada</p>
                  <div className="text-3xl font-black italic">$ {(appointments.length * 10000).toLocaleString()}</div>
                  <TrendingUp className="w-8 h-8 opacity-20 absolute right-12 mt-[-30px]" />
               </div>
            </div>

            <div className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-[2rem] mt-auto">
               <p className="text-[10px] font-bold text-slate-400 uppercase text-center leading-relaxed">
                  Villa Constitución<br/>
                  <span className="text-slate-900 font-black italic lowercase tracking-tighter text-sm">daaneri.dev</span>
               </p>
            </div>
          </div>

          {/* COLUMNA DERECHA: LISTADO (Ocupa 3/4) */}
          <div className="w-full md:w-3/4 p-6 md:p-10">
            <div className="flex justify-between items-center mb-10">
               <h2 className="text-2xl font-black tracking-tight uppercase">
                  Agenda: <span className="text-indigo-600 italic font-black">{selectedDate.split('-').reverse().slice(0,2).join('/')}</span>
               </h2>
               <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-green-600 uppercase">Live Sinc</span>
               </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                <div className="text-4xl font-black text-slate-200 italic tracking-tighter">Cargando...</div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-100 rounded-[3rem]">
                <Clock className="w-12 h-12 text-slate-100 mb-4" />
                <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Sin turnos para esta fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:bg-indigo-600 transition-colors">
                        <span className="text-[9px] font-bold opacity-60 leading-none">HORA</span>
                        <span className="text-sm font-black">{apt.hora.substring(0, 5)}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{apt.cliente}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">{apt.servicio}</span>
                          <span className="text-slate-400 text-[9px] font-bold flex items-center gap-1"><Smartphone className="w-3 h-3" /> {apt.telefono}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => openWhatsApp(apt.telefono)}
                        className="p-3 bg-white text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-slate-100 shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(apt.id, apt.cliente)}
                        className="p-3 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-slate-100 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER PROFESIONAL IGUAL AL TURNERO */}
        <footer className="mt-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 px-6">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black text-slate-900 lowercase italic">
              admin<span className="text-indigo-600">.barber</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Control Total de Agenda • Real-Time
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-400 font-medium">© 2026 ejemplo.barber — Villa Constitución, Santa Fe.</p>
            <p className="text-[9px] text-slate-900 font-bold uppercase tracking-tighter mt-1">SaaS Desarrollado por Daaneri</p>
          </div>
        </footer>
      </div>
    </div>
  );
}