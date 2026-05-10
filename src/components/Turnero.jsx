import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, Search, MapPin, Trash2, Instagram, Facebook, 
  Clock, Calendar, User, Phone, CheckCircle2, ChevronRight, Info 
} from 'lucide-react';

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
      while (actual < (hF * 60 + mF)) {
        slots.push(`${Math.floor(actual / 60).toString().padStart(2, '0')}:${(actual % 60).toString().padStart(2, '0')}`);
        actual += 30;
      }
    };
    addRange(config.apertura, config.cierre);
    addRange(config.apertura_tarde, config.cierre_tarde);
    return slots;
  }, [configHorarios, selectedDate]);

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

  async function fetchMyAppointments(phone) {
    if (phone.length < 5) return setMyAppointments([]);
    const { data } = await supabase.from('appointments').select('*').eq('telefono', phone.trim()).order('fecha', { ascending: false });
    setMyAppointments(data || []);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-950">
      <style>{`
        .barra-dias::-webkit-scrollbar { height: 6px; }
        .barra-dias::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
        .barra-dias::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>

      <div className="max-w-7xl mx-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-5xl font-black tracking-tighter italic text-black">ejemplo<span className="text-indigo-600">.barber</span></h1>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-black">Motor V3.1 - Villa Constitución</span>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-200">
          
          {/* PASO 1 Y DATOS */}
          <aside className="w-full lg:w-1/4 p-8 bg-slate-50 border-r border-slate-200">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-black mb-6 italic flex items-center gap-2">
              <ChevronRight size={14} className="text-indigo-600" /> Paso 1: Servicios
            </h3>
            <div className="space-y-3 mb-8">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${selectedService?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-300 text-black hover:border-indigo-400'}`}>
                  <span className="text-sm font-black">{s.nombre}</span>
                  <span className="text-xs font-black opacity-80">${s.precio}</span>
                </button>
              ))}
            </div>

            <h3 className="font-black text-[11px] uppercase tracking-widest text-black mb-4 italic flex items-center gap-2">
              <User size={14} className="text-indigo-600" /> Paso 2: Tus Datos
            </h3>
            <div className="space-y-3">
              <input type="text" placeholder="Tu Nombre" className="w-full p-4 rounded-2xl border-2 border-slate-400 text-black font-bold outline-none focus:border-indigo-600 placeholder:text-slate-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-2xl border-2 border-slate-400 text-black font-bold outline-none focus:border-indigo-600 placeholder:text-slate-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <button onClick={handleReserve} disabled={isBooking} className="w-full bg-black text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all uppercase text-xs tracking-widest mt-4">
                {isBooking ? 'Procesando...' : 'Reservar Ahora'}
              </button>
            </div>
          </aside>

          {/* CALENDARIO Y TURNOS */}
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
                <div className="col-span-full py-20 text-center animate-pulse font-black text-slate-400">BUSCANDO HORARIOS...</div>
              ) : currentSlots.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-red-50 rounded-3xl border border-red-200 text-red-600 font-black uppercase text-xs italic">Cerrado</div>
              ) : currentSlots.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                return (
                  <button key={h} disabled={!!apt || isPast} onClick={() => setSelectedSlot(h)} className={`py-5 rounded-2xl text-base font-black border-2 transition-all ${apt ? 'bg-red-50 text-red-200 border-red-50' : isPast ? 'bg-slate-100 text-slate-400 border-transparent' : selectedSlot === h ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'}`}>
                    {h}
                  </button>
                );
              })}
            </div>
          </main>

          {/* MAPA Y BUSCADOR */}
          <aside className="w-full lg:w-1/4 border-l border-slate-200 bg-white flex flex-col">
            <div className="p-8">
              <a href="https://wa.me/543400000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-600 text-white font-black text-[10px] py-5 rounded-2xl mb-6 uppercase shadow-lg hover:bg-green-700 transition-all">
                <MessageCircle size={18} /> WhatsApp Barbería
              </a>

              {/* MAPA RESTAURADO CON SRC REAL */}
              <div className="h-[220px] rounded-[2rem] overflow-hidden border-4 border-slate-100 mb-6 shadow-inner relative bg-slate-100">
                <iframe 
                  title="Google Maps Villa Constitucion"
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0 }}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13344.2483863777!2d-60.334407!3d-33.225585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b76c37497d4681%3A0x6b49911966a987d3!2sVilla%20Constituci%C3%B3n%2C%20Santa%20Fe!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
                  allowFullScreen="" 
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade">
                </iframe>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <MapPin className="text-indigo-600 mt-1" size={20} />
                <p className="text-[10px] font-black text-black uppercase leading-tight">Av. San Martín 1234<br/>Villa Constitución, SF</p>
              </div>
            </div>

            <div className="bg-black p-8 text-white rounded-t-[3.5rem] flex-1 mt-4">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-6 italic flex items-center gap-2">
                <Search size={14} /> Mis Reservas
              </h3>
              <input type="tel" placeholder="Tu Celular..." className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-[10px] text-white font-black mb-6 outline-none focus:border-indigo-600" value={searchPhone} onChange={e => {setSearchPhone(e.target.value); fetchMyAppointments(e.target.value);}} />
              <div className="space-y-3 overflow-y-auto max-h-[180px] pr-2 custom-scroll">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center group">
                    <div>
                      <p className="text-[8px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                      <p className="text-sm font-black text-white">{apt.hora.substring(0,5)} HS</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{apt.servicio}</p>
                    </div>
                    <button onClick={async () => {
                      const res = await Swal.fire({ title: '¿Borrar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
                      if(res.isConfirmed) {
                        await supabase.from('appointments').delete().eq('id', apt.id);
                        fetchMyAppointments(searchPhone);
                        getAppointments();
                      }
                    }} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* FOOTER DESARROLLADOR */}
        <footer className="mt-16 flex flex-col md:flex-row justify-between items-center border-t border-slate-300 pt-10 px-6 gap-8 mb-10">
          <div className="text-center md:text-left">
            <h4 className="text-3xl font-black italic text-black leading-none">ejemplo<span className="text-indigo-600">.barber</span></h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">© 2026 Villa Constitución • Turnos Online</p>
          </div>
          <div className="flex gap-5">
            <a href="#" className="p-4 bg-white border border-slate-300 rounded-2xl text-black hover:text-indigo-600 hover:shadow-lg transition-all"><Instagram size={22}/></a>
            <a href="#" className="p-4 bg-white border border-slate-300 rounded-2xl text-black hover:text-indigo-600 hover:shadow-lg transition-all"><Facebook size={22}/></a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase italic text-black">Desarrollado por Daaneri</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">SaaS Management Solutions</p>
          </div>
        </footer>
      </div>
    </div>
  );
}