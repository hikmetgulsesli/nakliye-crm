import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createActivity, getActivitiesByCustomer, updateActivity, deleteActivity, updateCustomerLastContactDate, getActivityById } from '@/lib/db/activities';
import { createAuditLog, buildChangesObject } from '@/lib/db/audit-log';
import { getSession } from '@/lib/auth/session';
import { getCustomerById } from '@/lib/db/customers';

const createActivitySchema = z.object({
  customer_id: z.string().min(1, 'Müşteri seçimi zorunludur'),
  type: z.enum(['Telefon', 'E-posta', 'Yuz Yuze', 'Video Gorusme'] as const),
  date: z.string().min(1, 'Tarih zorunludur'),
  duration: z.number().nullable().optional(),
  notes: z.string().min(1, 'Not alanı zorunludur'),
  outcome: z.enum(['Olumlu', 'Notr', 'Olumsuz', 'Teklif Istendi'] as const),
  next_action_date: z.string().nullable().optional(),
});

const updateActivitySchema = createActivitySchema.partial().omit({ customer_id: true });

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Oturum gerekli' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'customer_id parametresi gerekli' } }, { status: 400 });
    }

    // Check permission: user must be assigned to customer or be admin
    const customer = getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Müşteri bulunamadı' } }, { status: 404 });
    }
    if (session.user.role !== 'admin' && customer.assigned_user_id !== session.user.id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Bu müşterinin aktivitelerini görme yetkiniz yok' } }, { status: 403 });
    }

    const activities = getActivitiesByCustomer(customerId);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/activities error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Aktiviteler yüklenirken bir hata oluştu' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Oturum gerekli' } }, { status: 401 });
    }

    const body = await request.json();
    const validation = createActivitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validasyon hatası',
            details: validation.error.issues.map((e: z.ZodIssue) => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    // Convert null duration to undefined for the database
    const data = {
      ...validation.data,
      duration: validation.data.duration === null ? undefined : validation.data.duration,
      next_action_date: validation.data.next_action_date === null ? undefined : validation.data.next_action_date,
    };

    // Check permission: user must be assigned to customer or be admin
    const customer = getCustomerById(data.customer_id);
    if (!customer) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Müşteri bulunamadı' } }, { status: 404 });
    }
    if (session.user.role !== 'admin' && customer.assigned_user_id !== session.user.id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Bu müşteri için aktivite oluşturma yetkiniz yok' } }, { status: 403 });
    }

    const activity = createActivity(data, session.user.id);
    
    // Update customer's last contact date
    updateCustomerLastContactDate(data.customer_id);

    // Create audit log
    createAuditLog({
      user_id: session.user.id,
      record_type: 'activity',
      record_id: activity.id,
      action: 'create',
      metadata: { customer_id: data.customer_id },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('POST /api/activities error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Aktivite oluşturulurken bir hata oluştu' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Oturum gerekli' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'id parametresi gerekli' } }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateActivitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validasyon hatası',
            details: validation.error.issues.map((e: z.ZodIssue) => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    // Convert null values to undefined
    const data = {
      ...validation.data,
      duration: validation.data.duration === null ? undefined : validation.data.duration,
      next_action_date: validation.data.next_action_date === null ? undefined : validation.data.next_action_date,
    };

    // Get old activity for audit log
    const oldActivity = getActivityById(id);
    if (!oldActivity) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Aktivite bulunamadı' } }, { status: 404 });
    }

    // Check permission: user must be creator of activity or be admin
    if (session.user.role !== 'admin' && oldActivity.created_by !== session.user.id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Bu aktiviteyi güncelleme yetkiniz yok' } }, { status: 403 });
    }

    const activity = updateActivity(id, data);
    if (!activity) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Aktivite bulunamadı' } }, { status: 404 });
    }

    // Create audit log with changes
    const changes = buildChangesObject(
      oldActivity as Record<string, unknown>,
      data as Record<string, unknown>
    );
    if (Object.keys(changes).length > 0) {
      createAuditLog({
        user_id: session.user.id,
        record_type: 'activity',
        record_id: id,
        action: 'update',
        changes,
      });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('PUT /api/activities error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Aktivite güncellenirken bir hata oluştu' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Oturum gerekli' } }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Bu işlem için admin yetkisi gerekli' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'id parametresi gerekli' } }, { status: 400 });
    }

    // Get activity before deletion for audit log
    const activity = getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Aktivite bulunamadı' } }, { status: 404 });
    }

    const success = deleteActivity(id);
    if (!success) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Aktivite bulunamadı' } }, { status: 404 });
    }

    // Create audit log
    createAuditLog({
      user_id: session.user.id,
      record_type: 'activity',
      record_id: id,
      action: 'delete',
      metadata: { deleted_activity: activity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/activities error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Aktivite silinirken bir hata oluştu' } },
      { status: 500 }
    );
  }
}
