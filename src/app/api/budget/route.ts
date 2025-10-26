import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Budget from '@/lib/db/models/Budget';

// Get current month budget
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get current month's budget
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const budget = await Budget.findOne({
      userId,
      month: { $gte: monthStart },
      active: true,
    }).sort({ createdAt: -1 });

    if (!budget) {
      return NextResponse.json(null);
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

// Create or update budget
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currency, totalMonthly, template, categories } = body;

    if (!currency || !totalMonthly || !template || !categories) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Deactivate old budgets for this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await Budget.updateMany(
      {
        userId,
        month: { $gte: monthStart },
      },
      { active: false }
    );

    // Create new budget
    const budget = new Budget({
      userId,
      currency,
      totalMonthly,
      template,
      categories,
      month: monthStart,
      active: true,
    });

    await budget.save();

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}