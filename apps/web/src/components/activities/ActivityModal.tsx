import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Input, DatePicker, Textarea, Button, Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const activitySchema = z.object({
  customerId: z.number().min(1),
  activityType: z.string().min(1, 'Aktivite tipi secin'),
  activityDate: z.string().min(1, 'Tarih zorunludur'),
  activityTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  nextActionDate: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: number;
    activityType: string;
    activityDate: string;
    durationMinutes?: number;
    notes?: string;
    outcome?: string;
    nextActionDate?: string;
  }) => void;
  customerId: number;
  customerName: string;
  loading?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_TYPES = [
  { value: 'telefon', label: 'Telefon', icon: 'phone' },
  { value: 'eposta', label: 'E-posta', icon: 'email' },
  { value: 'yuz_yuze', label: 'Yuz Yuze', icon: 'groups' },
  { value: 'video', label: 'Video', icon: 'videocam' },
];

const OUTCOME_OPTIONS = [
  { value: 'olumlu', label: 'Olumlu' },
  { value: 'notr', label: 'Notr' },
  { value: 'olumsuz', label: 'Olumsuz' },
  { value: 'teklif_istendi', label: 'Teklif Istendi' },
];

const OUTCOME_COLORS: Record<string, string> = {
  olumlu: 'bg-emerald-500',
  notr: 'bg-slate-400',
  olumsuz: 'bg-red-500',
  teklif_istendi: 'bg-blue-500',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ActivityModal({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  customerName,
  loading = false,
}: ActivityModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      customerId,
      activityType: '',
      activityDate: new Date().toISOString().split('T')[0],
      activityTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: undefined,
      notes: '',
      outcome: '',
      nextActionDate: '',
    },
  });

  function handleFormSubmit(data: ActivityFormData) {
    // Combine date + time
    let activityDate = data.activityDate;
    if (data.activityTime) {
      activityDate = `${data.activityDate}T${data.activityTime}:00`;
    }

    onSubmit({
      customerId: data.customerId,
      activityType: data.activityType,
      activityDate,
      durationMinutes: data.durationMinutes,
      notes: data.notes,
      outcome: data.outcome,
      nextActionDate: data.nextActionDate || undefined,
    });

    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Aktivite Ekle"
      className="max-w-xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Iptal
          </Button>
          <Button
            type="button"
            icon="save"
            loading={loading}
            onClick={handleSubmit(handleFormSubmit)}
          >
            Kaydet
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Bagli Musteri (readonly) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Bagli Musteri
          </label>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
              {customerName.charAt(0)}
            </div>
            <span className="font-medium text-slate-700 text-sm">{customerName}</span>
            <Icon name="lock" size="sm" className="text-slate-400 ml-auto" />
          </div>
        </div>

        {/* Aktivite Tipi - Icon buttons */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Aktivite Tipi
          </label>
          <Controller
            name="activityType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all text-xs font-medium',
                      field.value === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                    )}
                  >
                    <Icon name={type.icon} size="sm" />
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.activityType && (
            <p className="mt-1.5 text-sm text-red-500">{errors.activityType.message}</p>
          )}
        </div>

        {/* Date + Time side by side */}
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Tarih"
            error={errors.activityDate?.message}
            {...register('activityDate')}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Saat
            </label>
            <input
              type="time"
              className="w-full h-12 bg-white border border-slate-200 rounded-xl text-slate-900 px-4 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              {...register('activityTime')}
            />
          </div>
        </div>

        {/* Sure (dakika) */}
        <Controller
          name="durationMinutes"
          control={control}
          render={({ field }) => (
            <Input
              label="Sure (dakika)"
              type="number"
              placeholder="Orn: 30"
              icon="timer"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
        />

        {/* Gorusme Notu */}
        <Textarea
          label="Gorusme Notu"
          placeholder="Gorusme ile ilgili notlarinizi yazin..."
          rows={4}
          {...register('notes')}
        />

        {/* Sonuc */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Sonuc
          </label>
          <Controller
            name="outcome"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {OUTCOME_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all',
                      field.value === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={option.value}
                      checked={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'size-3 rounded-full flex-shrink-0',
                        OUTCOME_COLORS[option.value] || 'bg-slate-400',
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        field.value === option.value ? 'text-primary' : 'text-slate-600',
                      )}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>

        {/* Sonraki Aksiyon Tarihi */}
        <DatePicker
          label="Sonraki Aksiyon Tarihi"
          {...register('nextActionDate')}
        />
      </div>
    </Modal>
  );
}
