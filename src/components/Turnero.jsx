import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { MessageCircle, Lock, Search, XCircle, CheckCircle, Smartphone } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

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

  const handleReserve = async () => {
    if (!form.name || !form.phone || !selectedSlot) {
      return Swal.fire({ title: '¡Ups!', text: 'Por favor completá todos los datos.', icon: 'warning', confirmButtonColor: '#4f46e5' });
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
        text: `Te esperamos el día ${selectedDate.getDate()} a las ${selectedSlot}hs.`,
        icon: 'success',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-[2rem]' }
      });

      setSelectedSlot(null);
      setForm({ name: '', phone: '' });
      getAppointments();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
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
            <span className="text-[10px] font-bold uppercase">Abierto Ahora</span>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px]">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50 border-r border-slate-100">
            
            {/* TÍTULOS EN VIOLETA/NEGRO DESTACADO */}
            <h3 className="font-black text-[11px] uppercase tracking-widest text-indigo-600 mb-6">Paso 1: Servicio</h3>
            
            <div className="space-y-2 mb-8">
              {SERVICIOS.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedService.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                  <span className="text-xs font-bold">{s.nombre}</span>
                  <span className="text-[10px] font-bold opacity-80">${s.precio.toLocaleString()}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-[11px] uppercase tracking-widest text-indigo-600 mb-4">Paso 2: Tus Datos</h3>
              
              <input type="text" placeholder="Tu Nombre" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100 placeholder:text-slate-300" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input type="tel" placeholder="Tu WhatsApp" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-200 outline-none focus:ring-2 ring-indigo-100 placeholder:text-slate-300" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              
              <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl mt-4">
                <p className="text-[10px] font-bold text-slate-900 uppercase">Resumen de reserva</p>
                <div className="text-2xl font-black text-indigo-600">${selectedService.precio.toLocaleString()}</div>
                <p className="text-[9px] text-slate-500 mt-1 italic">
                  {selectedSlot ? `Hora: ${selectedSlot} hs` : "* Elegí un horario en el centro"}
                </p>
              </div>

              <button 
                onClick={handleReserve} 
                disabled={!form.name || !form.phone || !selectedSlot}
                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all ${
                  (!form.name || !form.phone || !selectedSlot) 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white active:scale-95 hover:bg-black'
                }`}
              >
                CONFIRMAR TURNO
              </button>
            </div>
          </div>

          {/* COLUMNA CENTRAL */}
          <div className="w-full md:w-2/4 p-6 md:p-10">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Mayo <span className="text-slate-300 font-light">2026</span></h2>
              <Smartphone className="w-4 h-4 text-slate-200" />
            </header>
            
            <div className="grid grid-cols-7 gap-2 mb-10 overflow-x-auto pb-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button key={day} onClick={() => setSelectedDate(new Date(2026, 4, day))} className={`min-w-[40px] py-3 rounded-xl text-sm font-bold transition-all ${selectedDate.getDate() === day ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
              ))}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {HORARIOS.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                if (loading) return <div key={h} className="h-14 bg-slate-100 animate-pulse rounded-xl"></div>;
                return (
                  <button key={h} disabled={!!apt || isPast} onClick={() => setSelectedSlot(h)} className={`py-4 rounded-xl text-xs font-black transition-all border ${apt ? 'bg-red-50 text-red-200 cursor-not-allowed' : isPast ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : selectedSlot === h ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-green-50 text-green-600 hover:scale-105'}`}>{h}</button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="w-full md:w-1/4 flex flex-col border-l border-slate-100">
            <div className="p-4 bg-white">
              <a href="https://wa.me/1111111111" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-green-50 text-green-600 border border-green-100 font-black uppercase text-[10px] py-4 rounded-2xl hover:bg-green-100 transition-all">
                <MessageCircle className="w-4 h-4" /> WhatsApp Barbería
              </a>
            </div>

            <div className="h-[200px] w-full px-4 mb-4">
              <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner grayscale hover:grayscale-0 transition-all">
                <iframe title="map" width="100%" height="100%" frameBorder="0" src="http://googleusercontent.com/maps.google.com/6" allowFullScreen></iframe>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 p-6 rounded-t-[2.5rem] border-t border-slate-100">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" /> Mis Reservas
              </h3>
              <div className="relative mb-4">
                <input type="tel" placeholder="Tu WhatsApp..." className="w-full bg-white border border-slate-200 p-3 pl-8 rounded-xl text-[10px] outline-none focus:border-indigo-400" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
                <Search className="w-3 h-3 text-slate-300 absolute left-2.5 top-3" />
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {myAppointments.map(apt => (
                  <div key={apt.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group animate-in slide-in-from-bottom-2">
                    <p className="text-[8px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                    <p className="font-bold text-xs">{apt.hora.substring(0,5)} hs</p>
                    <p className="text-[9px] text-slate-400 truncate pr-6">{apt.servicio}</p>
                    <button onClick={() => {}} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pb-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 px-6">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black text-slate-900 lowercase italic">
              ejemplo<span className="text-indigo-600">.barber</span>
            </h4>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">
              Estilo y Precisión en cada corte
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-400 font-medium italic">© 2026 ejemplo.barber — Villa Constitución, Santa Fe.</p>
            <p className="text-[9px] text-slate-900 font-bold uppercase tracking-tighter mt-1">Desarrollado por Daaneri</p>
          </div>
        </footer>
      </div>
    </div>
  );
}