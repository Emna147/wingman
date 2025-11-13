import Expense from '@/lib/db/models/Expense';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const budgetId = req.nextUrl.searchParams.get('budgetId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    const query: Record<string, unknown> = { userId };

    if (budgetId) {
      query.budgetId = budgetId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (query.date as Record<string, Date>).$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 }).lean();

    // Generate CSV
    const csvHeaders = [
      'Date',
      'Category',
      'Amount',
      'Description',
      'Location',
      'Payment Method',
      'Tags',
    ];

    interface ExpenseData {
      date: Date;
      category: string;
      amount: number;
      description?: string;
      location?: string;
      paymentMethod?: string;
      tags?: string[];
    }

    const csvRows = expenses.map((exp) => {
      const expense = exp as unknown as ExpenseData;
      return [
        new Date(expense.date).toISOString().split('T')[0],
        expense.category,
        expense.amount,
        (expense.description || '').replace(/,/g, ';'), // Escape commas
        (expense.location || '').replace(/,/g, ';'),
        expense.paymentMethod || '',
        (expense.tags || []).join('|'),
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting expenses:', error);
    return NextResponse.json(
      { error: 'Failed to export expenses' },
      { status: 500 }
    );
  }
}
