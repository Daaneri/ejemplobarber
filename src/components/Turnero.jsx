import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import { Calendar as CalendarIcon, MapPin, MessageCircle, ChevronLeft, ChevronRight, XCircle, Lock, Search, List, CheckCircle } from 'lucide-react';

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "12:40", "14:00", "16:00", "17:20", "18:00", "19:20"];

const SERVICIOS = [
  { id: 'corte', nombre: 'Corte General', precio: '$10.000' },
  { id: 'barba', nombre: 'Barba Prof.', precio: '$5.000' },
  { id: 'combo', nombre: 'Corte + Barba', precio: '$14.000' }
];

export default function Turnero() {
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState(SERVICIOS[0]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [searchPhone, setSearchPhone] = useState('');
  
  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const dateString = getLocalDateString(selectedDate);

  const isToday = dateString === getLocalDateString(new Date());
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();

  const isTimeSlotPast = (slot) => {
    if (!isToday) return false;
    const [hour, minutes] = slot.split(':').map(Number);
    if (hour < currentHour) return true;
    if (hour === currentHour && minutes <= currentMinutes) return true;
    return false;
  };

  useEffect(() => {
    getAppointments();
    const channel = supabase
      .channel('cambios-turnos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        getAppointments();
        if (searchPhone.length >= 3) fetchMyAppointments(searchPhone);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, searchPhone]);

  async function getAppointments() {
    const { data } = await supabase.from('appointments').select('*').eq('fecha', dateString);
    setAppointments(data || []);
  }

  async function fetchMyAppointments(phone) {
    if (!phone || phone.trim().length < 3) {
      setMyAppointments([]);
      return;
    }
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('telefono', phone.trim())
      .order('fecha', { ascending: false });
    if (!error) setMyAppointments(data || []);
  }

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) return alert("Completá todos los campos");
    
    const { error } = await supabase.from('appointments').insert([
      { 
        cliente: form.name, 
        telefono: form.phone.trim(), 
        fecha: dateString, 
        hora: selectedSlot, 
        servicio: selectedService.nombre 
      }
    ]);

    if (!error) {
      const mensaje = `¡Hola! Soy ${form.name}. Reservé un turno para el día ${selectedDate.getDate()} de Mayo a las ${selectedSlot} hs para: ${selectedService.nombre}.`;
      const url = `https://wa.me/543416909040?text=${encodeURIComponent(mensaje)}`;
      
      alert("¡Turno reservado con éxito!");
      window.open(url, '_blank');
      
      setSelectedSlot(null);
      setForm({ name: '', phone: '' });
      getAppointments();
    }
  };

  const handleCancel = async (id) => {
    const confirmacion = window.confirm("¿Deseas cancelar este turno?");
    if (confirmacion) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) {
        alert("Turno cancelado.");
        getAppointments();
        fetchMyAppointments(searchPhone);
      }
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER EJEMPLO.BARBER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter lowercase">
              ejemplo<span className="text-indigo-600">.barber</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
              Villa Constitución • Santa Fe
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase">Estado</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">Abierto Ahora</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
          
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y RESERVA */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-6">Configuración</h3>
            
            <div className="mb-6">
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Elegí el Servicio</label>
               <div className="space-y-2">
                 {SERVICIOS.map(s => (
                   <button 
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                      selectedService.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                   >
                     <span className="text-xs font-bold">{s.nombre}</span>
                     <span className={`text-[10px] ${selectedService.id === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>{s.precio}</span>
                   </button>
                 ))}
               </div>
            </div>

            <div className={`space-y-3 ${selectedSlot ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="mb-4">
                <p className="text-xs text-indigo-500 font-bold uppercase">{selectedDate.getDate()} Mayo, 2026</p>
                <p className="text-sm font-bold text-slate-900">{selectedSlot || '--:--'} hs</p>
              </div>
              <input type="text" placeholder="Tu Nombre" className="w-full bg-white p-3 rounded-xl text-xs border border-slate-200 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="Tu WhatsApp" className="w-full bg-white p-3 rounded-xl text-xs border border-slate-200 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <button onClick={handleReserve} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm">RESERVAR Y AVISAR</button>
            </div>
            
            <div className="mt-auto pt-8 border-t border-slate-200">
              <a href="https://wa.me/543416909040" target="_blank" rel="noreferrer" className="flex gap-3 items-center text-green-600 font-black uppercase text-[10px] hover:opacity-80 transition-opacity">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Barbería
              </a>
            </div>
          </div>

          {/* COLUMNA CENTRAL: CALENDARIO */}
          <div className="w-full md:w-2/4 p-6 md:p-10 border-r border-slate-100">
            <header className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold">Mayo <span className="text-slate-300 font-light">2026</span></h2>
            </header>
            <div className="grid grid-cols-7 gap-2 mb-10">
              {days.map((day) => (
                <button key={day} onClick={() => setSelectedDate(new Date(2026, 4, day))} className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedDate.getDate() === day ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {HORARIOS.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                const isSelected = selectedSlot === h;

                return (
                  <button 
                    key={h} 
                    disabled={!!apt || isPast} 
                    onClick={() => setSelectedSlot(h)} 
                    className={`py-3 rounded-xl text-[13px] font-bold transition-all border relative ${
                      apt ? 'bg-red-50 border-red-100 text-red-200 cursor-not-allowed' : 
                      isPast ? 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed' :
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 
                      'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {h}
                    {apt && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-20" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: MAPA + CANCELACIÓN */}
          <div className="w-full md:w-1/4 flex flex-col border-l border-slate-100 overflow-hidden">
            <div className="h-1/2 w-full p-4">
              <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                <iframe title="mapa-barberia" width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13344.475688583485!2d-60.334438!3d-33.223015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b76c66a337c767%3A0x63351336f32a76f2!2sVilla%20Constituci%C3%B3n%2C%20Santa%20Fe!5e0!3m2!1ses!2sar!4v1715100000000!5m2!1ses!2sar" allowFullScreen></iframe>
              </div>
            </div>

            <div className="h-1/2 w-full bg-slate-50 p-6 flex flex-col border-t border-slate-100">
              <h3 className="font-bold text-sm leading-tight mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
                Mis Turnos
              </h3>
              <div className="relative mb-4">
                <input type="tel" placeholder="WhatsApp..." className="w-full bg-white border border-slate-200 p-2 pl-8 rounded-xl text-[11px] outline-none focus:border-indigo-400 transition-all" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
                <Search className="w-3 h-3 text-slate-300 absolute left-3 top-2.5" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {myAppointments.length > 0 ? (
                  myAppointments.map(apt => (
                    <div key={apt.id} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-[9px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')} - {apt.hora.substring(0,5)}hs</p>
                      <p className="text-[10px] font-bold truncate pr-6">{apt.servicio}</p>
                      <button onClick={() => handleCancel(apt.id)} className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-300 hover:text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-30 italic text-[10px]">Sin turnos</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}