import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  Trash2, Calendar as CalendarIcon, Clock, Smartphone, Scissors, 
  Lock, LogIn, MessageSquare, TrendingUp, Users, LogOut, Activity, Save, CheckCircle2, XCircle
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('agenda'); 
  const [appointments, setAppointments] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const MASTER_PASSWORD = 'barbero22'; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      Swal.fire({ title: '¡Bienvenido!', icon: 'success', timer: 1000, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Error', text: 'Clave incorrecta', icon: 'error' });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'agenda') fetchDailyAppointments();
      if (activeTab === 'config') fetchConfig();
    }
  }, [selectedDate, isAuthenticated, activeTab]);

  async function fetchDailyAppointments() {
    setLoading(true);
    const { data } = await supabase.from('appointments').select('*').eq('fecha', selectedDate).order('hora', { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }

  async function fetchConfig() {
    const { data: srv } = await supabase.from('servicios').select('*').order('orden', { ascending: true });
    const { data: hor } = await supabase.from('configuracion_horarios').select('*').order('id', { ascending: true });
    if (srv) setServicios(srv);
    if (hor) setHorarios(hor);
  }

  const handleHorarioChange = (dia, campo, valor) => {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [campo]: valor } : h));
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const promises = horarios.map(h => 
        supabase.from('configuracion_horarios').update({ apertura: h.apertura, cierre: h.cierre, activo: h.activo }).eq('dia', h.dia)
      );
      await Promise.all(promises);
      Swal.fire({ title: 'Guardado', text: 'Configuración actualizada', icon: 'success' });
    } catch (e) {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-b-[12px] border-indigo-600">
          <Lock className="text-indigo-600 w-12 h-12 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-10 italic">admin<span className="text-indigo-600">.barber</span></h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Clave" className="w-full p-5 bg-slate-50 rounded-2xl text-center font-bold text-lg outline-none ring-indigo-100 focus:ring-2" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl">ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 px-4">
          <h1 className="text-4xl font-black italic">admin<span className="text-indigo-600">.barber</span></h1>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('agenda')} className={`font-black uppercase text-xs ${activeTab === 'agenda' ? 'text-indigo-600' : 'text-slate-400'}`}>Agenda</button>
            <button onClick={() => setActiveTab('config')} className={`font-black uppercase text-xs ${activeTab === 'config' ? 'text-indigo-600' : 'text-slate-400'}`}>Configuración</button>
            <button onClick={() => setIsAuthenticated(false)} className="text-red-500 ml-4"><LogOut /></button>
          </div>
        </header>

        {activeTab === 'config' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SERVICIOS */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="font-black uppercase mb-6 flex items-center gap-2"><Scissors className="text-indigo-600" /> Servicios</h3>
              <div className="space-y-4">
                {servicios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="font-black text-xs uppercase">{s.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">$</span>
                      <input type="number" defaultValue={s.precio} className="w-20 p-2 rounded-lg text-center font-black text-xs" onBlur={(e) => supabase.from('servicios').update({ precio: e.target.value }).eq('id', s.id).then(() => fetchConfig())} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HORARIOS */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="font-black uppercase mb-6 flex items-center gap-2"><Clock className="text-indigo-600" /> Horarios Abierto</h3>
              <div className="space-y-3">
                {horarios.length > 0 ? horarios.map((h) => (
                  <div key={h.dia} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-black uppercase w-20">{h.dia}</span>
                    <div className="flex items-center gap-2">
                      <input type="text" value={h.apertura.substring(0, 5)} onChange={(e) => handleHorarioChange(h.dia, 'apertura', e.target.value)} className="w-14 p-2 text-[10px] font-black text-center rounded-lg border" />
                      <span className="text-[8px] font-black text-slate-300">A</span>
                      <input type="text" value={h.cierre.substring(0, 5)} onChange={(e) => handleHorarioChange(h.dia, 'cierre', e.target.value)} className="w-14 p-2 text-[10px] font-black text-center rounded-lg border" />
                      <button onClick={() => handleHorarioChange(h.dia, 'activo', !h.activo)} className={`p-2 rounded-lg ${h.activo ? 'text-green-500 bg-green-50' : 'text-red-400 bg-red-50'}`}>
                        {h.activo ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </button>
                    </div>
                  </div>
                )) : <p className="text-center py-10 text-slate-300 font-bold animate-pulse">CARGANDO...</p>}
              </div>
              <button onClick={saveAllChanges} disabled={isSaving} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl mt-8 shadow-lg flex items-center justify-center gap-3">
                <Save size={18} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
              </button>
            </div>
          </div>
        ) : (
          /* AGENDA */
          <div className="bg-white p-10 rounded-[3rem] shadow-xl">
             <div className="flex justify-between mb-8">
                <h2 className="font-black uppercase italic">Turnos del día</h2>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-black text-xs p-2 bg-slate-50 rounded-lg outline-none" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="bg-slate-50 p-5 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-indigo-600 font-black text-xs">{apt.hora.substring(0, 5)} HS</p>
                      <h4 className="font-black uppercase text-sm">{apt.cliente}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{apt.servicio}</p>
                    </div>
                    <button onClick={() => supabase.from('appointments').delete().eq('id', apt.id).then(() => fetchDailyAppointments())} className="text-red-400 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}