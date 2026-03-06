import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateActivityInput, ActivityType, ActivityOutcome } from '@/types/index.js';

const activitySchema = z.object({
  customer_id: z.string(),
  type: z.enum(['Telefon', 'E-posta', 'Yuz Yuze', 'Video Gorusme']),
  date: z.string(),
  duration: z.number().optional(),
  notes: z.string().min(1, 'Not girilmesi zorunludur'),
  outcome: z.enum(['Olumlu', 'Notr', 'Olumsuz', 'Teklif Istendi']),
  next_action_date: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  customerId: string;
  onSubmit: (data: CreateActivityInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const activityTypes: ActivityType[] = ['Telefon', 'E-posta', 'Yuz Yuze', 'Video Gorusme'];
const outcomes: ActivityOutcome[] = ['Olumlu', 'Notr', 'Olumsuz', 'Teklif Istendi'];

export function ActivityForm({ customerId, onSubmit, onCancel, loading }: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      customer_id: customerId,
      date: new Date().toISOString().slice(0, 16),
    },
  });

  const handleFormSubmit = (data: ActivityFormData) => {
    onSubmit({
      ...data,
      customer_id: customerId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Aktivite Tipi</Label>
          <Select
            onValueChange={(value) => setValue('type', value as ActivityType)}
            defaultValue="Telefon"
          >
            <SelectTrigger>
              <SelectValue placeholder="Tip seçin" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outcome">Sonuç</Label>
          <Select
            onValueChange={(value) => setValue('outcome', value as ActivityOutcome)}
            defaultValue="Notr"
          >
            <SelectTrigger>
              <SelectValue placeholder="Sonuç seçin" />
            </SelectTrigger>
            <SelectContent>
              {outcomes.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {outcome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Tarih ve Saat</Label>
          <Input
            id="date"
            type="datetime-local"
            {...register('date')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Süre (dakika)</Label>
          <Input
            id="duration"
            type="number"
            {...register('duration', { valueAsNumber: true })}
            placeholder="30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_action_date">Sonraki Aksiyon Tarihi</Label>
          <Input
            id="next_action_date"
            type="date"
            {...register('next_action_date')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Görüşme Notu</Label>
        <textarea
          id="notes"
          {...register('notes')}
          className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          placeholder="Görüşme detaylarını girin..."
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
