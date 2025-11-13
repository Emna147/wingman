"use client";

import ExpenseAnalytics from "@/components/analytics/ExpenseAnalytics";
import TravelBudgetTracker from "@/components/travel/TravelBudgetTracker";
import { BarChart3, Wallet } from "lucide-react";
import { useState } from "react";

export default function TravelBudgetPage() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics'>('tracker');
  const [budgetId, setBudgetId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'tracker'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-5 h-5" />
          Budget Tracker
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'analytics'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tracker' ? (
        <TravelBudgetTracker onBudgetChange={setBudgetId} />
      ) : (
        budgetId ? (
          <ExpenseAnalytics budgetId={budgetId} />
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Budget Set</h3>
            <p className="text-gray-600 dark:text-gray-400">Configure your budget in the tracker tab first</p>
          </div>
        )
      )}
    </div>
  );
}
