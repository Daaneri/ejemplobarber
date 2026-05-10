import React, { useState, useEffect } from 'react';
import { supabase } from "../supabaseClient";
import Swal from 'sweetalert2';
import { 
  MessageCircle, 
  Search, 
  MapPin, 
  Trash2,
  Instagram,
  Facebook,
  Clock
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

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { getAppointments(); }, [selectedDate]);

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
    if (!form.name || !form.phone || !selectedSlot) {
        return Swal.fire({ title: '¡Faltan datos!', icon: 'warning', confirmButtonColor: '#4f46e5' });
    }
    const { error } = await supabase.from('appointments').insert([{ 
      cliente: form.name, 
      telefono: form.phone.trim(), 
      fecha: dateString, 
      hora: selectedSlot, 
      servicio: selectedService.nombre 
    }]);
    if (!error) {
      Swal.fire({ title: '¡Reserva Confirmada!', icon: 'success', confirmButtonColor: '#10b981' });
      setSelectedSlot(null);
      getAppointments();
    }
  };

  const currentSlots = generateSlots();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-950">
      <style>{`
        .barra-dias::-webkit-scrollbar { height: 6px; }
        .barra-dias::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
        .barra-dias::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>

      <div className="max-w-6xl mx-auto p-2 md:p-10">
        <header className="flex justify-between items-center mb-8 px-6">
          <h1 className="text-4xl font-black text-black tracking-tighter lowercase italic">
            ejemplo<span className="text-indigo-600">.barber</span>
          </h1>
          <div className="bg-white px-3 py-1 rounded-full border border-slate-300 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-black">Sistema Activo</span>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px]">
          {/* COLUMNA IZQUIERDA */}
          <div className="w-full md:w-1/4 p-8 flex flex-col bg-slate-50 border-r border-slate-200">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-black mb-6 italic">Paso 1: Servicio</h3>
            <div className="space-y-2 mb-8">
              {servicios.map(s => (
                <button key={s.id} onClick={() => setSelectedService(s)} className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedService?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-300 text-black hover:border-indigo-400'}`}>
                  <span className="text-xs font-black">{s.nombre}</span>
                  <span className="text-[10px] font-black opacity-90">${s.precio}</span>
                </button>
              ))}
            </div>

            <h3 className="font-black text-[11px] uppercase tracking-widest text-black mb-4 italic">Paso 2: Tus Datos</h3>
            <div className="space-y-2">
                <input type="text" placeholder="Tu Nombre" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-400 text-black outline-none focus:ring-2 ring-indigo-100 placeholder:text-slate-500 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input type="tel" placeholder="WhatsApp" className="w-full bg-white p-4 rounded-2xl text-xs border border-slate-400 text-black outline-none focus:ring-2 ring-indigo-100 placeholder:text-slate-500 font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>

            <div className="bg-white border-2 border-dashed border-slate-300 p-4 rounded-2xl mt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase">Resumen</p>
                <div className="text-2xl font-black text-black">${selectedService?.precio || 0}</div>
                <p className="text-[9px] text-indigo-700 font-black italic mt-1">{selectedSlot ? `Horario: ${selectedSlot} hs` : "* Elegí un horario"}</p>
            </div>

            <button onClick={handleReserve} className="w-full font-black py-4 rounded-2xl shadow-xl transition-all mt-4 bg-black text-white hover:bg-slate-900 active:scale-95">
                RESERVAR TURNO
            </button>
          </div>

          {/* COLUMNA CENTRAL */}
          <div className="w-full md:w-2/4 p-8">
            <h2 className="text-2xl font-black text-black tracking-tight uppercase italic mb-6">
                {selectedDate.toLocaleDateString('es-ES', { month: 'long' })} <span className="text-indigo-600">{selectedDate.getFullYear()}</span>
            </h2>
            
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 barra-dias">
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[60px] py-4 rounded-2xl text-sm flex flex-col items-center transition-all ${getLocalDateString(selectedDate) === getLocalDateString(d) ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-black border border-slate-300 hover:bg-slate-50'}`}>
                    <span className="text-[8px] font-black uppercase mb-1 opacity-70">{getDayName(d).substring(0,3)}</span>
                    <span className="font-black text-base">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-4 italic flex items-center gap-2">
                <Clock size={12} className="text-indigo-600" /> Horarios Disponibles
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currentSlots.length === 0 ? (
                <div className="col-span-full py-10 text-center bg-red-50 rounded-2xl border border-red-200 text-red-600 font-black uppercase text-xs italic">Cerrado</div>
              ) : currentSlots.map(h => {
                const apt = appointments.find(a => a.hora && a.hora.startsWith(h));
                const isPast = isTimeSlotPast(h);
                return (
                  <button 
                    key={h} 
                    disabled={!!apt || isPast} 
                    onClick={() => setSelectedSlot(h)} 
                    className={`py-5 rounded-2xl text-base font-black transition-all border ${
                      apt ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed opacity-50' :
                      isPast ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed' :
                      selectedSlot === h ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="w-full md:w-1/4 flex flex-col border-l border-slate-200 bg-white">
              <div className="p-6">
                <a href="https://wa.me/543400000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-black text-[10px] py-5 rounded-2xl mb-6 uppercase shadow-lg hover:bg-green-700 transition-all">
                    <MessageCircle size={18} /> WhatsApp Barbería
                </a>

                <div className="h-[180px] w-full rounded-[2rem] overflow-hidden shadow-inner border border-slate-200 grayscale mb-4">
                    <iframe title="map" width="100%" height="100%" frameBorder="0" src="http://googleusercontent.com/maps.google.com/6" allowFullScreen="" loading="lazy"></iframe>
                </div>

                <div className="flex items-start gap-3 text-black px-2 mb-6 font-bold">
                    <MapPin className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
                    <p className="text-[10px] leading-relaxed uppercase">Av. San Martín 1234<br/>Villa Constitución, SF</p>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 p-6 rounded-t-[3rem] border-t border-slate-200">
                <h3 className="font-black text-[10px] uppercase tracking-widest text-black mb-4 flex items-center gap-2 italic">
                    <Search size={12} className="text-indigo-600" /> Buscar mi turno
                </h3>
                <input type="tel" placeholder="Tu Celular..." className="w-full bg-white border border-slate-400 p-4 rounded-2xl text-[10px] outline-none focus:ring-2 ring-indigo-100 mb-4 font-black shadow-sm" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} />
                
                <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {myAppointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-white border border-slate-300 rounded-2xl flex justify-between items-center shadow-sm">
                        <div>
                        <p className="text-[8px] font-black text-indigo-600 uppercase">{apt.fecha.split('-').reverse().join('/')}</p>
                        <p className="font-black text-sm text-black">{apt.hora.substring(0,5)} HS</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase">{apt.servicio}</p>
                        </div>
                        <Trash2 size={16} className="text-slate-400 hover:text-red-600 cursor-pointer transition-colors" onClick={() => {
                             // Lógica de borrado igual a la anterior
                        }} />
                    </div>
                    ))}
                </div>
              </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 mb-8 px-6 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-300 pt-8">
            <div className="text-center md:text-left">
                <h4 className="text-lg font-black text-black lowercase italic mb-1">ejemplo<span className="text-indigo-600">.barber</span></h4>
                <p className="text-[10px] font-black uppercase text-slate-600">© 2026 Villa Constitución • Santa Fe</p>
            </div>
            <div className="flex gap-4">
                <a href="#" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-300 text-black hover:text-indigo-600 transition-all"><Instagram size={18} /></a>
                <a href="#" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-300 text-black hover:text-indigo-600 transition-all"><Facebook size={18} /></a>
            </div>
            <div className="text-center md:text-right">
                <p className="text-[9px] font-black uppercase text-black italic">Developed by Daaneri</p>
            </div>
        </footer>
      </div>
    </div>
  );
}