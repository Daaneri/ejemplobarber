import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, 
  Search, 
  MapPin, 
  Trash2,
  Instagram,
  Facebook,
  Clock,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

/**
 * COMPONENTE PRINCIPAL: TURNERO SAAS
 * Desarrollado por: Daaneri
 * Ubicación: Villa Constitución, Santa Fe
 */
export default function Turnero() {
  // --- ESTADOS ---
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

  // --- LÓGICA DE FECHAS ---
  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0]; 
  };
  
  const dateString = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
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
    // Margen de 30 minutos antes del turno
    return now.getTime() > (slotDate.getTime() - (30 * 60 * 1000));
  };

  // --- EFECTOS (API CALLS) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: srv, error: srvErr } = await supabase
          .from('servicios')
          .select('*')
          .order('orden', { ascending: true });
        
        if (srvErr) throw srvErr;
        setServicios(srv || []);
        if (srv?.length > 0) setSelectedService(srv[0]);

        const { data: hor, error: horErr } = await supabase
          .from('configuracion_horarios')
          .select('*');
        
        if (horErr) throw horErr;
        setConfigHorarios(hor || []);
      } catch (err) {
        console.error("Error inicial:", err.message);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    getAppointments();
    setSelectedSlot(null); // Reset al cambiar fecha
  }, [selectedDate]);

  async function getAppointments() {
    setIsFetching(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('fecha', dateString);
    setAppointments(data || []);
    setIsFetching(false);
  }

  // --- GENERACIÓN DE TURNOS ---
  const currentSlots = useMemo(() => {
    const diaActual = getDayName(selectedDate);
    const config = configHorarios.find(h => h.dia === diaActual);
    if (!config || !config.activo) return [];
    
    const slots = [];
    const addRange = (inicio, fin) => {
      if (!inicio || !fin) return;
      let [hInicio, mInicio] = inicio.split(':').map(Number);
      let [hFin, mFin] = fin.split(':').map(Number);
      let actual = hInicio * 60 + mInicio;
      const limite = hFin * 60 + mFin;
      
      while (actual < limite) {
        const h = Math.floor(actual / 60);
        const m = actual % 60;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        actual += 30; // Intervalos de 30 min
      }
    };
    
    addRange(config.apertura, config.cierre);
    addRange(config.apertura_tarde, config.cierre_tarde);
    return slots;
  }, [configHorarios, selectedDate]);

  // --- ACCIONES DEL USUARIO ---
  async function fetchMyAppointments(phone) {
    if (phone.length < 5) return setMyAppointments([]);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('telefono', phone.trim())
      .order('fecha', { ascending: false });
    setMyAppointments(data || []);
  }

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) {
      return Swal.fire({ 
        title: '¡Atención!', 
        text: 'Por favor, completá todos tus datos.', 
        icon: 'warning', 
        confirmButtonColor: '#4f46e5' 
      });
    }

    setIsBooking(true);
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: form.name, 
      telefono: form.phone.trim(), 
      fecha: dateString, 
      hora: selectedSlot, 
      servicio: selectedService.nombre 
    }]);

    if (!error) {
      Swal.fire({ 
        title: '¡Reserva Confirmada!', 
        text: `Te esperamos el ${dateString.split('-').reverse().join('/')} a las ${selectedSlot}hs.`,
        icon: 'success', 
        confirmButtonColor: '#10b981' 
      });
      setForm({ name: '', phone: '' });
      setSelectedSlot(null);
      getAppointments();
    } else {
      Swal.fire('Error', 'No se pudo realizar la reserva. Reintentá.', 'error');
    }
    setIsBooking(false);
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: '¿Anular reserva?',
      text: "Esta acción liberará el turno para otra persona.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) {
        Swal.fire('Eliminado', 'Turno cancelado con éxito.', 'success');
        fetchMyAppointments(searchPhone);
        getAppointments();
      }
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-950 selection:bg-indigo-100">
      {/* Scrollbar Custom Violeta */}
      <style>{`
        .barra-dias::-webkit-scrollbar { height: 6px; }
        .barra-dias::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
        .barra-dias::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <div className="max-w-7xl mx-auto p-3 md:p-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 px-4 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-black tracking-tighter lowercase italic leading-none">
              ejemplo<span className="text-indigo-600">.barber</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <MapPin size={14} className="text-indigo-600" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Villa Constitución • Santa Fe</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black uppercase">Online Ahora</span>
            </div>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-white rounded-[3rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row min-h-[800px] border border-slate-100">
          
          {/* SECCIÓN 1: FORMULARIO Y SERVICIOS */}
          <aside className="w-full lg:w-1/4 p-8 bg-[#fcfcfd] border-r border-slate-100 flex flex-col">
            <div className="mb-8">
              <h3 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest text-black mb-6 italic">
                <ChevronRight size={14} className="text-indigo-600" /> Paso 1: Elegí tu corte
              </h3>
              <div className="space-y-3">
                {servicios.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSelectedService(s)} 
                    className={`w-full p-5 rounded-[1.5rem] border-2 text-left flex justify-between items-center transition-all duration-300 ${
                      selectedService?.id === s.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-1' 
                      : 'bg-white border-slate-200 text-black hover:border-indigo-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase opacity-60 mb-0.5">Servicio</p>
                      <p className="text-sm font-black">{s.nombre}</p>
                    </div>
                    <span className={`text-xs font-black ${selectedService?.id === s.id ? 'text-white' : 'text-indigo-600'}`}>
                      ${s.precio}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest text-black mb-6 italic">
                <User size={14} className="text-indigo-600" /> Paso 2: Datos de contacto
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Tu nombre completo" 
                    className="w-full bg-white p-4 pl-12 rounded-2xl border-2 border-slate-100 text-sm font-bold text-black outline-none focus:border-indigo-600 transition-colors placeholder:text-slate-400"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="tel" 
                    placeholder="Tu WhatsApp" 
                    className="w-full bg-white p-4 pl-12 rounded-2xl border-2 border-slate-100 text-sm font-bold text-black outline-none focus:border-indigo-600 transition-colors placeholder:text-slate-400"
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                  />
                </div>
                
                <div className="bg-indigo-50/50 p-5 rounded-3xl border-2 border-dashed border-indigo-200 mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Total a abonar</p>
                      <p className="text-3xl font-black text-black">${selectedService?.precio || 0}</p>
                    </div>
                    {selectedSlot && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-500 uppercase">Confirmado</p>
                        <p className="text-xs font-black text-black">{selectedSlot} HS</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleReserve}
                  disabled={isBooking}
                  className="w-full mt-6 bg-black text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-slate-900 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  {isBooking ? 'Procesando...' : 'Confirmar Reserva'}
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          </aside>

          {/* SECCIÓN 2: CALENDARIO Y SLOTS */}
          <main className="w-full lg:w-2/4 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <h2 className="text-4xl font-black text-black tracking-tighter uppercase italic">
                {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} 
                <span className="text-indigo-600 ml-2">{selectedDate.getFullYear()}</span>
              </h2>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <Calendar size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{getDayName(selectedDate)}</span>
              </div>
            </div>
            
            {/* BARRA DESPLAZABLE VIOLETA */}
            <div className="flex gap-3 mb-12 overflow-x-auto pb-6 barra-dias">
              {Array.from({ length: 21 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const isSelected = getLocalDateString(selectedDate) === getLocalDateString(d);
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(d)} 
                    className={`min-w-[70px] py-6 rounded-[2rem] text-sm flex flex-col items-center transition-all duration-300 ${
                      isSelected 
                      ? 'bg-black text-white shadow-2xl scale-110 -translate-y-1' 
                      : 'bg-white text-black border-2 border-slate-100 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`text-[9px] font-black uppercase mb-1 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {getDayName(d).substring(0,3)}
                    </span>
                    <span className="font-black text-lg">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black italic flex items-center gap-2">
                <Clock size={14} className="text-indigo-600" /> Horarios del día
              </h3>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase text-slate-400">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-100 rounded-full"></div> Libre</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-100 rounded-full"></div> Ocupado</span>
              </div>
            </div>
            
            {isFetching ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentSlots.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Info size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No hay turnos disponibles para hoy</p>
                  </div>
                ) : currentSlots.map(h => {
                  const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                  const isPast = isTimeSlotPast(h);
                  const isSelected = selectedSlot === h;
                  
                  return (
                    <button 
                      key={h} 
                      disabled={!!apt || isPast} 
                      onClick={() => setSelectedSlot(h)} 
                      className={`py-6 rounded-3xl text-lg font-black transition-all duration-300 border-2 ${
                        apt 
                        ? 'bg-red-50 text-red-300 border-red-50 cursor-not-allowed opacity-60 scale-95' :
                        isPast 
                        ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed italic' :
                        isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-105 z-10' :
                        'bg-emerald-50 text-emerald-800 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-100'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </main>

          {/* SECCIÓN 3: MAPA Y BUSCADOR */}
          <aside className="w-full lg:w-1/4 flex flex-col border-l border-slate-100 bg-white">
              <div className="p-8">
                <a 
                  href="https://wa.me/543400000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-3 w-full bg-emerald-500 text-white font-black text-[11px] py-5 rounded-[1.5rem] mb-8 uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all hover:-translate-y-1"
                >
                    <MessageCircle size={20} /> Hablar al WhatsApp
                </a>

                <div className="h-[220px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white grayscale hover:grayscale-0 transition-all duration-700 mb-6">
                    <iframe 
                      title="mapa-ubicacion"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3334.33320625692!2d-60.334444!3d-33.226944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDEzJzM3LjAiUyA2MMKwMjAnMDQuMCJX!5e0!3m2!1ses!2sar!4v1650000000000!5m2!1ses!2sar"
                      allowFullScreen="" 
                      loading="lazy">
                    </iframe>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl flex items-start gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ubicación</p>
                    <p className="text-xs font-black text-black leading-tight">Av. San Martín 1234<br/>Villa Constitución, SF</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-black p-8 rounded-t-[4rem] text-white">
                <h3 className="font-black text-[11px] uppercase tracking-widest mb-6 flex items-center gap-3 italic text-indigo-400">
                    <Search size={16} /> Mis Turnos Agendados
                </h3>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="tel" 
                    placeholder="Buscá por tu número..." 
                    className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-[11px] font-black outline-none focus:border-indigo-600 text-white placeholder:text-slate-600" 
                    value={searchPhone} 
                    onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} 
                  />
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[250px] custom-scroll pr-2">
                    {myAppointments.map(apt => (
                      <div key={apt.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center group hover:border-indigo-900 transition-colors">
                          <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{apt.fecha.split('-').reverse().join('/')}</p>
                            <p className="font-black text-lg text-white">{apt.hora.substring(0,5)} HS</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{apt.servicio}</p>
                          </div>
                          <button 
                            onClick={() => handleCancel(apt.id)}
                            className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                      </div>
                    ))}
                    {searchPhone.length > 4 && myAppointments.length === 0 && (
                      <p className="text-[10px] text-center text-slate-600 font-bold italic py-10 uppercase tracking-widest">No se encontraron registros</p>
                    )}
                </div>
              </div>
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="mt-16 mb-10 px-8 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-200 pt-10">
            <div className="text-center md:text-left">
                <h4 className="text-3xl font-black text-black lowercase italic mb-2 tracking-tighter">
                  ejemplo<span className="text-indigo-600">.barber</span>
                </h4>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  © 2026 Villa Constitución • Estilo y Tradición
                </p>
            </div>
            
            <div className="flex gap-4">
                <a href="#" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-black hover:text-indigo-600 hover:shadow-xl transition-all"><Instagram size={22} /></a>
                <a href="#" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-black hover:text-indigo-600 hover:shadow-xl transition-all"><Facebook size={22} /></a>
                <a href="#" className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-black hover:text-emerald-500 hover:shadow-xl transition-all"><MessageCircle size={22} /></a>
            </div>

            <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase text-black italic tracking-widest">Developed by Daaneri</p>
                <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Software de gestión para barberías v3.0</p>
            </div>
        </footer>
      </div>
    </div>
  );
}