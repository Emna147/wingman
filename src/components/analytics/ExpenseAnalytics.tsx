"use client";

import { AlertCircle, DollarSign, Download, TrendingDown, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Analytics {
  categoryBreakdown: Record<string, number>;
  dailySpending: Record<string, number>;
  budgetVsActual: Array<{
    category: string;
    budgeted: number;
    actual: number;
    percentage: number;
  }>;
  insights: {
    totalSpent: number;
    totalBudget: number;
    budgetRemaining: number;
    spentPercentage: string;
    projectedMonthlySpend: number;
    isOverBudgetPace: boolean;
    averageDailySpend: number;
    recommendedDailySpend: number;
    daysElapsed: number;
    daysRemaining: number;
  };
}

interface ExpenseAnalyticsProps {
  budgetId: string;
}

export default function ExpenseAnalytics({ budgetId }: ExpenseAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (budgetId) {
      fetchAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses/analytics?budgetId=${budgetId}`, {
        headers: { 'x-user-id': 'user-default-123' },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/expenses/export?budgetId=${budgetId}`, {
        headers: { 'x-user-id': 'user-default-123' },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data available</h3>
        <p className="text-gray-600 dark:text-gray-400">Start logging expenses to see analytics</p>
      </div>
    );
  }

  const { categoryBreakdown, dailySpending, budgetVsActual, insights } = analytics;

  // Prepare category pie chart data
  const categoryChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    labels: Object.keys(categoryBreakdown),
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom',
      labels: {
        colors: '#9CA3AF',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    theme: {
      mode: 'dark',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
  };

  const categoryChartSeries = Object.values(categoryBreakdown);

  // Prepare spending trend line chart
  const trendDates = Object.keys(dailySpending).sort();
  const trendAmounts = trendDates.map((date) => dailySpending[date]);

  const trendChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.3,
        opacityFrom: 0.7,
        opacityTo: 0.1,
      },
    },
    colors: ['#4F46E5'],
    xaxis: {
      categories: trendDates.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      labels: {
        style: {
          colors: '#9CA3AF',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
        },
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    grid: {
      borderColor: '#374151',
    },
    theme: {
      mode: 'dark',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
  };

  const trendChartSeries = [
    {
      name: 'Daily Spending',
      data: trendAmounts,
    },
  ];

  // Prepare budget vs actual bar chart
  const budgetVsActualOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#4F46E5', '#10B981'],
    xaxis: {
      categories: budgetVsActual.map((item) => item.category),
      labels: {
        style: {
          colors: '#9CA3AF',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
        },
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#9CA3AF',
      },
    },
    grid: {
      borderColor: '#374151',
    },
    theme: {
      mode: 'dark',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
  };

  const budgetVsActualSeries = [
    {
      name: 'Budgeted',
      data: budgetVsActual.map((item) => item.budgeted),
    },
    {
      name: 'Actual',
      data: budgetVsActual.map((item) => item.actual),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Analytics</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
            <DollarSign className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${insights.totalSpent.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            of ${insights.totalBudget} budget
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Budget Status</span>
            {insights.isOverBudgetPace ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${insights.isOverBudgetPace ? 'text-red-500' : 'text-green-500'}`}>
            {insights.spentPercentage}%
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {insights.isOverBudgetPace ? 'Over pace' : 'On track'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Projected Spend</span>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${insights.projectedMonthlySpend}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            If current pace continues
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Recommended Daily</span>
            <DollarSign className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${insights.recommendedDailySpend}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            For next {insights.daysRemaining} days
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h3>
          {categoryChartSeries.some(val => val > 0) ? (
            <Chart
              options={categoryChartOptions}
              series={categoryChartSeries}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No expenses logged yet
            </div>
          )}
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Budget vs Actual
          </h3>
          <Chart
            options={budgetVsActualOptions}
            series={budgetVsActualSeries}
            type="bar"
            height={300}
          />
        </div>

        {/* Spending Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending Trend (Last 30 Days)
          </h3>
          {trendAmounts.length > 0 ? (
            <Chart
              options={trendChartOptions}
              series={trendChartSeries}
              type="area"
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No recent spending data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
