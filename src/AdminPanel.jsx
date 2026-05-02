import React, { useState, useEffect } from 'react';
import { supabase } from "./supabaseClient";

export default function AdminPanel() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const date = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAppointments();
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchAppointments() {
    const { data } = await supabase.from('appointments').select('*').eq('fecha', date).order('hora', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-700">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <span className="font-bold text-xl tracking-tight">TurnoApp</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-semibold transition-all">
            <span>📅</span> Turnos
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            <span>⚙️</span> Configuración
          </button>
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">Plan gratuito</p>
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Mis turnos</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-all text-indigo-600">
              Ver mi página
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
              Copiar link
            </button>
          </div>
        </header>

        {/* Tarjetas de Resumen (Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[ {t: 'Hoy', v: appointments.length, c: 'bg-indigo-500'}, {t: 'Pendientes', v: '-', c: 'bg-slate-900'}, {t: 'Confirmados', v: '-', c: 'bg-slate-900'}, {t: 'Este mes', v: '-', c: 'bg-slate-900'} ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-4">{stat.t}</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">{stat.v}</span>
                <div className={`h-1 w-8 rounded-full ${stat.c}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-8">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Fecha</label>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-100" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Estado</label>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option>Todos</option>
            </select>
          </div>
          <button className="mt-5 px-4 py-2 text-slate-500 text-sm font-semibold hover:bg-slate-50 rounded-lg">Limpiar filtros</button>
        </div>

        {/* Listado de Turnos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Listado de turnos</h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-20 text-center text-slate-400 italic">Cargando turnos...</div>
            ) : appointments.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic text-sm">No hay turnos para la fecha seleccionada</div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {apt.hora.split(':')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{apt.cliente}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{apt.hora} hs • {apt.servicio || 'Servicio'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${apt.telefono}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm font-bold">WhatsApp</a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}