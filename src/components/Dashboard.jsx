import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  Trash2, Calendar as CalendarIcon, Clock, Smartphone, Scissors, 
  Lock, LogIn, MessageSquare, TrendingUp, Users, LogOut, Activity, Settings, Save, CheckCircle2, XCircle
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
      Swal.fire({ title: '¡Bienvenido!', icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem]' } });
    } else {
      Swal.fire({ title: 'Error', text: 'Contraseña incorrecta', icon: 'error', confirmButtonColor: '#4f46e5' });
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
    try {
      const { data: srv } = await supabase.from('servicios').select('*').order('orden', { ascending: true });
      // Quitamos el .order('id') por si no existe esa columna, usamos el orden natural o por día
      const { data: hor, error: horError } = await supabase.from('configuracion_horarios').select('*');
      
      if (horError) console.error("Error en Supabase:", horError.message);

      setServicios(srv || []);
      setHorarios(hor || []);
    } catch (err) {
      console.error("Error inesperado:", err);
    }
  }

  const handleHorarioChange = (dia, campo, valor) => {
    setHorarios(prev => prev.map(h => 
      h.dia === dia ? { ...h, [campo]: valor } : h
    ));
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const promises = horarios.map(h => 
        supabase
          .from('configuracion_horarios')
          .update({ 
            apertura: h.apertura, 
            cierre: h.cierre, 
            activo: h.activo 
          })
          .eq('dia', h.dia)
      );
      
      await Promise.all(promises);
      
      Swal.fire({ 
        title: '¡Configuración Guardada!', 
        text: 'Los cambios ya están en la web de turnos.',
        icon: 'success', 
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const calcularCaja = () => {
    return appointments.reduce((acc, apt) => {
      const servicioEncontrado = servicios.find(s => s.nombre === apt.servicio);
      return acc + (servicioEncontrado ? servicioEncontrado.precio : 0);
    }, 0);
  };

  const handleUpdatePrice = async (id, nuevoPrecio) => {
    const { error } = await supabase.from('servicios').update({ precio: parseInt(nuevoPrecio) }).eq('id', id);
    if (!error) {
      Swal.fire({ title: 'Precio actualizado', icon: 'success', timer: 800, showConfirmButton: false, customClass: { popup: 'rounded-3xl' } });
      fetchConfig();
    }
  };

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
      await supabase.from('appointments').delete().eq('id', id);
      fetchDailyAppointments();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border-b-[12px] border-indigo-600">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock className="text-indigo-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 italic tracking-tighter">admin<span className="text-indigo-600">.barber</span></h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 text-center">Panel de Gestión</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Clave de acceso" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-center font-bold text-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
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
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 px-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter lowercase italic">admin<span className="text-indigo-600">.barber</span></h1>
            <nav className="flex gap-6 mt-4">
              <button onClick={() => setActiveTab('agenda')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'agenda' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}>Agenda</button>
              <button onClick={() => setActiveTab('config')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'config' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400'}`}>Configuración</button>
            </nav>
          </div>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
             {activeTab === 'agenda' && (
               <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <input type="date" className="bg-transparent outline-none text-xs font-black text-slate-900 uppercase" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
               </div>
             )}
             <button onClick={() => setIsAuthenticated(false)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        {activeTab === 'agenda' ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
             <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-indigo-600" /> Resumen Hoy
                </h3>
                <div className="space-y-4 mb-8">
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest relative z-10">Turnos Hoy</p>
                      <div className="text-4xl font-black text-slate-900 relative z-10">{appointments.length}</div>
                      <Users className="w-8 h-8 text-indigo-50 absolute right-6 bottom-6 group-hover:scale-110 transition-transform" />
                   </div>
                   <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Caja Estimada</p>
                      <div className="text-3xl font-black italic">$ {calcularCaja().toLocaleString()}</div>
                      <TrendingUp className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10" />
                   </div>
                </div>
             </div>
             
             <div className="w-full md:w-3/4 p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="col-span-full py-20 text-center text-4xl font-black text-slate-100 italic animate-pulse tracking-tighter">Cargando...</div>
                  ) : appointments.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem]">
                       <Clock className="w-12 h-12 text-slate-100 mb-4" />
                       <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Sin turnos para esta fecha</p>
                    </div>
                  ) : appointments.map((apt) => (
                    <div key={apt.id} className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg group-hover:bg-indigo-600 transition-colors">
                          <span className="text-[9px] font-bold opacity-60 leading-none uppercase">Hora</span>
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
                        <button onClick={() => window.open(`https://wa.me/${apt.telefono.replace(/\D/g, '')}`)} className="p-3 bg-white text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-slate-100 shadow-sm"><MessageSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(apt.id, apt.cliente)} className="p-3 bg-white text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-slate-100 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-50 p-3 rounded-2xl"><Scissors className="text-indigo-600 w-6 h-6" /></div>
                <div><h3 className="font-black text-lg uppercase">Servicios</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestionar Precios</p></div>
              </div>
              <div className="space-y-4">
                {servicios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-black text-xs uppercase text-slate-900">{s.nombre}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        defaultValue={s.precio} 
                        onBlur={(e) => handleUpdatePrice(s.id, e.target.value)}
                        className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-center outline-none focus:ring-2 ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-50 p-3 rounded-2xl"><Clock className="text-indigo-600 w-6 h-6" /></div>
                <div><h3 className="font-black text-lg uppercase">Horarios Abierto</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponibilidad semanal</p></div>
              </div>
              <div className="space-y-3 flex-1">
                {horarios.length > 0 ? horarios.map((h) => (
                  <div key={h.dia} className="flex items-center justify-between p-3 px-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-tighter w-20">{h.dia}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={h.apertura ? h.apertura.substring(0, 5) : '09:00'} 
                        onChange={(e) => handleHorarioChange(h.dia, 'apertura', e.target.value)}
                        className="w-14 bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-black text-center outline-none focus:ring-2 ring-indigo-100"
                      />
                      <span className="text-[8px] font-black text-slate-300">A</span>
                      <input 
                        type="text" 
                        value={h.cierre ? h.cierre.substring(0, 5) : '20:00'} 
                        onChange={(e) => handleHorarioChange(h.dia, 'cierre', e.target.value)}
                        className="w-14 bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-black text-center outline-none focus:ring-2 ring-indigo-100"
                      />
                      <button 
                        onClick={() => handleHorarioChange(h.dia, 'activo', !h.activo)}
                        className={`ml-2 p-2 rounded-lg transition-all ${h.activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                      >
                        {h.activo ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-300 py-10 font-black uppercase text-[10px] tracking-widest">Cargando horarios...</p>
                )}
              </div>

              <button 
                onClick={saveAllChanges}
                disabled={isSaving}
                className={`w-full bg-slate-900 text-white font-black py-5 rounded-2xl mt-8 flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-5 h-5" /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
              </button>
            </div>
          </div>
        )}

        <footer className="mt-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-6 text-center md:text-left">
          <div>
             <h4 className="text-xl font-black text-slate-900 lowercase italic">admin<span className="text-indigo-600">.barber</span></h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Control Real-Time • Villa Constitución</p>
          </div>
          <div className="text-center md:text-right">
             <p className="text-[10px] text-slate-400 font-medium tracking-tight">© 2026 — ejemplo.barber</p>
             <p className="text-[9px] text-slate-900 font-black uppercase tracking-tighter mt-1 italic">SaaS by Daaneri</p>
          </div>
        </footer>
      </div>
    </div>
  );
}