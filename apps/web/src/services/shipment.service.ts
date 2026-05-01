import api from '@/config/api';

export interface Shipment {
  id: number;
  shipmentNo: string;
  quotationId?: number | null;
  customerId: number;
  customer?: { id: number; companyName: string; phone?: string; email?: string };
  blNumber?: string | null;
  awbNumber?: string | null;
  transportMode?: string | null;
  serviceType?: string | null;
  originCountry?: string | null;
  pol?: string | null;
  destinationCountry?: string | null;
  pod?: string | null;
  etd?: string | null;
  eta?: string | null;
  atd?: string | null;
  ata?: string | null;
  status: string;
  customsStatus?: string | null;
  notes?: string | null;
  assignedUserId: number;
  containers?: Container[];
  events?: ShipmentEvent[];
  allowedNextStatuses?: string[];
  _count?: { containers: number; events: number };
  createdAt: string;
  updatedAt: string;
}

export interface Container {
  id: number;
  shipmentId: number;
  containerNo: string;
  sealNo?: string | null;
  type?: string | null;
  weightKg?: number | null;
}

export interface ShipmentEvent {
  id: number;
  shipmentId: number;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  location?: string | null;
  occurredAt: string;
  createdById: number;
}

export interface ShipmentFilters {
  status?: string;
  customerId?: number;
  assignedUserId?: number;
  quotationId?: number;
  search?: string;
}

export const shipmentService = {
  async list(page = 1, pageSize = 20, filters?: ShipmentFilters) {
    const params: Record<string, unknown> = { page, pageSize, ...filters };
    const { data } = await api.get('/shipments', { params });
    return data as {
      success: true;
      data: Shipment[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },

  async getById(id: number): Promise<Shipment> {
    const { data } = await api.get<Shipment>(`/shipments/${id}`);
    return data;
  },

  async create(payload: Partial<Shipment>): Promise<Shipment> {
    const { data } = await api.post<Shipment>('/shipments', payload);
    return data;
  },

  async update(id: number, payload: Partial<Shipment>): Promise<Shipment> {
    const { data } = await api.patch<Shipment>(`/shipments/${id}`, payload);
    return data;
  },

  async changeStatus(
    id: number,
    toStatus: string,
    note?: string,
    location?: string,
  ): Promise<Shipment> {
    const { data } = await api.post<Shipment>(`/shipments/${id}/status`, {
      toStatus,
      note,
      location,
    });
    return data;
  },

  async addContainer(
    id: number,
    payload: { containerNo: string; sealNo?: string; type?: string; weightKg?: number },
  ): Promise<Container> {
    const { data } = await api.post<Container>(`/shipments/${id}/containers`, payload);
    return data;
  },

  async removeContainer(shipmentId: number, containerId: number): Promise<void> {
    await api.delete(`/shipments/${shipmentId}/containers/${containerId}`);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/shipments/${id}`);
  },
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  booked: 'Rezerve',
  loading: 'Yükleme',
  in_transit: 'Transit',
  at_destination: 'Varışta',
  customs_cleared: 'Gümrük OK',
  delivered: 'Teslim',
  cancelled: 'İptal',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  loading: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  in_transit: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  at_destination: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  customs_cleared: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
