import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import { Calendar as CalendarIcon, MapPin, MessageCircle, Lock, Search, XCircle, CheckCircle, Smartphone, CalendarPlus } from 'lucide-react';

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "12:40", "14:00", "16:00", "17:20", "18:00", "19:20"];
const SERVICIOS = [
  { id: 'corte', nombre: 'Corte General', precio: 10000 },
  { id: 'barba', nombre: 'Barba Prof.', precio: 5000 },
  { id: 'combo', nombre: 'Corte + Barba', precio: 14000 }
];

export default function Turnero() {
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState(SERVICIOS[0]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(true); // Estado para Skeletons

  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const dateString = getLocalDateString(selectedDate);
  const isToday = dateString === getLocalDateString(new Date());
  
  const isTimeSlotPast = (slot) => {
    if (!isToday) return false;
    const [hour, minutes] = slot.split(':').map(Number);
    const now = new Date();
    if (hour < now.getHours()) return true;
    if (hour === now.getHours() && minutes <= now.getMinutes()) return true;
    return false;
  };

  useEffect(() => {
    getAppointments();
    const channel = supabase.channel('cambios').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
      getAppointments();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate]);

  async function getAppointments() {
    setLoading(true);
    const { data } = await supabase.from('appointments').select('*').eq('fecha', dateString);
    setAppointments(data || []);
    setLoading(false);
  }

  async function fetchMyAppointments(phone) {
    if (phone.length < 3) return setMyAppointments([]);
    const { data } = await supabase.from('appointments').select('*').eq('telefono', phone.trim()).order('fecha', { ascending: false });
    setMyAppointments(data || []);
  }

  const addToCalendar = (date, slot, service) => {
    const [h, m] = slot.split(':');
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
    const end = new Date(start.getTime() + 45 * 60000); // 45 min duración
    const fmt = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service)}&dates=${fmt(start)}/${fmt(end)}&details=Turno+en+ejemplo.barber&location=Villa+Constitución&sf=true&output=xml`;
    window.open(url, '_blank');
  };

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) return alert("Completá los datos");
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: form.name, telefono: form.phone.trim(), fecha: dateString, hora: selectedSlot, servicio: selectedService.nombre 
    }]);

    if (!error) {
      const mensaje = `Hola! Soy ${form.name}. Reservé: ${selectedService.nombre} para el ${selectedDate.getDate()} a las ${selectedSlot}hs.`;
      alert("¡Turno confirmado!");
      if(window.confirm("¿Querés agendarlo en tu Google Calendar?")) {
        addToCalendar(selectedDate, selectedSlot, selectedService.nombre);
      }
      window.open(`https://wa.me/1111111111?text=${encodeURIComponent(mensaje)}`, '_blank');
      setSelectedSlot(null);
      setForm({ name: '', phone: '' });
      getAppointments();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter lowercase">ejemplo<span className="text-indigo-600">.barber</span></h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Villa Constitución • Santa Fe</p>
          </div>
          <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase">Abierto Ahora</span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:row-reverse md:flex-row min-h-[750px]">
          
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-6">Paso 1: Servicio</h3>
            <div className="space-y-2 mb-8">
              {SERVICIOS.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${selectedService.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                  <span className="text-xs font-bold">{s.nombre}</span>
                  <span className={`text-[10px] font-bold ${selectedService.id === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>${s.precio.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-4">Paso 2: Datos</h3>
            <div className={`space-y-3 transition-all ${selectedSlot ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
              <input type="text" placeholder="Tu Nombre" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp (Ej: 3416...)" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              
              {/* TICKET DE RESUMEN */}
              <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl mt-4">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>Total a pagar</span><span>{selectedSlot} hs</span></div>
                <div className="text-2xl font-black text-slate-900">${selectedService.precio.toLocaleString()}</div>
                <p className="text-[9px] text-slate-400 mt-1 italic">* El pago se realiza en el local.</p>
              </div>

              <button onClick={handleReserve} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                CONFIRMAR TURNO
              </button>
            </div>
          </div>

          {/* COLUMNA CENTRAL: CALENDARIO */}
          <div className="w-full md:w-2/4 p-6 md:p-10 border-r border-slate-100">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Mayo <span className="text-slate-300 font-light">2026</span></h2>
              <div className="flex gap-2 text-slate-400"><Smartphone className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Mobile Ready</span></div>
            </header>

            <div className="grid grid-cols-7 gap-2 mb-10 overflow-x-auto pb-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button key={day} onClick={() => setSelectedDate(new Date(2026, 4, day))} className={`min-w-[40px] py-3 rounded-xl text-sm font-bold transition-all ${selectedDate.getDate() === day ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
              ))}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {HORARIOS.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                const isSelected = selectedSlot === h;

                if (loading) return <div key={h} className="h-12 bg-slate-100 animate-pulse rounded-xl"></div>;

                return (
                  <button key={h} disabled={!!apt || isPast} onClick={() => setSelectedSlot(h)} className={`py-4 rounded-xl text-xs font-black transition-all border relative ${apt ? 'bg-red-50 border-red-100 text-red-200 cursor-not-allowed' : isPast ? 'bg-slate-50 border-slate-100 text-slate-200 opacity-50 cursor-not-allowed' : isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-green-50 border-green-100 text-green-600 hover:scale-105'}`}>
                    {h} {apt && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-20" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: INFO Y GESTIÓN */}
          <div className="w-full md:w-1/4 flex flex-col border-l border-slate-100 bg-white">
            <div className="p-4">
              <a href="https://wa.me/1111111111" className="flex items-center justify-center gap-3 w-full bg-green-500 text-white font-black uppercase text-[10px] py-4 rounded-2xl shadow-green-100 shadow-lg hover:bg-green-600 transition-all">
                <MessageCircle className="w-4 h-4 text-white" /> WhatsApp Barbería
              </a>
            </div>

            <div className="h-[200px] w-full px-4 mb-4">
              <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-100 grayscale hover:grayscale-0 transition-all">
                <iframe title="map" width="100%" height="100%" frameBorder="0" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13346.757827877!2d-60.334!3d-33.226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b76c489745d197%3A0x6e9f6d396947761!2sVilla%20Constituci%C3%B3n%2C%20Santa%20Fe!5e0!3m2!1ses!2sar!4v1715100000000" allowFullScreen></iframe>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 p-6 rounded-t-[2.5rem] border-t border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Search className="w-3 h-3" /> Mis Reservas</h3>
              <input type="tel" placeholder="Tu WhatsApp..." className="w-full bg-white border border-slate-200 p-3 rounded-xl text-[10px] mb-4 outline-none focus:border-indigo-400" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
              
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                    <p className="text-[8px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                    <p className="font-bold text-xs">{apt.hora.substring(0,5)} hs</p>
                    <p className="text-[9px] text-slate-400 truncate pr-6">{apt.servicio}</p>
                    <button onClick={() => handleCancel(apt.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}