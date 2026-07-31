import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CalendarView = ({ user, client, onOpenProject, onOpenInvoice, onOpenMilestone }) => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Month'); // 'Month' or 'Week'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: true,
    meeting: true,
    invoice: true,
    milestone: true
  });

  const userId = user?.id;
  const clientId = client?.id;

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const url = clientId 
        ? `https://gridlancer-production.up.railway.app/api/calendar/client/${clientId}` 
        : `https://gridlancer-production.up.railway.app/api/calendar/user/${userId}`;
      const res = await axios.get(url + `?t=${Date.now()}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId || clientId) {
      fetchCalendarEvents();
    }
  }, [userId, clientId]);

  // Helper: Month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Navigation
  const prevPeriod = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const todayPeriod = () => {
    setCurrentDate(new Date());
  };

  // Get week dates
  const getWeekDates = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day; // adjust when day is sunday
    const sunday = new Date(date.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(new Date(currentDate));

  // Filter events
  const filteredEvents = events.filter(e => filters[e.type]);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(e => {
      const evDate = new Date(e.start).toISOString().split('T')[0];
      return evDate === dateStr;
    });
  };

  // UI Event colors
  const eventStyles = {
    project: { bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/35', tag: 'Project Deadline', dot: 'bg-indigo-400' },
    meeting: { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/35', tag: 'Meeting Scheduled', dot: 'bg-cyan-400' },
    invoice: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35', tag: 'Invoice Due', dot: 'bg-emerald-400' },
    milestone: { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/35', tag: 'Milestone Target', dot: 'bg-amber-400' }
  };

  // Render Month grid
  const renderMonthDays = () => {
    const days = [];
    const prevMonthDays = getDaysInMonth(year, month - 1);
    
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const fillDay = prevMonthDays - i;
      days.push(
        <div key={`prev-${fillDay}`} className="min-h-[90px] sm:min-h-[110px] p-2 bg-slate-950/20 border border-slate-900 text-slate-600 select-none text-xs font-semibold">
          {fillDay}
        </div>
      );
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dayEvents = getEventsForDate(dayDate);
      const isToday = new Date().toDateString() === dayDate.toDateString();

      days.push(
        <div key={`day-${d}`} className={`min-h-[90px] sm:min-h-[110px] p-2 border border-slate-900 flex flex-col justify-between group hover:bg-slate-900/30 transition-all ${isToday ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-900/10'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${isToday ? 'bg-indigo-500 text-white shadow shadow-indigo-500/40' : 'text-slate-350 group-hover:text-white'}`}>
              {d}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</span>
            )}
          </div>
          
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] custom-scrollbar">
            {dayEvents.map(e => (
              <div 
                key={`${e.type}-${e.id}`} 
                onClick={(evt) => {
                  evt.stopPropagation();
                  setSelectedEvent(e);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border truncate cursor-pointer transition-all hover:scale-103 ${eventStyles[e.type]?.bg || ''}`}
                title={e.name}
              >
                {e.name}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Next month filler days to complete grid
    const totalDaysCount = firstDayIndex + daysInMonth;
    const remainingDays = 42 - totalDaysCount; // 6 rows * 7 days = 42
    for (let d = 1; d <= remainingDays; d++) {
      days.push(
        <div key={`next-${d}`} className="min-h-[90px] sm:min-h-[110px] p-2 bg-slate-950/20 border border-slate-900 text-slate-600 select-none text-xs font-semibold">
          {d}
        </div>
      );
    }

    return days;
  };

  // Render Week days
  const renderWeekDays = () => {
    return weekDates.map((date, index) => {
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      return (
        <div key={`week-day-${index}`} className={`flex-1 min-h-[300px] p-4 border border-slate-900 flex flex-col justify-start hover:bg-slate-900/20 transition-all ${isToday ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-900/10'}`}>
          <div className="border-b border-slate-800/80 pb-3 mb-4 text-center">
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{weekdayNames[date.getDay()]}</div>
            <div className={`mt-1.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold mx-auto ${isToday ? 'bg-indigo-500 text-white shadow shadow-indigo-500/40' : 'text-slate-200'}`}>
              {date.getDate()}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            {dayEvents.length === 0 ? (
              <div className="text-[10px] text-slate-600 italic text-center mt-10">No events</div>
            ) : (
              dayEvents.map(e => (
                <div 
                  key={`${e.type}-${e.id}`} 
                  onClick={() => setSelectedEvent(e)}
                  className={`p-2.5 rounded-xl border cursor-pointer hover:-translate-y-0.5 transition-all shadow-md ${eventStyles[e.type]?.bg || ''}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${eventStyles[e.type]?.dot}`}></span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{eventStyles[e.type]?.tag}</span>
                  </div>
                  <div className="text-[11px] font-bold truncate leading-snug">{e.name}</div>
                  {e.projectTitle && (
                    <div className="text-[9px] text-slate-400 truncate mt-1">Project: {e.projectTitle}</div>
                  )}
                  {e.start && (
                    <div className="text-[8px] text-slate-500 font-bold mt-1.5">
                      {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none"></div>
          
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              📅 <span>Calendar View</span>
            </h2>
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <button 
                onClick={() => setViewMode('Month')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'Month' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('Week')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'Week' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <button onClick={prevPeriod} className="p-2 sm:p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all">
                ◀️
              </button>
              <span className="text-sm sm:text-base font-extrabold text-white px-2.5 text-center min-w-[120px] sm:min-w-[160px]">
                {viewMode === 'Month' 
                  ? `${monthNames[month]} ${year}` 
                  : `Week of ${weekDates[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                }
              </span>
              <button onClick={nextPeriod} className="p-2 sm:p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all">
                ▶️
              </button>
            </div>
            <button onClick={todayPeriod} className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer transition-all">
              Today
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/30 border border-slate-900 p-4 rounded-2xl justify-start">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider mr-2">Filters:</span>
          {Object.keys(filters).map(cat => (
            <button
              key={cat}
              onClick={() => setFilters(prev => ({ ...prev, [cat]: !prev[cat] }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                filters[cat] 
                  ? eventStyles[cat].bg + ' border-transparent' 
                  : 'bg-transparent border-slate-850 text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${eventStyles[cat].dot}`}></span>
              {cat}s
            </button>
          ))}
        </div>

        {/* Main Grid View */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col backdrop-blur-md">
          {loading ? (
            <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Syncing calendar...</div>
          ) : viewMode === 'Month' ? (
            /* MONTH VIEW */
            <div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="py-2 text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/20">
                {renderMonthDays()}
              </div>
            </div>
          ) : (
            /* WEEK VIEW */
            <div className="flex flex-col md:flex-row gap-2 rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/20">
              {renderWeekDays()}
            </div>
          )}
        </div>
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedEvent(null)}></div>
          
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 sm:p-6 max-w-md w-full relative z-10 animate-[fadeIn_0.2s_ease-out] shadow-2xl">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${eventStyles[selectedEvent.type]?.dot}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{eventStyles[selectedEvent.type]?.tag}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 leading-snug">{selectedEvent.name}</h3>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 my-4 space-y-3">
              {selectedEvent.projectTitle && (
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Project</div>
                  <div className="text-xs text-slate-350 font-bold">{selectedEvent.projectTitle}</div>
                </div>
              )}
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Date & Time</div>
                <div className="text-xs text-slate-350 font-bold">{new Date(selectedEvent.start).toLocaleString()}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-5">
              {selectedEvent.type === 'meeting' && (
                <button
                  onClick={() => {
                    // Start or join video call Jitsi
                    const room = selectedEvent.room_name || `gridlancer-project-fallback-${selectedEvent.project_id}`;
                    window.open(`https://meet.jit.si/${room}`, '_blank');
                    setSelectedEvent(null);
                  }}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-650 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer text-center rounded-xl shadow-lg shadow-indigo-500/25"
                >
                  📹 Join Video Meeting
                </button>
              )}
              {selectedEvent.project_id && (
                <button 
                  onClick={() => {
                    if (onOpenProject) onOpenProject(selectedEvent.project_id);
                    setSelectedEvent(null);
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer text-center rounded-xl"
                >
                  📁 Open Project details
                </button>
              )}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-300 font-semibold text-xs transition-all cursor-pointer text-center rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </>
  );
};

export default CalendarView;
