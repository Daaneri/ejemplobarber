import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, Search, MapPin, Trash2, Instagram, Facebook, 
  Clock, Calendar, User, Phone, CheckCircle2, ChevronRight, Info 
} from 'lucide-react';

// Optimizamos las constantes fuera del componente para evitar recrearlas
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
  const [isBooking, setIsBooking] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // --- OPTIMIZACIÓN DE FECHAS (USECALLBACK) ---
  const getLocalDateString = useCallback((date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0]; 
  }, []);
  
  const dateString = useMemo(() => getLocalDateString(selectedDate), [selectedDate, getLocalDateString]);
  const isToday = dateString === getLocalDateString(new Date());

  const isTimeSlotPast = useCallback((slot) => {
    if (!isToday) return false;
    const [hour, minutes] = slot.split(':').map(Number);
    const now = new Date();
    const slotDate = new Date();
    slotDate.setHours(hour, minutes, 0, 0);
    return now.getTime() > (slotDate.getTime() - (30 * 60 * 1000));
  }, [isToday]);

  // --- FETCH DATA OPTIMIZADO ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: srv } = await supabase.from('servicios').select('*').order('orden', { ascending: true });
      setServicios(srv || []);
      if (srv?.length > 0) setSelectedService(srv[0]);
      const { data: hor } = await supabase.from('configuracion_horarios').select('*');
      setConfigHorarios(hor || []);
    };
    fetchInitialData();
  }, []);

  const getAppointments = useCallback(async () => {
    setIsFetching(true);
    const { data } = await supabase.from('appointments').select('*').eq('fecha', dateString);
    setAppointments(data || []);
    setIsFetching(false);
  }, [dateString]);

  useEffect(() => {
    getAppointments();
    setSelectedSlot(null);
  }, [getAppointments]);

  // --- GENERACIÓN DE SLOTS CON USEMEMO ---
  const currentSlots = useMemo(() => {
    const diaNombre = DIAS[selectedDate.getDay()];
    const config = configHorarios.find(h => h.dia === diaNombre);
    if (!config || !config.activo) return [];
    
    const slots = [];
    const addRange = (inicio, fin) => {
      if (!inicio || !fin) return;
      let [hI, mI] = inicio.split(':').map(Number);
      let [hF, mF] = fin.split(':').map(Number);
      let actual = hI * 60 + mI;
      const limite = hF * 60 + mF;
      while (actual < limite) {
        slots.push(`${Math.floor(actual / 60).toString().padStart(2, '0')}:${(actual % 60).toString().padStart(2, '0')}`);
        actual += 30;
      }
    };
    addRange(config.apertura, config.cierre);
    addRange(config.apertura_tarde, config.cierre_tarde);
    return slots;
  }, [configHorarios, selectedDate]);

  // --- MANEJADORES ---
  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) {
      return Swal.fire({ title: '¡Atención!', text: 'Faltan datos.', icon: 'warning', confirmButtonColor: '#4f46e5' });
    }
    setIsBooking(true);
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: form.name, telefono: form.phone.trim(), fecha: dateString, hora: selectedSlot, servicio: selectedService.nombre 
    }]);
    if (!error) {
      Swal.fire({ title: '¡Éxito!', text: 'Turno reservado.', icon: 'success', confirmButtonColor: '#10b981' });
      setForm({ name: '', phone: '' });
      getAppointments();
    }
    setIsBooking(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-950">
      <style>{`
        .barra-dias::-webkit-scrollbar { height: 6px; }
        .barra-dias::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
        .barra-dias::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>

      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-5xl font-black tracking-tighter italic">ejemplo<span className="text-indigo-600">.barber</span></h1>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase">Servidor Optimizado</span>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200">
          
          {/* COLUMNA 1: SERVICIOS */}
          <aside className="w-full lg:w-1/4 p-8 bg-slate-50 border-r border-slate-200">
            <h3 className="font-black text-[11px] uppercase tracking-widest mb-6 italic flex items-center gap-2">
              <ChevronRight size={14} className="text-indigo-600" /> Paso 1: Servicios
            </h3>
            <div className="space-y-3 mb-8">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${selectedService?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-white border-slate-300 text-black hover:border-indigo-400'}`}>
                  <span className="text-sm font-black">{s.nombre}</span>
                  <span className="text-xs font-black opacity-80">${s.precio}</span>
                </button>
              ))}
            </div>

            <h3 className="font-black text-[11px] uppercase tracking-widest mb-4 italic flex items-center gap-2">
              <User size={14} className="text-indigo-600" /> Paso 2: Tus Datos
            </h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre" className="w-full p-4 rounded-2xl border-2 border-slate-400 text-black font-bold outline-none focus:border-indigo-600" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-2xl border-2 border-slate-400 text-black font-bold outline-none focus:border-indigo-600" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <button onClick={handleReserve} disabled={isBooking} className="w-full bg-black text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all uppercase text-xs tracking-widest">
                {isBooking ? 'Cargando...' : 'Confirmar'}
              </button>
            </div>
          </aside>

          {/* COLUMNA 2: CALENDARIO */}
          <main className="w-full lg:w-2/4 p-8">
            <h2 className="text-3xl font-black text-black uppercase italic mb-8">
              {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} <span className="text-indigo-600">{selectedDate.getFullYear()}</span>
            </h2>
            
            <div className="flex gap-3 mb-10 overflow-x-auto pb-4 barra-dias">
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const isSel = dateString === getLocalDateString(d);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[65px] py-5 rounded-[2rem] text-sm flex flex-col items-center transition-all ${isSel ? 'bg-black text-white scale-110 shadow-xl' : 'bg-white text-black border border-slate-300 hover:bg-slate-50'}`}>
                    <span className="text-[8px] font-black uppercase opacity-60 mb-1">{DIAS[d.getDay()].substring(0,3)}</span>
                    <span className="font-black text-base">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isFetching ? (
                <div className="col-span-full py-20 text-center animate-pulse font-black text-slate-400">CARGANDO TURNOS...</div>
              ) : currentSlots.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-red-50 rounded-3xl border border-red-200 text-red-600 font-black uppercase text-xs italic">Cerrado</div>
              ) : currentSlots.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                return (
                  <button key={h} disabled={!!apt || isPast} onClick={() => setSelectedSlot(h)} className={`py-5 rounded-2xl text-base font-black border-2 transition-all ${apt ? 'bg-red-50 text-red-200 border-red-50' : isPast ? 'bg-slate-100 text-slate-400 border-transparent' : selectedSlot === h ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'}`}>
                    {h}
                  </button>
                );
              })}
            </div>
          </main>

          {/* COLUMNA 3: MAPA Y BUSCADOR */}
          <aside className="w-full lg:w-1/4 border-l border-slate-200 bg-white">
            <div className="p-8">
              <a href="https://wa.me/543400000000" className="flex items-center justify-center gap-2 bg-green-600 text-white font-black text-[10px] py-5 rounded-2xl mb-6 uppercase shadow-lg hover:bg-green-700 transition-all">
                <MessageCircle size={18} /> WhatsApp Directo
              </a>
              <div className="h-[200px] rounded-[2rem] overflow-hidden border-4 border-slate-100 mb-6 grayscale hover:grayscale-0 transition-all duration-1000">
                <iframe title="map" width="100%" height="100%" src="http://googleusercontent.com/maps.google.com/7" frameBorder="0" loading="lazy"></iframe>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <MapPin className="text-indigo-600 mt-1" size={20} />
                <p className="text-[10px] font-black text-black uppercase leading-tight">Av. San Martín 1234<br/>Villa Constitución, SF</p>
              </div>
            </div>

            <div className="bg-black p-8 text-white rounded-t-[3rem] min-h-[300px]">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-4 italic flex items-center gap-2">
                <Search size={14} /> Buscar Reserva
              </h3>
              <input type="tel" placeholder="Tu número..." className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-[10px] text-white font-black mb-4 outline-none focus:border-indigo-600" value={searchPhone} onChange={e => {setSearchPhone(e.target.value); fetchMyAppointments(e.target.value);}} />
              <div className="space-y-3 overflow-y-auto max-h-[150px]">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center group">
                    <div>
                      <p className="text-[8px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                      <p className="text-sm font-black">{apt.hora.substring(0,5)} HS</p>
                    </div>
                    <button onClick={() => {/* lógica de borrado */}} className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-16 flex flex-col md:flex-row justify-between items-center border-t border-slate-300 pt-10 px-6 gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-black italic">ejemplo<span className="text-indigo-600">.barber</span></h4>
            <p className="text-[10px] font-black text-slate-600 uppercase">© 2026 Villa Constitución</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="p-3 bg-white border border-slate-300 rounded-xl text-black hover:text-indigo-600 transition-all shadow-sm"><Instagram size={20}/></a>
            <a href="#" className="p-3 bg-white border border-slate-300 rounded-xl text-black hover:text-indigo-600 transition-all shadow-sm"><Facebook size={20}/></a>
          </div>
          <p className="text-[10px] font-black uppercase italic text-black">By Daaneri</p>
        </footer>
      </div>
    </div>
  );
}