import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import { Calendar as CalendarIcon, MapPin, MessageCircle, ChevronLeft, ChevronRight, XCircle, Lock, Search, List } from 'lucide-react';

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "12:40", "14:00", "16:00", "17:20", "18:00", "19:20"];

export default function Turnero() {
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ name: '', phone: '' });
  const [searchPhone, setSearchPhone] = useState('');
  
  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const dateString = getLocalDateString(selectedDate);

  useEffect(() => {
    getAppointments();
    
    // Suscripción en tiempo real corregida
    const channel = supabase
      .channel('cambios-turnos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        getAppointments();
        if (searchPhone.length >= 3) fetchMyAppointments(searchPhone);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        servicio: 'Corte General' 
      }
    ]);

    if (!error) {
      alert("¡Turno reservado!");
      setSelectedSlot(null);
      setForm({ name: '', phone: '' });
      getAppointments();
    } else {
      alert("Error al reservar: " + error.message);
    }
  };

  const handleCancel = async (id) => {
    const confirmacion = window.confirm("¿Deseas cancelar este turno definitivamente?");
    if (confirmacion) {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (!error) {
        alert("Turno cancelado.");
        // Forzamos la actualización de ambas listas
        getAppointments();
        fetchMyAppointments(searchPhone);
      } else {
        alert("Error al cancelar: Verifica los permisos en Supabase (RLS)");
      }
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* COLUMNA 1: MIS RESERVAS */}
        <div className="w-full md:w-1/4 bg-slate-50 p-8 border-r border-slate-100 flex flex-col">
          <div className="bg-white p-4 rounded-3xl shadow-sm mb-6 border border-slate-100 flex items-center justify-center">
            <List className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="font-bold text-lg leading-tight mb-2">Mis Reservas</h3>
          <p className="text-slate-400 text-xs mb-6">Buscá por tu número de WhatsApp.</p>
          
          <div className="relative mb-6">
            <input 
              type="tel" 
              placeholder="Ej: 3416..." 
              className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-2xl text-xs outline-none focus:border-indigo-400 transition-all"
              value={searchPhone}
              onChange={(e) => {
                setSearchPhone(e.target.value);
                fetchMyAppointments(e.target.value);
              }}
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-3" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {myAppointments.length > 0 ? (
              myAppointments.map(apt => (
                <div key={apt.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative group animate-in fade-in slide-in-from-left-2">
                  <div className="pr-6">
                    <p className="text-[10px] font-black text-indigo-500 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                    <p className="font-bold text-sm">{apt.hora.substring(0,5)} hs</p>
                    <p className="text-[10px] text-slate-400">{apt.cliente}</p>
                  </div>
                  <button 
                    onClick={() => handleCancel(apt.id)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Cancelar turno"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-20 italic text-xs">
                {searchPhone.length >= 3 ? "No se encontraron turnos" : "Ingresá tu número"}
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto Barbería</p>
            <a href="tel:3416208801" className="text-slate-900 font-bold text-sm">3416208801</a>
          </div>
        </div>

        {/* COLUMNA 2: CALENDARIO */}
        <div className="w-full md:w-2/4 p-6 md:p-10 border-r border-slate-100">
          <header className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold">Mayo <span className="text-slate-300 font-light">2026</span></h2>
          </header>

          <div className="grid grid-cols-7 gap-2 mb-10">
            {days.map((day) => (
              <button 
                key={day}
                onClick={() => setSelectedDate(new Date(2026, 4, day))}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedDate.getDate() === day ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {HORARIOS.map(h => {
              const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
              const isSelected = selectedSlot === h;
              return (
                <button
                  key={h}
                  disabled={!!apt}
                  onClick={() => setSelectedSlot(h)}
                  className={`py-3 rounded-xl text-[13px] font-bold transition-all border relative ${
                    apt ? 'bg-red-50 border-red-100 text-red-200 cursor-not-allowed' :
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

        {/* COLUMNA 3: CONFIRMACIÓN */}
        <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50/50">
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-300 mb-6">Confirmación</h3>
          
          <div className="mb-8">
            <p className="font-extrabold text-xl leading-tight">Corte General</p>
            <p className="text-xs text-indigo-500 font-bold uppercase">{selectedDate.getDate()} Mayo, 2026</p>
            <p className="text-sm font-bold mt-1 text-slate-900">{selectedSlot || '--:--'} hs</p>
          </div>

          <div className={`space-y-3 transition-all ${selectedSlot ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <input 
              type="text" 
              placeholder="Tu Nombre" 
              className="w-full bg-white p-3 rounded-xl text-xs border border-slate-200 outline-none focus:border-indigo-400" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
            <input 
              type="tel" 
              placeholder="Tu WhatsApp" 
              className="w-full bg-white p-3 rounded-xl text-xs border border-slate-200 outline-none focus:border-indigo-400" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
            />
            <button 
              onClick={handleReserve} 
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              RESERVAR AHORA
            </button>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-200 flex flex-col gap-4 text-[10px]">
            <div className="flex gap-3 text-slate-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <p>Villa Constitución, Santa Fe</p>
            </div>
            <a href="https://wa.me/543416909040" target="_blank" rel="noreferrer" className="flex gap-3 items-center text-green-600 font-black uppercase hover:opacity-80 transition-opacity">
              <MessageCircle className="w-4 h-4" />
              Enviar WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}