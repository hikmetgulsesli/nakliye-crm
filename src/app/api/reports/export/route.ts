import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/utils';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { format, data, filename } = body;

    if (!format || !data) {
      return NextResponse.json(
        { error: 'format and data are required' },
        { status: 400 }
      );
    }

    if (format === 'excel') {
      // Generate simple CSV for now (Excel format without external lib)
      const csv = generateCSV(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename || 'report'}.csv"`,
        },
      });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename || 'report'}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function generateCSV(data: {
  title: string;
  headers: string[];
  rows: Record<string, string | number | null>[];
}): string {
  const lines: string[] = [];
  
  // Title
  lines.push(`# ${data.title}`);
  lines.push(`# Generated: ${new Date().toLocaleString('tr-TR')}`);
  lines.push('');
  
  // Headers
  lines.push(data.headers.join(','));
  
  // Rows
  for (const row of data.rows) {
    const values = data.headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      // Escape values containing commas or quotes
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}
