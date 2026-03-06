'use client';

import * as React from 'react';
import { Phone, Mail, Users, Video, Clock, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OutcomeBadge, ActivityTypeBadge } from '@/components/ui/badges';
import type { ActivityWithUser } from '@/types/index';

interface ActivityTimelineProps {
  activities: ActivityWithUser[];
  onAddActivity: () => void;
  loading?: boolean;
}

const activityIcons = {
  Telefon: Phone,
  'E-posta': Mail,
  'Yuz Yuze': Users,
  'Video Gorusme': Video,
};

export function ActivityTimeline({ activities, onAddActivity, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">Aktivite bulunamadı</h3>
        <p className="mt-2 text-sm text-slate-600">
          Bu müşteri için henüz aktivite kaydı bulunmuyor.
        </p>
        <Button onClick={onAddActivity} className="mt-4">
          Aktivite Ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Aktivite Geçmişi</h3>
        <Button onClick={onAddActivity} size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Aktivite Ekle
        </Button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activityIcons[activity.type];
            const date = new Date(activity.date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isUpcoming = date > new Date();

            return (
              <div key={activity.id} className="relative flex gap-4 pl-2">
                {/* Timeline dot */}
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100">
                    <IconComponent className="h-3 w-3 text-slate-600" />
                  </div>
                </div>

                {/* Activity card */}
                <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ActivityTypeBadge type={activity.type} />
                      <OutcomeBadge outcome={activity.outcome} />
                      {isToday && (
                        <span className="text-xs font-medium text-green-600">Bugün</span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs font-medium text-blue-600">Yaklaşan</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {date.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {' · '}
                      {date.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {activity.notes}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{activity.duration ? `${activity.duration} dk` : 'Süre belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{activity.created_by_user.full_name}</span>
                    </div>
                    {activity.next_action_date && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Sonraki aksiyon:{' '}
                          {new Date(activity.next_action_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}