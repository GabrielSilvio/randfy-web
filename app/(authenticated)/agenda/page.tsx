'use client';

import { useEffect, useState } from 'react';
import { apiClient, AppointmentResponse, CurrentUserResponse, PatientResponse, AppointmentData } from '@/lib/api';
import { AppointmentModal } from '@/components/agenda/appointment-modal';

type ViewMode = 'day' | 'week' | 'month';

interface Doctor {
  id: number;
  name: string;
  initials: string;
  color: string;
  selected: boolean;
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<CurrentUserResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock doctors - replace with actual data from API
  const [doctors, setDoctors] = useState<Doctor[]>([
    { id: 1, name: 'Dr. Gabriel Oliveira', initials: 'GO', color: 'bg-blue-500', selected: true },
    { id: 2, name: 'Dra. Maria Lucia', initials: 'ML', color: 'bg-green-500', selected: true },
    { id: 3, name: 'Dr. Ricardo Faria', initials: 'RF', color: 'bg-purple-500', selected: false },
  ]);

  // Update current time every minute for the time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async (tenantId: number, startDate: Date, endDate: Date) => {
    try {
      const appointmentsResponse = await apiClient.getAppointments(tenantId, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setAppointments(appointmentsResponse.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await apiClient.getCurrentUser();
        setUserData(user);

        const tenantId = user.user?.tenant_id;
        if (!tenantId) return;

        const patientsResponse = await apiClient.getPatients(tenantId);
        setPatients(patientsResponse.data || []);

        const { startDate, endDate } = getDateRange(selectedDate, viewMode);
        await loadAppointments(tenantId, startDate, endDate);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, viewMode]);

  const getDateRange = (date: Date, mode: ViewMode) => {
    const start = new Date(date);
    const end = new Date(date);

    if (mode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (mode === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { startDate: start, endDate: end };
  };

  const handleSaveAppointment = async (data: AppointmentData) => {
    const tenantId = userData?.user?.tenant_id;
    if (!tenantId) return;

    setIsSavingAppointment(true);

    try {
      await apiClient.createAppointment(tenantId, data);
      setIsAppointmentModalOpen(false);
      
      const { startDate, endDate } = getDateRange(selectedDate, viewMode);
      await loadAppointments(tenantId, startDate, endDate);
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarDate(newDate);
  };

  const getDateRangeText = () => {
    const { startDate, endDate } = getDateRange(selectedDate, viewMode);
    
    if (viewMode === 'day') {
      return startDate.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } else if (viewMode === 'week') {
      const start = startDate.getDate();
      const end = endDate.getDate();
      const month = endDate.toLocaleDateString('pt-BR', { month: 'short' });
      const year = endDate.getFullYear();
      return `${start} - ${end} ${month} ${year}`;
    } else {
      return calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  const getWeekDays = () => {
    const { startDate } = getDateRange(selectedDate, 'week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const renderMiniCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 text-center text-xs text-slate-300"></div>);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-8 flex items-center justify-center text-xs rounded-lg transition-colors ${
            isSelected
              ? 'bg-primary text-white font-bold'
              : isToday
              ? 'bg-blue-50 text-primary font-semibold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

  const getAppointmentPosition = (dateTime: string, duration: number = 60) => {
    const date = new Date(dateTime);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    const top = ((hour - 7) * 80) + (minutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    
    return { top, height };
  };

  const isAppointmentInDay = (appointment: AppointmentResponse, day: Date) => {
    const appointmentDate = new Date(appointment.date_time);
    return appointmentDate.toDateString() === day.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800';
      case 'PENDING':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'CONFIRMADO';
      case 'PENDING':
        return 'AGUARDANDO';
      case 'CANCELLED':
        return 'CANCELADO';
      default:
        return status;
    }
  };

  const getCurrentTimePosition = () => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    if (hour < 7 || hour >= 21) return null;
    
    const top = ((hour - 7) * 80) + (minutes / 60) * 80;
    return top;
  };

  const weekDays = getWeekDays();
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
  const currentTimeTop = getCurrentTimePosition();

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Left Sidebar */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col">
        {/* New Appointment Button */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Novo Agendamento
          </button>
        </div>

        {/* Mini Calendar */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => navigateCalendar('prev')}
                className="size-7 rounded hover:bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => navigateCalendar('next')}
                className="size-7 rounded hover:bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="h-8 flex items-center justify-center text-xs font-bold text-slate-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderMiniCalendar()}
          </div>
        </div>

        {/* Doctors Filter */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-slate-600 text-[20px]">group</span>
            <h3 className="font-bold text-slate-900">Médicos</h3>
          </div>
          <div className="space-y-2">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => {
                  setDoctors(doctors.map(d => 
                    d.id === doctor.id ? { ...d, selected: !d.selected } : d
                  ));
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={`size-6 rounded-full flex items-center justify-center ${
                  doctor.selected ? doctor.color : 'bg-slate-200'
                }`}>
                  {doctor.selected && (
                    <span className="material-symbols-outlined text-white text-[14px]">check</span>
                  )}
                </div>
                <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  doctor.color.replace('bg-', 'bg-') + '/10'
                } ${doctor.color.replace('bg-', 'text-')}`}>
                  {doctor.initials}
                </div>
                <span className="text-sm font-medium text-slate-900 flex-1 text-left">
                  {doctor.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
            
            {/* View Mode Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mês
              </button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="size-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <h2 className="text-lg font-bold text-slate-900 min-w-[200px] text-center capitalize">
                {getDateRangeText()}
              </h2>
              <button
                onClick={() => navigateDate('next')}
                className="size-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <p className="text-slate-500 mt-4">Carregando agenda...</p>
              </div>
            </div>
          ) : (
            <>
              {/* DAY VIEW */}
              {viewMode === 'day' && (
                <div className="min-w-[600px]">
                  {/* Day Header */}
                  <div className="grid grid-cols-[60px_1fr] border-b border-slate-200 bg-white sticky top-0 z-10">
                    <div className="border-r border-slate-200"></div>
                    <div className="p-3 text-center border-r border-slate-200">
                      <div className="text-xs font-bold mb-1 text-primary">
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {selectedDate.getDate()}
                      </div>
                    </div>
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-[60px_1fr] relative">
                    {/* Hour Labels */}
                    <div className="border-r border-slate-200 bg-slate-50">
                      {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {/* Day Column */}
                    <div className="border-r border-slate-200 relative bg-white">
                      {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-slate-200"></div>
                      ))}

                      {/* Appointments */}
                      {appointments
                        .filter(apt => isAppointmentInDay(apt, selectedDate))
                        .map((appointment) => {
                          const { top, height } = getAppointmentPosition(
                            appointment.date_time,
                            appointment.duration_minutes || 60
                          );
                          const statusColor = getStatusColor(appointment.status);
                          const statusLabel = getStatusLabel(appointment.status);

                          return (
                            <div
                              key={appointment.id}
                              className={`absolute left-2 right-2 rounded-lg border-2 p-3 text-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${statusColor}`}
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div className="font-bold mb-1 text-xs">{statusLabel}</div>
                              <div className="font-semibold">{appointment.patient_name}</div>
                              <div className="text-xs mt-1 opacity-80">
                                {new Date(appointment.date_time).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' - '}
                                {new Date(new Date(appointment.date_time).getTime() + (appointment.duration_minutes || 60) * 60000).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              <div className="text-xs mt-1 opacity-70">{appointment.service_name}</div>
                            </div>
                          );
                        })}

                      {/* Current Time Indicator */}
                      {currentTimeTop !== null && selectedDate.toDateString() === new Date().toDateString() && (
                        <div
                          className="absolute left-0 right-0 flex items-center z-20"
                          style={{ top: `${currentTimeTop}px` }}
                        >
                          <div className="size-2 bg-red-500 rounded-full"></div>
                          <div className="flex-1 h-0.5 bg-red-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* WEEK VIEW */}
              {viewMode === 'week' && (
                <div className="min-w-[800px]">
                  {/* Week Header */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-white sticky top-0 z-10">
                    <div className="border-r border-slate-200"></div>
                    {weekDays.map((day, i) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                      
                      return (
                        <div
                          key={i}
                          className="p-3 text-center border-r border-slate-200 last:border-r-0"
                        >
                          <div className={`text-xs font-bold mb-1 ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                            {dayNames[day.getDay()]}
                          </div>
                          <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-slate-900'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                    {/* Hour Labels */}
                    <div className="border-r border-slate-200 bg-slate-50">
                      {hours.map((hour) => (
                        <div key={hour} className="h-20 border-b border-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day, dayIndex) => (
                      <div key={dayIndex} className="border-r border-slate-200 last:border-r-0 relative bg-white">
                        {hours.map((hour) => (
                          <div key={hour} className="h-20 border-b border-slate-200"></div>
                        ))}

                        {/* Appointments */}
                        {appointments
                          .filter(apt => isAppointmentInDay(apt, day))
                          .map((appointment) => {
                            const { top, height } = getAppointmentPosition(
                              appointment.date_time,
                              appointment.duration_minutes || 60
                            );
                            const statusColor = getStatusColor(appointment.status);
                            const statusLabel = getStatusLabel(appointment.status);

                            return (
                              <div
                                key={appointment.id}
                                className={`absolute left-1 right-1 rounded-lg border-2 p-2 text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${statusColor}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                <div className="font-bold mb-0.5 text-[10px]">{statusLabel}</div>
                                <div className="font-semibold">{appointment.patient_name}</div>
                                <div className="text-[10px] mt-0.5 opacity-80">
                                  {new Date(appointment.date_time).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {' - '}
                                  {new Date(new Date(appointment.date_time).getTime() + (appointment.duration_minutes || 60) * 60000).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            );
                          })}

                        {/* Current Time Indicator */}
                        {currentTimeTop !== null && day.toDateString() === new Date().toDateString() && (
                          <div
                            className="absolute left-0 right-0 flex items-center z-20"
                            style={{ top: `${currentTimeTop}px` }}
                          >
                            <div className="size-2 bg-red-500 rounded-full"></div>
                            <div className="flex-1 h-0.5 bg-red-500"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MONTH VIEW */}
              {viewMode === 'month' && (
                <div className="p-4">
                  {/* Month Grid Header */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-bold text-slate-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-7 gap-px bg-slate-200">
                    {(() => {
                      const year = selectedDate.getFullYear();
                      const month = selectedDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const daysInMonth = lastDay.getDate();
                      const startingDayOfWeek = firstDay.getDay();
                      const cells = [];

                      // Previous month days
                      const prevMonthLastDay = new Date(year, month, 0).getDate();
                      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                        const day = prevMonthLastDay - i;
                        cells.push(
                          <div key={`prev-${day}`} className="bg-slate-50 min-h-[120px] p-2">
                            <div className="text-sm text-slate-400 font-medium mb-1">{day}</div>
                          </div>
                        );
                      }

                      // Current month days
                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month, day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayAppointments = appointments.filter(apt => isAppointmentInDay(apt, date));

                        cells.push(
                          <div
                            key={day}
                            className="bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedDate(date);
                              setViewMode('day');
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-primary text-white size-7 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 3).map((appointment) => {
                                const statusColor = getStatusColor(appointment.status);
                                return (
                                  <div
                                    key={appointment.id}
                                    className={`text-xs p-1 rounded border ${statusColor} truncate`}
                                  >
                                    <div className="font-semibold truncate">
                                      {new Date(appointment.date_time).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })} {appointment.patient_name}
                                    </div>
                                  </div>
                                );
                              })}
                              {dayAppointments.length > 3 && (
                                <div className="text-xs text-slate-500 font-medium">
                                  +{dayAppointments.length - 3} mais
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Next month days
                      const remainingCells = 42 - cells.length; // 6 weeks * 7 days
                      for (let day = 1; day <= remainingCells; day++) {
                        cells.push(
                          <div key={`next-${day}`} className="bg-slate-50 min-h-[120px] p-2">
                            <div className="text-sm text-slate-400 font-medium mb-1">{day}</div>
                          </div>
                        );
                      }

                      return cells;
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">event</span>
              <div>
                <span className="text-xs text-slate-500 uppercase">Total</span>
                <p className="text-lg font-bold text-slate-900">{appointments.length} Agendamentos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
              <div>
                <span className="text-xs text-slate-500 uppercase">Confirmados</span>
                <p className="text-lg font-bold text-slate-900">{confirmedCount} Pacientes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-600 text-[20px]">pending</span>
              <div>
                <span className="text-xs text-slate-500 uppercase">Aguardando</span>
                <p className="text-lg font-bold text-slate-900">{pendingCount} Pacientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        isLoading={isSavingAppointment}
        patients={patients}
      />
    </div>
  );
}
