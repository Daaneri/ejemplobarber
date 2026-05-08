import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, 
  Search, 
  MapPin, 
  Clock,
  CheckCircle,
  Smartphone
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
  const [loading, setLoading] = useState(true);

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
    if (hour < now.getHours()) return true;
    if (hour === now.getHours() && minutes <= now.getMinutes()) return true;
    return false;
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
    setLoading(true);
    const { data } = await supabase.from('appointments').select('*').eq('fecha', dateString);
    setAppointments(data || []);
    setLoading(false);
  }

  const generateSlots = () => {
    const diaActual = getDayName(selectedDate);
    const config = configHorarios.find(h => h.dia === diaActual);
    if (!config || !config.activo) return [];

    const slots = [];
    let inicio = parseInt(config.apertura.split(':')[0]);
    let fin = parseInt(config.cierre.split(':')[0]);

    for (let h = inicio; h < fin; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  async function fetchMyAppointments(phone) {
    if (phone.length < 3) return setMyAppointments([]);
    const { data } = await supabase.from('appointments').select('*').eq('telefono', phone.trim()).order('fecha', { ascending: false });
    setMyAppointments(data || []);
  }

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) {
      return Swal.fire({ 
        title: '¡Faltan datos!', 
        text: 'Por favor completá tu nombre, celu y elegí un horario.', 
        icon: 'warning', 
        confirmButtonColor: '#4f46e5' 
      });
    }

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
        text: `Tu turno para ${selectedService.nombre} a las ${selectedSlot}hs fue agendado.`,
        icon: 'success',
        confirmButtonText: 'Genial',
        confirmButtonColor: '#4f46e5'
      });
      setSelectedSlot(null);
      getAppointments();
    }
  };

  const currentSlots = generateSlots();

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 px-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter lowercase italic">
              ejemplo<span className="text-indigo-600">.barber</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
              Villa Constitución • Santa Fe
            </p>
          </div>
          <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase">Sistema Activo</span>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px]">
          
          {/* PASO 1 Y 2 */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-6">Paso 1: Servicio</h3>
            <div className="space-y-2 mb-8">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedService?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                  <span className="text-xs font-bold">{s.nombre}</span>
                  <span className="text-[10px] font-bold opacity-80">${s.precio.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-4">Paso 2: Tus Datos</h3>
              <input type="text" placeholder="Tu Nombre" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="Tu WhatsApp" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              
              <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Resumen</p>
                <div className="text-2xl font-black text-indigo-600">${selectedService?.precio.toLocaleString()}</div>
                <p className="text-[9px] text-slate-500 mt-1 italic font-medium">
                  {selectedSlot ? `Horario: ${selectedSlot} hs` : "* Elegí un horario"}
                </p>
              </div>

              <button 
                onClick={handleReserve} 
                disabled={!form.name || !form.phone || !selectedSlot}
                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all mt-4 ${
                  (!form.name || !form.phone || !selectedSlot) 
                  ? 'bg-slate-200 text-slate-400' 
                  : 'bg-slate-900 text-white active:scale-95 hover:bg-black'
                }`}
              >
                RESERVAR AHORA
              </button>
            </div>
          </div>

          {/* COLUMNA CENTRAL: CALENDARIO */}
          <div className="w-full md:w-2/4 p-6 md:p-10">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} <span className="text-indigo-600">{selectedDate.getFullYear()}</span>
              </h2>
            </header>
            
            <div className="flex gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[55px] py-4 rounded-2xl text-sm flex flex-col items-center transition-all ${getLocalDateString(selectedDate) === getLocalDateString(d) ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>
                    <span className="text-[8px] font-black uppercase mb-1 opacity-60">{getDayName(d).substring(0,3)}</span>
                    <span className="font-black text-base">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {currentSlots.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-red-50 rounded-[2rem] border border-red-100">
                  <p className="text-red-400 font-black text-xs uppercase tracking-widest">Cerrado este día</p>
                </div>
              ) : currentSlots.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                return (
                  <button key={h} disabled={!!apt || isPast} onClick={() => setSelectedSlot(h)} className={`py-4 rounded-xl text-xs font-black transition-all border ${apt ? 'bg-red-50 text-red-200 border-red-50 cursor-not-allowed' : isPast ? 'bg-slate-50 text-slate-200 border-transparent cursor-not-allowed' : selectedSlot === h ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105' : 'bg-green-50 text-green-600 border-green-100 hover:border-green-300'}`}>{h}</button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: MAPA Y TURNOS */}
          <div className="w-full md:w-1/4 flex flex-col border-l border-slate-100 bg-white">
            <div className="p-6">
              <a href="https://wa.me/543400000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-green-500 text-white font-black uppercase text-[10px] py-5 rounded-2xl shadow-lg hover:bg-green-600 transition-all">
                <MessageCircle className="w-5 h-5" /> WhatsApp Barbería
              </a>
              
              {/* MAPA REAL VILLA CONSTITUCIÓN */}
              <div className="mt-6 h-[180px] w-full rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner relative group">
                <iframe 
                  title="mapa-villa"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.449764835691!2d-60.33446!3d-33.2269!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDEzJzM2LjgiUyA2MMKwMjAnMDQuMSJX!5e0!3m2!1ses-419!2sar!4v1715000000000!5m2!1ses-419!2sar" 
                  allowFullScreen="" 
                  loading="lazy"
                  className="grayscale group-hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>
              <div className="mt-4 flex items-start gap-3 text-slate-400 px-2">
                <MapPin className="w-4 h-4 text-indigo-600 mt-1" />
                <p className="text-[10px] font-bold leading-relaxed uppercase">Av. San Martín 1234<br/>Villa Constitución, SF</p>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 p-6 rounded-t-[3rem] border-t border-slate-100 mt-4">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                <Search className="w-3 h-3 text-indigo-600" /> Mis Reservas
              </h3>
              <input type="tel" placeholder="Tu WhatsApp..." className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-[10px] outline-none focus:ring-2 ring-indigo-100 mb-4 font-bold" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[8px] font-black text-indigo-500 uppercase mb-1">{apt.fecha.split('-').reverse().join('/')}</p>
                    <div className="flex justify-between items-end">
                      <p className="font-black text-sm text-slate-900">{apt.hora.substring(0,5)} HS</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{apt.servicio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTUALIZADO */}
        <footer className="mt-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-6 text-center md:text-left">
          <div>
            <h4 className="text-xl font-black text-slate-900 lowercase italic tracking-tighter">
              ejemplo<span className="text-indigo-600">.barber</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Turnos Online • Villa Constitución
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              © 2026 — ejemplo.barber
            </p>
            {/* CAMBIO AQUÍ: Etiqueta span y nuevo texto estático */}
            <span className="text-[9px] text-slate-900 font-black uppercase tracking-tighter mt-1 italic inline-block">
              EliteWar Soft
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}