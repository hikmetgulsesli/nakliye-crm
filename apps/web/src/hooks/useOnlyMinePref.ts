import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * "Sadece benim kayıtlarım" liste filtresi tercihi.
 *
 * Kural:
 *   - USER varsayılan: ON  (kendi işine odakli kalsin)
 *   - ADMIN varsayılan: OFF (yönetici tüm ekibi görür, isterse kendi takip
 *     ettigi musterilere daraltabilir)
 *   - Iki rol icin de checkbox gorunur, tercih localStorage'da scope basina
 *     saklanir.
 *
 * Kullanim:
 *   const { onlyMine, setOnlyMine, currentUserId, isUser } =
 *     useOnlyMinePref('customers');
 *
 *   // fetch sirasinda:
 *   if (onlyMine && currentUserId) filters.assignedUserId = currentUserId;
 *
 *   // UI:
 *   <CustomerFilters
 *     showOnlyMine
 *     onlyMine={onlyMine}
 *     onOnlyMineChange={setOnlyMine}
 *     hideAssignedUserSelect={onlyMine}
 *   />
 */
export function useOnlyMinePref(scope: 'customers' | 'quotations' | 'shipments') {
  const user = useAuthStore((s) => s.user);
  const isUser = user?.role === 'USER';
  const isAdmin = user?.role === 'ADMIN';
  const currentUserId = user?.id ? Number(user.id) : undefined;
  const storageKey = `crm.filters.${scope}.onlyMine`;

  function readStored(): boolean {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === null) {
        // ilk kez - role gore default
        return isUser;
      }
      return stored === '1';
    } catch {
      return isUser;
    }
  }

  const [onlyMine, setOnlyMineState] = useState<boolean>(readStored);

  function setOnlyMine(next: boolean) {
    setOnlyMineState(next);
    try {
      localStorage.setItem(storageKey, next ? '1' : '0');
    } catch {
      // sessizce yut — incognito quota vb.
    }
  }

  // Kullanıcı degisirse (logout/login farkli user) tercih sıfırlansın
  useEffect(() => {
    setOnlyMineState(readStored());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, storageKey]);

  return { isUser, isAdmin, currentUserId, onlyMine, setOnlyMine };
}
