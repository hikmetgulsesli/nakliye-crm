import api from '@/config/api';

export type OwnerType = 'customer' | 'quotation' | 'shipment';
export type DocumentCategory = 'bl' | 'invoice' | 'cmr' | 'contract' | 'proforma' | 'other';

export interface DocumentRec {
  id: number;
  ownerType: OwnerType;
  ownerId: number;
  category: DocumentCategory;
  filename: string;
  storageKey: string;
  contentType?: string | null;
  sizeBytes: number;
  version: number;
  uploadedById: number;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  bl: 'Konşimento (BL)',
  invoice: 'Fatura',
  cmr: 'CMR',
  contract: 'Sözleşme',
  proforma: 'Proforma',
  other: 'Diğer',
};

export const documentService = {
  async list(ownerType: OwnerType, ownerId: number): Promise<DocumentRec[]> {
    const { data } = await api.get<DocumentRec[]>('/documents', {
      params: { ownerType, ownerId },
    });
    return data;
  },

  async upload(
    ownerType: OwnerType,
    ownerId: number,
    file: File,
    category: DocumentCategory,
  ): Promise<DocumentRec> {
    // Adim 1: presigned URL al
    const { data: presign } = await api.post<{ key: string; uploadUrl: string; method: 'PUT' }>(
      '/documents/request-upload',
      {
        ownerType,
        ownerId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        category,
      },
    );

    // Adim 2: dogrudan R2/S3'e yukle
    const res = await fetch(presign.uploadUrl, {
      method: presign.method,
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!res.ok) {
      throw new Error(`Dosya yükleme başarısız (${res.status})`);
    }

    // Adim 3: metadata'yi DB'ye kaydet
    const { data: doc } = await api.post<DocumentRec>('/documents/confirm-upload', {
      ownerType,
      ownerId,
      category,
      filename: file.name,
      storageKey: presign.key,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });
    return doc;
  },

  async downloadUrl(id: number): Promise<{ url: string; filename: string }> {
    const { data } = await api.get<{ url: string; filename: string }>(
      `/documents/${id}/download-url`,
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
