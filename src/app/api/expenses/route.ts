import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Expense from '@/lib/db/models/Expense';
import Budget from '@/lib/db/models/Budget';

// Get expenses for a budget
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

    const { searchParams } = new URL(req.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID required' },
        { status: 400 }
      );
    }

    // Verify budget belongs to user
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Get expenses for this budget, sorted by date descending
    const expenses = await Expense.find({
      userId,
      budgetId,
    }).sort({ date: -1, createdAt: -1 });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// Create a new expense
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
    const {
      amount,
      category,
      description,
      date,
      location,
      tags,
      paymentMethod,
      budgetId,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category required' },
        { status: 400 }
      );
    }

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID required' },
        { status: 400 }
      );
    }

    // Verify budget exists and belongs to user
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Create expense
    const expense = new Expense({
      userId,
      amount,
      category,
      description: description || '',
      date: date || new Date(),
      location: location || '',
      tags: tags || [],
      paymentMethod: paymentMethod || '',
      budgetId,
      synced: true,
    });

    await expense.save();

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// Update an expense
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      amount,
      category,
      description,
      date,
      location,
      tags,
      paymentMethod,
    } = body;

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount required' },
        { status: 400 }
      );
    }

    // Find expense and verify it belongs to user
    const expense = await Expense.findOne({
      _id: expenseId,
      userId,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;
    if (location !== undefined) expense.location = location;
    if (tags !== undefined) expense.tags = tags;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;

    await expense.save();

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// Delete an expense
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID required' },
        { status: 400 }
      );
    }

    // Find and delete expense (verify it belongs to user)
    const expense = await Expense.findOneAndDelete({
      _id: expenseId,
      userId,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: expenseId });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}