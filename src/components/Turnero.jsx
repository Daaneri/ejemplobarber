import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, 
  Search, 
  MapPin, 
  Trash2
} from 'lucide-react';

export default function Turnero() {
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [servicios, setServicios] = useState([]); 
  const [configHorarios, setConfigHorarios] = useState([]); 
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [searchPhone, setSearchPhone] = useState('');

  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0]; 
  };
  
  const dateString = getLocalDateString(selectedDate);
  const isToday = dateString === getLocalDateString(new Date());
  
  const getDayName = (date) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[date.getDay()];
  };

  const isTimeSlotPast = (slot) => {
    if (!isToday) return false;
    const [hour, minutes] = slot.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(hour, minutes, 0, 0);
    return now.getTime() > (slotDate.getTime() - (30 * 60 * 1000));
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    getAppointments();
  }, [selectedDate]);

  async function fetchInitialData() {
    const { data: srv } = await supabase.from('servicios').select('*').order('orden', { ascending: true });
    setServicios(srv || []);
    if (srv?.length > 0) setSelectedService(srv[0]);
    const { data: hor } = await supabase.from('configuracion_horarios').select('*');
    setConfigHorarios(hor || []);
  }

  async function getAppointments() {
    const { data } = await supabase.from('appointments').select('*').eq('fecha', dateString);
    setAppointments(data || []);
  }

  const generateSlots = () => {
    const diaActual = getDayName(selectedDate);
    const config = configHorarios.find(h => h.dia === diaActual);
    if (!config || !config.activo) return [];
    const slots = [];
    const addRange = (inicio, fin) => {
      if (!inicio || !fin) return;
      let [hInicio, mInicio] = inicio.split(':').map(Number);
      let [hFin, mFin] = fin.split(':').map(Number);
      let actual = hInicio * 60 + mInicio;
      while (actual < (hFin * 60 + mFin)) {
        slots.push(`${Math.floor(actual / 60).toString().padStart(2, '0')}:${(actual % 60).toString().padStart(2, '0')}`);
        actual += 30; 
      }
    };
    addRange(config.apertura, config.cierre);
    addRange(config.apertura_tarde, config.cierre_tarde);
    return slots;
  };

  async function fetchMyAppointments(phone) {
    if (phone.length < 3) return setMyAppointments([]);
    const { data } = await supabase.from('appointments').select('*').eq('telefono', phone.trim()).order('fecha', { ascending: false });
    setMyAppointments(data || []);
  }

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) return;
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: form.name, 
      telefono: form.phone.trim(), 
      fecha: dateString, 
      hora: selectedSlot, 
      servicio: selectedService.nombre 
    }]);
    if (!error) {
      Swal.fire({ title: '¡Listo!', icon: 'success', confirmButtonColor: '#4f46e5' });
      setSelectedSlot(null);
      getAppointments();
    }
  };

  const currentSlots = generateSlots();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
      {/* ESTILO PARA LA BARRA DE DESPLAZAMIENTO VIOLETA */}
      <style>{`
        .barra-dias::-webkit-scrollbar { height: 8px; }
        .barra-dias::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .barra-dias::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 px-4">
          <h1 className="text-4xl font-black text-slate-900 italic lowercase">
            ejemplo<span className="text-indigo-600">.barber</span>
          </h1>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
          {/* Paso 1 y 2 */}
          <div className="w-full md:w-1/4 p-8 bg-slate-50/50 border-r border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 italic">Paso 1: Servicio</h3>
            <div className="space-y-2 mb-8">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedService?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200'}`}>
                  <span className="text-xs font-bold">{s.nombre}</span>
                  <span className="text-[10px] font-bold opacity-80">${s.precio}</span>
                </button>
              ))}
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 italic">Paso 2: Tus Datos</h3>
            <input type="text" placeholder="Nombre" className="w-full p-4 rounded-2xl border text-xs mb-2 outline-none focus:ring-2 ring-indigo-100" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-2xl border text-xs outline-none focus:ring-2 ring-indigo-100" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <button onClick={handleReserve} className="w-full mt-6 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black">RESERVAR</button>
          </div>

          {/* Columna Central: Turnos */}
          <div className="w-full md:w-2/4 p-8">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">
              {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} <span className="text-indigo-600">{selectedDate.getFullYear()}</span>
            </h2>
            
            {/* BARRA PARA CORRER DÍAS (VIOLETA) */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-10 barra-dias">
              {Array.from({ length: 21 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[60px] py-5 rounded-2xl text-xs flex flex-col items-center transition-all ${getLocalDateString(selectedDate) === getLocalDateString(d) ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white border hover:bg-slate-50'}`}>
                    <span className="opacity-60 mb-1 font-bold uppercase text-[8px]">{getDayName(d).substring(0,3)}</span>
                    <span className="font-black text-base">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Horarios Disponibles</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currentSlots.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-red-50 rounded-2xl border border-red-100 text-red-400 font-bold uppercase text-xs tracking-widest">Cerrado</div>
              ) : currentSlots.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                return (
                  <button 
                    key={h} 
                    disabled={!!apt || isPast} 
                    onClick={() => setSelectedSlot(h)} 
                    className={`py-5 rounded-2xl text-base font-black transition-all border ${
                      apt ? 'bg-red-50 text-red-200 border-red-50 cursor-not-allowed' :
                      isPast ? 'bg-slate-50 text-slate-200 border-transparent cursor-not-allowed' :
                      selectedSlot === h ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-105' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="w-full md:w-1/4 p-6 border-l border-slate-100 bg-white">
              <a href="#" className="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-black text-[10px] py-5 rounded-2xl mb-6 uppercase shadow-lg shadow-green-100">
                <MessageCircle size={18} /> WhatsApp Barbería
              </a>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                <Search size={12} className="text-indigo-600" /> Mis Reservas
              </h3>
              <input type="tel" placeholder="Tu Celular..." className="w-full p-4 rounded-2xl border text-[10px] font-bold mb-4 outline-none focus:ring-2 ring-indigo-100" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
              <div className="space-y-2 overflow-y-auto max-h-[300px]">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50/50">
                    <div>
                      <p className="text-[8px] font-black text-indigo-500 uppercase">{apt.fecha}</p>
                      <p className="font-black text-sm text-slate-900">{apt.hora.substring(0,5)} HS</p>
                    </div>
                    <Trash2 size={16} className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors" />
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}