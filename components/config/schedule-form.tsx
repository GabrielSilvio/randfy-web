'use client';

import { useState } from 'react';
import { TenantScheduleData } from '@/lib/api';

interface ScheduleFormProps {
  initialSchedules?: TenantScheduleData[];
  onSave: (schedules: TenantScheduleData[]) => Promise<void>;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function formatTime(hhmm: number): string {
  if (hhmm === 0) return '';
  const hours = Math.floor(hhmm / 100);
  const minutes = hhmm % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

export function ScheduleForm({ initialSchedules, onSave, isLoading = false }: ScheduleFormProps) {
  // Initialize schedules with default values for all 7 days using lazy initialization
  const [schedules, setSchedules] = useState<TenantScheduleData[]>(() => {
    const defaults: TenantScheduleData[] = [
      { day_of_week: 0, start_time: 0, end_time: 0 },
      { day_of_week: 1, start_time: 900, end_time: 1800 },
      { day_of_week: 2, start_time: 900, end_time: 1800 },
      { day_of_week: 3, start_time: 900, end_time: 1800 },
      { day_of_week: 4, start_time: 900, end_time: 1800 },
      { day_of_week: 5, start_time: 900, end_time: 1800 },
      { day_of_week: 6, start_time: 0, end_time: 0 },
    ];

    if (!initialSchedules || initialSchedules.length === 0) {
      return defaults;
    }

    // Merge initial schedules with defaults
    initialSchedules.forEach((schedule) => {
      if (schedule && schedule.day_of_week >= 0 && schedule.day_of_week <= 6) {
        defaults[schedule.day_of_week] = schedule;
      }
    });

    return defaults;
  });

  const [activeDay, setActiveDay] = useState<boolean[]>(() => {
    const defaults: TenantScheduleData[] = [
      { day_of_week: 0, start_time: 0, end_time: 0 },
      { day_of_week: 1, start_time: 900, end_time: 1800 },
      { day_of_week: 2, start_time: 900, end_time: 1800 },
      { day_of_week: 3, start_time: 900, end_time: 1800 },
      { day_of_week: 4, start_time: 900, end_time: 1800 },
      { day_of_week: 5, start_time: 900, end_time: 1800 },
      { day_of_week: 6, start_time: 0, end_time: 0 },
    ];

    if (initialSchedules && initialSchedules.length > 0) {
      initialSchedules.forEach((schedule) => {
        if (schedule && schedule.day_of_week >= 0 && schedule.day_of_week <= 6) {
          defaults[schedule.day_of_week] = schedule;
        }
      });
    }

    return defaults.map((s) => s.start_time > 0 || s.end_time > 0);
  });

  const handleDayToggle = (dayIndex: number) => {
    const newActive = [...activeDay];
    newActive[dayIndex] = !newActive[dayIndex];
    setActiveDay(newActive);
  };

  const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[dayIndex] = {
      ...newSchedules[dayIndex],
      [field]: parseTime(value),
    };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schedulesToSave = schedules.filter((_, idx) => activeDay[idx]);
    await onSave(schedulesToSave);
  };

  const hasAtLeastOneActiveDay = activeDay.some((active) => active);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((dayName, index) => {
          const schedule = schedules[index] || { day_of_week: index, start_time: 0, end_time: 0 };
          return (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={activeDay[index] || false}
                  onChange={() => handleDayToggle(index)}
                  className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <span className="font-medium text-slate-900">{dayName}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 w-16">Início:</label>
                    <input
                      type="time"
                      value={formatTime(schedule.start_time)}
                      onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                      disabled={!activeDay[index]}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 w-16">Fim:</label>
                    <input
                      type="time"
                      value={formatTime(schedule.end_time)}
                      onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                      disabled={!activeDay[index]}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={!hasAtLeastOneActiveDay || isLoading}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Salvando...' : 'Salvar Horários'}
        </button>
      </div>

      {!hasAtLeastOneActiveDay && (
        <p className="text-center text-sm text-red-600">
          Ative pelo menos um dia para salvar
        </p>
      )}
    </form>
  );
}
