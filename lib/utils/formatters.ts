export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} dakika önce`;
    }
    return `${diffHours} saat önce`;
  }
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return formatDate(dateString);
}

export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CALL: "Telefon Görüşmesi",
    EMAIL: "E-posta",
    MEETING: "Yüz Yüze Görüşme",
    NOTE: "Not",
    QUOTE_CREATED: "Teklif Oluşturuldu",
    QUOTE_SENT: "Teklif Gönderildi",
    QUOTE_ACCEPTED: "Teklif Kabul Edildi",
    QUOTE_REJECTED: "Teklif Reddedildi",
    STATUS_CHANGE: "Durum Değişikliği",
    DOCUMENT_ADDED: "Doküman Eklendi",
    FOLLOW_UP: "Takip",
  };
  return labels[type] || type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-800",
    SENT: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    EXPIRED: "bg-amber-100 text-amber-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PROSPECT: "bg-blue-100 text-blue-800",
    BLACKLISTED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-slate-100 text-slate-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Taslak",
    SENT: "Gönderildi",
    ACCEPTED: "Kabul Edildi",
    REJECTED: "Reddedildi",
    EXPIRED: "Süresi Doldu",
    CANCELLED: "İptal Edildi",
    ACTIVE: "Aktif",
    INACTIVE: "Pasif",
    PROSPECT: "Potansiyel",
    BLACKLISTED: "Kara Liste",
  };
  return labels[status] || status;
}

export function getTransportModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    AIR: "Hava",
    SEA: "Deniz",
    ROAD: "Kara",
    RAIL: "Demiryolu",
    MULTIMODAL: "Multimodal",
  };
  return labels[mode] || mode;
}
