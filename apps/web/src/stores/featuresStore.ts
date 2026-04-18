import { create } from 'zustand';
import api from '@/config/api';

export type FeatureKey =
  | 'customers' | 'quotations' | 'activities'
  | 'shipments' | 'documents' | 'exchange_rates' | 'rates'
  | 'ai_email_draft' | 'win_probability' | 'churn_risk' | 'coaching' | 'smart_queue' | 'voice_memo' | 'ai_negotiation_coach'
  | 'whatsapp' | 'sms' | 'email_send' | 'imap_sync' | 'message_templates' | 'click_to_call'
  | 'daily_plan' | 'followup_reminders' | 'customer_contacts' | 'birthdays' | 'geo_checkin'
  | 'commission' | 'gamification' | 'sales_goals'
  | 'command_palette' | 'internal_notes' | 'customer_timeline' | 'saved_views' | 'bulk_actions' | 'pwa'
  | 'customer_portal' | 'lead_forms' | 'realtime_notifications';

interface FeaturesState {
  features: Partial<Record<FeatureKey, boolean>>;
  loading: boolean;
  loaded: boolean;
  fetch: () => Promise<void>;
  isEnabled: (key: FeatureKey) => boolean;
}

export const useFeaturesStore = create<FeaturesState>((set, get) => ({
  features: {},
  loading: false,
  loaded: false,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get<Record<FeatureKey, boolean>>('/settings/feature-flags');
      set({ features: data, loaded: true });
    } catch {
      // Fallback: tum feature'lari aktif kabul et (crash olmasin)
    } finally {
      set({ loading: false });
    }
  },

  isEnabled: (key: FeatureKey) => {
    const state = get();
    if (!state.loaded) return true; // Yuklenmeden her seyi goster (UX)
    return state.features[key] !== false;
  },
}));

/** Kullanim: const aiOn = useFeature('ai_email_draft') */
export function useFeature(key: FeatureKey): boolean {
  return useFeaturesStore((s) => s.isEnabled(key));
}
