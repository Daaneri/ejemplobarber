import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Smartphone, 
  Scissors,
  LogOut
} from 'lucide-react';

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Cargar turnos y suscribirse a cambios en tiempo real
  useEffect(() => {
    fetchDailyAppointments();
    
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchDailyAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  async function fetchDailyAppointments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('fecha', selectedDate)
      .order('hora', { ascending: true });

    if (!error) {
      setAppointments(data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id, cliente) => {
    const result = await Swal.fire({
      title: `¿Eliminar turno?`,
      text: `Vas a borrar el turno de ${cliente}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) {
        Swal.fire({
          title: 'Eliminado',
          text: 'El horario ha quedado libre.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  };

  // Cálculo de estadísticas rápidas
  const recaudacionEstimada = appointments.length * 10000; // Ajustar según tus precios promedio

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER PANEL */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
              admin<span className="text-indigo-600">.barber</span>
            </h1>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.3em]">Gestión de Agenda</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 w-full sm:w-auto">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <input 
                type="date" 
                className="outline-none text-sm font-bold text-slate-700 bg-transparent"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button 
              onClick={() => window.location.href = '/'} 
              className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Salir al sitio
            </button>
          </div>
        </header>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Turnos Agendados</p>
            <div className="text-4xl font-black text-slate-900">{appointments.length}</div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl text-white">
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Caja Estimada</p>
            <div className="text-4xl font-black">${recaudacionEstimada.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-center">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-sm">Sincronizado</span>
                </div>
             </div>
          </div>
        </div>

        {/* TABLA DE TURNOS */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6">
            <h2 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Próximos Clientes
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-20 text-center text-slate-300 font-black uppercase tracking-tighter text-xl animate-pulse">
                Actualizando Agenda...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-20 text-center">
                <Scissors className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No hay turnos para este día.</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="p-6 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50 transition-all gap-4">
                  <div className="flex items-center gap-6 w-full">
                    <div className="bg-indigo-50 text-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm">
                      {apt.hora.substring(0, 5)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base uppercase tracking-tight">{apt.cliente}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black rounded-lg uppercase">Confirmado</span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-indigo-400" /> {apt.telefono}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                          <Scissors className="w-3 h-3 text-indigo-400" /> {apt.servicio}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleDelete(apt.id, apt.cliente)}
                      className="flex-1 sm:flex-none p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-xs"
                    >
                      <Trash2 className="w-5 h-5" /> 
                      <span className="sm:hidden uppercase">Eliminar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER DESARROLLADOR */}
        <footer className="mt-12 text-center pb-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            SaaS de Gestión — Desarrollado por <span className="text-slate-900 font-black">Daaneri</span>
          </p>
        </footer>
      </div>
    </div>
  );
}