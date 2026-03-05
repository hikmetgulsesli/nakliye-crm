'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, Users, Video, Calendar, Clock, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityType, ActivityOutcome, CreateActivityInput } from '@/types/index.js';

const activityTypes: { value: ActivityType; label: string; icon: typeof Phone }[] = [
  { value: 'Telefon', label: 'Telefon', icon: Phone },
  { value: 'E-posta', label: 'E-posta', icon: Mail },
  { value: 'Yuz Yuze', label: 'Yüz Yüze', icon: Users },
  { value: 'Video Gorusme', label: 'Video Görüşme', icon: Video },
];

const outcomes: { value: ActivityOutcome; label: string; color: string }[] = [
  { value: 'Olumlu', label: 'Olumlu', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'Notr', label: 'Nötr', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'Olumsuz', label: 'Olumsuz', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'Teklif Istendi', label: 'Teklif İstendi', color: 'bg-blue-100 text-blue-800 border-blue-300' },
];

const activitySchema = z.object({
  type: z.enum(['Telefon', 'E-posta', 'Yuz Yuze', 'Video Gorusme']),
  date: z.string().min(1, 'Tarih zorunludur'),
  duration: z.number().min(0).nullable().optional(),
  notes: z.string().min(1, 'Not alanı zorunludur'),
  outcome: z.enum(['Olumlu', 'Notr', 'Olumsuz', 'Teklif Istendi']),
  next_action_date: z.string().nullable().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  customerId: string;
  onSubmit: (data: CreateActivityInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ActivityForm({ customerId, onSubmit, onCancel, loading }: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'Telefon',
      date: new Date().toISOString().slice(0, 16),
      outcome: 'Notr',
      duration: null,
      notes: '',
      next_action_date: null,
    },
  });

  const selectedType = watch('type');
  const selectedOutcome = watch('outcome');

  const handleFormSubmit = (data: ActivityFormData) => {
    onSubmit({
      customer_id: customerId,
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Activity Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Aktivite Tipi
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {activityTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('type', value)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                selectedType === value
                  ? 'border-slate-900 bg-slate-50 text-slate-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" {...register('type')} />
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Date and Duration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-700">
            <Calendar className="mr-1 inline h-4 w-4" />
            Tarih ve Saat
          </label>
          <input
            type="datetime-local"
            id="date"
            {...register('date')}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="mb-2 block text-sm font-medium text-slate-700">
            <Clock className="mr-1 inline h-4 w-4" />
            Süre (dakika)
          </label>
          <input
            type="number"
            id="duration"
            min="0"
            {...register('duration', { valueAsNumber: true })}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            placeholder="Opsiyonel"
          />
        </div>
      </div>

      {/* Outcome */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Görüşme Sonucu
        </label>
        <div className="flex flex-wrap gap-2">
          {outcomes.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('outcome', value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                selectedOutcome === value
                  ? color + ' ring-2 ring-offset-2'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('outcome')} />
        {errors.outcome && (
          <p className="mt-1 text-sm text-red-600">{errors.outcome.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
          <FileText className="mr-1 inline h-4 w-4" />
          Görüşme Notu
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('notes')}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          placeholder="Görüşme detaylarını buraya yazın..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Next Action Date */}
      <div>
        <label htmlFor="next_action_date" className="mb-2 block text-sm font-medium text-slate-700">
          <ArrowRight className="mr-1 inline h-4 w-4" />
          Sonraki Aksiyon Tarihi (Opsiyonel)
        </label>
        <input
          type="date"
          id="next_action_date"
          {...register('next_action_date')}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}