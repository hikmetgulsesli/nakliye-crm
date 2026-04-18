import type { ReactNode } from 'react';
import { useFeature, type FeatureKey } from '@/stores/featuresStore';

interface FeatureGateProps {
  feature: FeatureKey;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Kullanim:
 *   <FeatureGate feature="ai_email_draft">
 *     <AIEmailButton />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
  const enabled = useFeature(feature);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}
