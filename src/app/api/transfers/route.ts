import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { transferCustomers, getTransferPreview } from '@/lib/services/transfer';
import type { TransferScope } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Only admins can perform transfers
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { message: 'Forbidden - Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'preview') {
      const { source_user_id, target_user_id, scope } = body;

      if (!source_user_id || !target_user_id) {
        return NextResponse.json(
          { error: { message: 'Kaynak ve hedef temsilci gereklidir' } },
          { status: 400 }
        );
      }

      const preview = getTransferPreview(
        source_user_id,
        target_user_id,
        scope as TransferScope
      );

      return NextResponse.json({ data: preview });
    }

    if (action === 'bulk-transfer') {
      const {
        source_user_id,
        target_user_id,
        scope,
        reason,
        deactivate_source,
      } = body;

      if (!source_user_id || !target_user_id || !reason) {
        return NextResponse.json(
          { error: { message: 'Kaynak, hedef temsilci ve sebep gereklidir' } },
          { status: 400 }
        );
      }

      const result = transferCustomers(
        source_user_id,
        target_user_id,
        scope as TransferScope,
        reason,
        session.user.id,
        deactivate_source === true
      );

      if (!result.success) {
        return NextResponse.json(
          { error: { message: result.errors?.[0] || 'Transfer işlemi başarısız' } },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: result });
    }

    if (action === 'single-transfer') {
      const {
        customer_id,
        from_user_id,
        to_user_id,
        reason,
        cascade_to_open_quotes,
      } = body;

      if (!customer_id || !from_user_id || !to_user_id || !reason) {
        return NextResponse.json(
          { error: { message: 'Müşteri, temsilciler ve sebep gereklidir' } },
          { status: 400 }
        );
      }

      const { transferSingleCustomer } = await import('@/lib/services/transfer');
      const result = transferSingleCustomer(
        customer_id,
        from_user_id,
        to_user_id,
        reason,
        session.user.id,
        cascade_to_open_quotes === true
      );

      if (!result.success) {
        return NextResponse.json(
          { error: { message: result.errors?.[0] || 'Transfer işlemi başarısız' } },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: result });
    }

    return NextResponse.json(
      { error: { message: 'Geçersiz action' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Transfer API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
