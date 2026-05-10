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
  LogOut, 
  MessageSquare, 
  Save, 
  Plus,
  TrendingUp,
  Activity
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

  // Nombres de días exactos para coincidir con tu Supabase
  const diasSemanales = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      Swal.fire({ title: 'Acceso Concedido', icon: 'success', timer: 1000, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Error', text: 'Contraseña incorrecta', icon: 'error' });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [selectedDate, isAuthenticated]);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([fetchDailyAppointments(), fetchConfig()]);
    setLoading(false);
  }

  async function fetchDailyAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('fecha', selectedDate)
      .order('hora', { ascending: true });
    setAppointments(data || []);
  }

  async function fetchConfig() {
    const { data: srv } = await supabase.from('servicios').select('*').order('orden', { ascending: true });
    const { data: hor } = await supabase.from('configuracion_horarios').select('*');
    setServicios(srv || []);
    setHorarios(hor || []);
  }

  const generateSlotsForAdmin = () => {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const diaNombre = diasSemanales[dateObj.getDay()];
    const config = horarios.find(h => h.dia === diaNombre);
    
    if (!config || !config.activo) return [];
    
    const slots = [];
    const addRange = (inicioStr, finStr) => {
      if (!inicioStr || !finStr) return;
      let [hInicio, mInicio] = inicioStr.split(':').map(Number);
      let [hFin, mFin] = finStr.split(':').map(Number);
      let actual = hInicio * 60 + mInicio;
      const limite = hFin * 60 + mFin;
      while (actual < limite) {
        const h = Math.floor(actual / 60);
        const m = actual % 60;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        actual += 30;
      }
    };

    addRange(config.apertura, config.cierre);
    addRange(config.apertura_tarde, config.cierre_tarde);
    return slots;
  };

  const handleQuickBlock = async (hora) => {
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: '🚫 BLOQUEADO', 
      telefono: '000000', 
      fecha: selectedDate, 
      hora: hora, 
      servicio: 'RESERVADO POR LOCAL' 
    }]);

    if (!error) fetchDailyAppointments();
  };

  const handleAddService = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Servicio',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nombre (ej: Corte + Barba)">
        <input id="swal-input2" type="number" class="swal2-input" placeholder="Precio ($)">
      `,
      focusConfirm: false,
      confirmButtonColor: '#4f46e5',
      preConfirm: () => [
        document.getElementById('swal-input1').value,
        document.getElementById('swal-input2').value
      ]
    });

    if (formValues && formValues[0]) {
      const { error } = await supabase.from('servicios').insert([{ 
        nombre: formValues[0], 
        precio: parseInt(formValues[1]), 
        orden: servicios.length + 1 
      }]);
      if (!error) fetchConfig();
    }
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [campo]: valor } : h));
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
            apertura_tarde: h.apertura_tarde, 
            cierre_tarde: h.cierre_tarde, 
            activo: h.activo 
          })
          .eq('dia', h.dia)
      );
      await Promise.all(promises);
      Swal.fire({ title: 'Configuración Guardada', icon: 'success' });
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-slate-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Lock size={36} />
          </div>
          <h2 className="text-3xl font-black mb-8 italic text-slate-900 tracking-tighter italic">admin.<span className="text-indigo-600">barber</span></h2>
          <input 
            type="password" 
            placeholder="Clave Maestra" 
            className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center font-bold outline-none focus:ring-2 ring-indigo-100" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-black italic tracking-tighter">admin.<span className="text-indigo-600">barber</span></h1>
          <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <button onClick={() => setActiveTab('agenda')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'agenda' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Agenda Diaria</button>
            <button onClick={() => setActiveTab('config')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Configuración</button>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-100"><LogOut size={20}/></button>
        </header>

        {activeTab === 'agenda' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CalendarIcon size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Fecha Visualizada</p>
                    <input type="date" className="font-black text-xl outline-none bg-transparent" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-2xl">
                  <p className="text-[10px] font-black uppercase opacity-60">Total Turnos</p>
                  <p className="text-4xl font-black">{appointments.length}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <div className="py-20 text-center font-black text-slate-300 animate-pulse">Cargando Agenda...</div>
              ) : (
                generateSlotsForAdmin().map(h => {
                  const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                  return (
                    <div key={h} className={`bg-white p-4 rounded-3xl border flex items-center justify-between transition-all ${apt ? 'border-slate-100 shadow-sm' : 'border-dashed border-slate-200 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xs ${apt ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{h}</div>
                        {apt ? (
                          <div>
                            <p className="font-black text-sm uppercase">{apt.cliente}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{apt.servicio} • {apt.telefono}</p>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-300 uppercase italic">Horario Libre</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {apt ? (
                          <>
                            <button onClick={() => window.open(`https://wa.me/${apt.telefono.replace(/\D/g,'')}`)} className="p-3 text-green-500 bg-green-50 rounded-xl hover:bg-green-500 hover:text-white transition-all"><MessageSquare size={16}/></button>
                            <button 
                              onClick={async () => {
                                const conf = await Swal.fire({ title: '¿Eliminar turno?', icon: 'warning', showCancelButton: true });
                                if (conf.isConfirmed) { await supabase.from('appointments').delete().eq('id', apt.id); fetchDailyAppointments(); }
                              }} 
                              className="p-3 text-red-400 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            ><Trash2 size={16}/></button>
                          </>
                        ) : (
                          <button onClick={() => handleQuickBlock(h)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black flex items-center gap-2"><Lock size={12}/> Bloquear</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GESTIÓN DE SERVICIOS */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-xl italic">servicios.<span className="text-indigo-600">list</span></h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Precios y opciones</p>
                </div>
                <button onClick={handleAddService} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg hover:scale-105 transition-all">
                  <Plus size={20}/>
                </button>
              </div>
              <div className="space-y-3">
                {servicios.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg"><Scissors size={14} className="text-slate-400" /></div>
                      <span className="font-black text-xs uppercase tracking-tight">{s.nombre}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-indigo-600">${s.precio}</span>
                      <button onClick={async () => { await supabase.from('servicios').delete().eq('id', s.id); fetchConfig(); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONFIGURACIÓN DE HORARIOS */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-xl italic">horarios.<span className="text-indigo-600">config</span></h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Turno Mañana y Tarde</p>
                </div>
                <button 
                  onClick={saveAllChanges} 
                  disabled={isSaving} 
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black flex items-center gap-3 shadow-lg hover:bg-indigo-700 transition-all"
                >
                  {isSaving ? <Activity className="animate-spin" size={14}/> : <Save size={14}/>} 
                  {isSaving ? 'Guardando...' : 'Guardar Todo'}
                </button>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {horarios.map(h => (
                  <div key={h.dia} className={`p-6 rounded-[2rem] border transition-all ${h.activo ? 'bg-slate-50 border-slate-100' : 'opacity-40 grayscale'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-sm uppercase tracking-widest">{h.dia}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={h.activo} onChange={e => handleHorarioChange(h.dia, 'activo', e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                    
                    {h.activo && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mañana</p>
                          <div className="flex gap-2">
                            <input type="time" className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 ring-indigo-50" value={h.apertura} onChange={e => handleHorarioChange(h.dia, 'apertura', e.target.value)} />
                            <input type="time" className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 ring-indigo-50" value={h.cierre} onChange={e => handleHorarioChange(h.dia, 'cierre', e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Tarde</p>
                          <div className="flex gap-2">
                            <input type="time" className="w-full p-3 rounded-xl border border-indigo-100 text-xs font-bold bg-indigo-50/30" value={h.apertura_tarde || '16:00'} onChange={e => handleHorarioChange(h.dia, 'apertura_tarde', e.target.value)} />
                            <input type="time" className="w-full p-3 rounded-xl border border-indigo-100 text-xs font-bold bg-indigo-50/30" value={h.cierre_tarde || '20:00'} onChange={e => handleHorarioChange(h.dia, 'cierre_tarde', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}