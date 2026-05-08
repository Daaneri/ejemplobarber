{/* COLUMNA DERECHA: INFO Y MIS TURNOS */}
<div className="w-full md:w-1/4 flex flex-col border-l border-slate-100 bg-white">
  <div className="p-6">
    <a href="https://wa.me/543400000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-green-500 text-white font-black uppercase text-[10px] py-5 rounded-2xl shadow-lg hover:bg-green-600 transition-all">
      <MessageCircle className="w-5 h-5" /> WhatsApp Barbería
    </a>
    
    {/* MAPA REAL DE VILLA CONSTITUCIÓN */}
    <div className="mt-6 h-[180px] w-full rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner relative group">
      <iframe 
        title="mapa-villa"
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13349.535876356616!2d-60.33719005!3d-33.2238426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b76c499577977b%3A0x6e9f02908f43058a!2sVilla%20Constituci%C3%B3n%2C%20Santa%20Fe!5e0!3m2!1ses!2sar!4v1715185000000!5m2!1ses!2sar" 
        allowFullScreen="" 
        loading="lazy"
        className="grayscale group-hover:grayscale-0 transition-all duration-500"
      ></iframe>
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl border border-slate-200 flex items-start gap-2 pointer-events-none">
        <MapPin className="w-3 h-3 text-indigo-600 mt-0.5" />
        <p className="text-[8px] font-bold leading-tight uppercase text-slate-600">Av. San Martín 1234<br/>Villa Constitución, SF</p>
      </div>
    </div>
  </div>

  <div className="flex-1 bg-slate-50 p-6 rounded-t-[3rem] border-t border-slate-100 mt-4">
    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
      <Search className="w-3 h-3 text-indigo-600" /> Mis Reservas
    </h3>
    <input 
      type="tel" 
      placeholder="Tu WhatsApp..." 
      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-[10px] outline-none focus:ring-2 ring-indigo-100 mb-4 font-bold" 
      value={searchPhone} 
      onChange={(e) => { setSearchPhone(e.target.value); fetchMyAppointments(e.target.value); }} 
    />
    
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {myAppointments.map(apt => (
        <div key={apt.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[8px] font-black text-indigo-500 uppercase mb-1">{apt.fecha.split('-').reverse().join('/')}</p>
          <div className="flex justify-between items-end">
            <p className="font-black text-sm text-slate-900">{apt.hora.substring(0,5)} HS</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{apt.servicio}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>