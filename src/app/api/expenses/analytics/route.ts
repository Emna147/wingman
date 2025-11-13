import Budget from '@/lib/db/models/Budget';
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

    const budgetId = req.nextUrl.searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Get budget
    const budget = await Budget.findById(budgetId).lean();
    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Get all expenses for this budget
    const expenses = await Expense.find({ budgetId }).lean();

    interface ExpenseData {
      category: 'Accommodation' | 'Food' | 'Transport' | 'Social' | 'Miscellaneous';
      amount: number;
      date: Date;
    }

    // Category breakdown
    const categoryBreakdown = {
      Accommodation: 0,
      Food: 0,
      Transport: 0,
      Social: 0,
      Miscellaneous: 0,
    };

    expenses.forEach((expense) => {
      const exp = expense as unknown as ExpenseData;
      categoryBreakdown[exp.category] += exp.amount;
    });

    // Spending trends (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = expenses.filter(
      (e) => {
        const exp = e as unknown as ExpenseData;
        return new Date(exp.date) >= thirtyDaysAgo;
      }
    );

    const dailySpending: Record<string, number> = {};
    recentExpenses.forEach((expense) => {
      const exp = expense as unknown as ExpenseData;
      const dateKey = new Date(exp.date).toISOString().split('T')[0];
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + exp.amount;
    });

    // Budget vs Actual
    interface BudgetData {
      totalMonthly: number;
      categories: Array<{
        name: 'Accommodation' | 'Food' | 'Transport' | 'Social' | 'Miscellaneous';
        amount: number;
        percentage: number;
      }>;
    }

    const budgetData = budget as unknown as BudgetData;

    const budgetVsActual = budgetData.categories.map((cat) => ({
      category: cat.name,
      budgeted: cat.amount,
      actual: categoryBreakdown[cat.name],
      percentage: cat.percentage,
    }));

    // Calculate total spent
    const totalSpent = Object.values(categoryBreakdown).reduce(
      (sum, val) => sum + val,
      0
    );

    // Predictive analytics
    const daysInMonth = 30;
    const daysElapsed = new Date().getDate();
    const averageDailySpend = totalSpent / daysElapsed;
    const projectedMonthlySpend = averageDailySpend * daysInMonth;
    const budgetRemaining = budgetData.totalMonthly - totalSpent;
    const daysRemaining = daysInMonth - daysElapsed;
    const recommendedDailySpend = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

    const insights = {
      totalSpent,
      totalBudget: budgetData.totalMonthly,
      budgetRemaining,
      spentPercentage: ((totalSpent / budgetData.totalMonthly) * 100).toFixed(1),
      projectedMonthlySpend: Math.round(projectedMonthlySpend),
      isOverBudgetPace: projectedMonthlySpend > budgetData.totalMonthly,
      averageDailySpend: Math.round(averageDailySpend),
      recommendedDailySpend: Math.round(recommendedDailySpend),
      daysElapsed,
      daysRemaining,
    };

    return NextResponse.json({
      categoryBreakdown,
      dailySpending,
      budgetVsActual,
      insights,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
