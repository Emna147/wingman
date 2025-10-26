"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, DollarSign, TrendingUp, Calendar, X, AlertCircle, Check, Sun, Moon, Loader, Camera, Trash2 } from 'lucide-react';

type BudgetTemplate = 'Backpacker' | 'Digital Nomad' | 'Comfortable' | 'Custom';
type ExpenseCategory = 'Accommodation' | 'Food' | 'Transport' | 'Social' | 'Miscellaneous';
type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Digital Wallet';

interface BudgetCategory {
  name: ExpenseCategory;
  percentage: number;
  amount: number;
}

interface Expense {
  _id?: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  location?: string;
  tags?: string[];
  paymentMethod?: PaymentMethod;
  synced: boolean;
}

interface Budget {
  _id?: string;
  currency: string;
  totalMonthly: number;
  template: BudgetTemplate;
  categories: BudgetCategory[];
}

const budgetTemplates: Record<BudgetTemplate, Omit<BudgetCategory, 'amount'>[]> = {
  'Backpacker': [
    { name: 'Accommodation', percentage: 25 },
    { name: 'Food', percentage: 30 },
    { name: 'Transport', percentage: 20 },
    { name: 'Social', percentage: 15 },
    { name: 'Miscellaneous', percentage: 10 },
  ],
  'Digital Nomad': [
    { name: 'Accommodation', percentage: 30 },
    { name: 'Food', percentage: 25 },
    { name: 'Transport', percentage: 15 },
    { name: 'Social', percentage: 20 },
    { name: 'Miscellaneous', percentage: 10 },
  ],
  'Comfortable': [
    { name: 'Accommodation', percentage: 35 },
    { name: 'Food', percentage: 30 },
    { name: 'Transport', percentage: 15 },
    { name: 'Social', percentage: 15 },
    { name: 'Miscellaneous', percentage: 5 },
  ],
  'Custom': [
    { name: 'Accommodation', percentage: 20 },
    { name: 'Food', percentage: 20 },
    { name: 'Transport', percentage: 20 },
    { name: 'Social', percentage: 20 },
    { name: 'Miscellaneous', percentage: 20 },
  ],
};

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'THB'];

export default function TravelBudgetTracker() {
  const [darkMode, setDarkMode] = useState(false);
  const [showBudgetSetup, setShowBudgetSetup] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAdvancedExpense, setShowAdvancedExpense] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [budget, setBudget] = useState<Budget>({
    currency: 'USD',
    totalMonthly: 2000,
    template: 'Digital Nomad',
    categories: budgetTemplates['Digital Nomad'].map(cat => ({
      ...cat,
      amount: (2000 * cat.percentage) / 100
    }))
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '' as ExpenseCategory | '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    tags: '',
    paymentMethod: '' as PaymentMethod | '',
  });

  useEffect(() => {
    fetchBudget();
  }, []);

  useEffect(() => {
    if (budget._id && !showBudgetSetup) {
      fetchExpenses();
    }
  }, [budget._id, showBudgetSetup]);

  const getUserId = () => {
    return 'user-default-123';
  };

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budget', {
        headers: {
          'x-user-id': getUserId(),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch budget');
      
      const data = await response.json();
      
      if (data) {
        setBudget(data);
        setShowBudgetSetup(false);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      setShowBudgetSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      if (!budget._id) return;
      
      const response = await fetch(`/api/expenses?budgetId=${budget._id}`, {
        headers: {
          'x-user-id': getUserId(),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch expenses');
      
      const data = await response.json();
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showNotification('error', 'Failed to load expenses');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBudgetSetup = async () => {
    const total = budget.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (total !== 100) {
      showNotification('error', 'Budget must total 100%');
      return;
    }
    if (budget.totalMonthly <= 0) {
      showNotification('error', 'Total budget must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId(),
        },
        body: JSON.stringify({
          currency: budget.currency,
          totalMonthly: budget.totalMonthly,
          template: budget.template,
          categories: budget.categories,
        }),
      });

      if (!response.ok) throw new Error('Failed to save budget');
      
      const data = await response.json();
      setBudget(data);
      setShowBudgetSetup(false);
      showNotification('success', 'Budget configured successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      showNotification('error', 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (template: BudgetTemplate) => {
    setBudget(prev => ({
      ...prev,
      template,
      categories: budgetTemplates[template].map(cat => ({
        ...cat,
        amount: (prev.totalMonthly * cat.percentage) / 100
      }))
    }));
  };

  const handleCategoryChange = (index: number, percentage: number) => {
    setBudget(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = {
        ...newCategories[index],
        percentage,
        amount: (prev.totalMonthly * percentage) / 100
      };
      return { ...prev, categories: newCategories };
    });
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      showNotification('error', 'Amount must be greater than 0');
      return;
    }
    if (!expenseForm.category) {
      showNotification('error', 'Please select a category');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId(),
        },
        body: JSON.stringify({
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          description: expenseForm.description,
          date: expenseForm.date,
          location: expenseForm.location,
          tags: expenseForm.tags ? expenseForm.tags.split(',').map(t => t.trim()) : [],
          paymentMethod: expenseForm.paymentMethod || '',
          budgetId: budget._id,
        }),
      });

      if (!response.ok) throw new Error('Failed to add expense');
      
      const newExpense = await response.json();
      setExpenses(prev => [newExpense, ...prev]);
      
      showNotification('success', `✓ Expense logged: ${budget.currency} ${newExpense.amount} on ${newExpense.category}`);

      setExpenseForm({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        tags: '',
        paymentMethod: '',
      });
      setShowExpenseForm(false);
      setShowAdvancedExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setShowDeleteDialog(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?id=${expenseToDelete}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId(),
        },
      });

      if (!response.ok) throw new Error('Failed to delete expense');
      
      setExpenses(prev => prev.filter(exp => exp._id !== expenseToDelete));
      showNotification('success', 'Expense deleted successfully');
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      showNotification('error', 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptScan = async (file: File) => {
    try {
      setScanningReceipt(true);
      showNotification('info', 'Scanning receipt with AI...');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'x-user-id': getUserId(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan receipt');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setExpenseForm({
          amount: result.data.amount.toString(),
          category: result.data.category as ExpenseCategory,
          description: result.data.description || '',
          date: result.data.date || new Date().toISOString().split('T')[0],
          location: result.data.location || '',
          tags: '',
          paymentMethod: '',
        });
        
        showNotification('success', '✨ Receipt scanned! Review and save the expense.');
        setShowExpenseForm(true);
        setShowAdvancedExpense(true);
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to scan receipt');
    } finally {
      setScanningReceipt(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select an image file');
        return;
      }
      handleReceiptScan(file);
    }
  };

  const getCategoryIcon = (category: ExpenseCategory): string => {
    const icons: Record<ExpenseCategory, string> = {
      'Accommodation': '🏠',
      'Food': '🍽️',
      'Transport': '🚗',
      'Social': '🎉',
      'Miscellaneous': '📦'
    };
    return icons[category];
  };

  if (loading && !scanningReceipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (showBudgetSetup) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Set Your Travel Budget
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Configure your monthly budget to start tracking expenses
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Currency
                  </label>
                  <select
                    value={budget.currency}
                    onChange={(e) => setBudget(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Budget
                  </label>
                  <input
                    type="number"
                    value={budget.totalMonthly}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      setBudget(prev => ({
                        ...prev,
                        totalMonthly: total,
                        categories: prev.categories.map(cat => ({
                          ...cat,
                          amount: (total * cat.percentage) / 100
                        }))
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="2000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Template
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Backpacker', 'Digital Nomad', 'Comfortable', 'Custom'] as BudgetTemplate[]).map(template => (
                      <button
                        key={template}
                        onClick={() => handleTemplateChange(template)}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          budget.template === template
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Category Breakdown
                  </label>
                  <div className="space-y-4">
                    {budget.categories.map((cat, idx) => (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getCategoryIcon(cat.name)} {cat.name}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {cat.percentage}%
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                              {budget.currency} {cat.amount.toFixed(0)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={cat.percentage}
                          onChange={(e) => handleCategoryChange(idx, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          disabled={budget.template !== 'Custom'}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">Total</span>
                      <span className={`font-bold ${
                        budget.categories.reduce((sum, cat) => sum + cat.percentage, 0) === 100
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {budget.categories.reduce((sum, cat) => sum + cat.percentage, 0)}% 
                        ({budget.currency} {budget.categories.reduce((sum, cat) => sum + cat.amount, 0).toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBudgetSetup}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  Save Budget Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = budget.totalMonthly - totalSpent;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = new Date().getDate();
  const daysRemaining = daysInMonth - daysPassed;
  const dailyBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Travel Budget
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </header>

        {notification && (
          <div className={`fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <span className="flex-1">{notification.message}</span>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Budget</span>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {budget.currency} {budget.totalMonthly.toFixed(0)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Spent</span>
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {budget.currency} {totalSpent.toFixed(2)}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((totalSpent / budget.totalMonthly) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Daily Budget</span>
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {budget.currency} {dailyBudget.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {daysRemaining} days remaining
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Spending
            </h2>
            <div className="space-y-4">
              {budget.categories.map(cat => {
                const spent = expenses
                  .filter(e => e.category === cat.name)
                  .reduce((sum, e) => sum + e.amount, 0);
                const percentage = (spent / cat.amount) * 100;
                
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(cat.name)}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {budget.currency} {spent.toFixed(2)} / {cat.amount.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentage > 100 ? 'bg-red-500' : 
                          percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Expenses
            </h2>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No expenses yet. Add your first expense!
                </p>
              ) : (
                expenses.slice(0, 10).map(expense => (
                  <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                      <span className="text-2xl flex-shrink-0">{getCategoryIcon(expense.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {expense.description || expense.category}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {new Date(expense.date).toLocaleDateString()} 
                          {expense.location && ` • ${expense.location}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                        {budget.currency} {expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => confirmDeleteExpense(expense._id!)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanningReceipt}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
            title="Scan receipt with AI"
          >
            {scanningReceipt ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={() => setShowExpenseForm(true)}
            className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                  Delete Expense?
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  Are you sure you want to delete this expense? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setExpenseToDelete(null);
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteExpense}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showExpenseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h3>
                <button 
                  onClick={() => { 
                    setShowExpenseForm(false); 
                    setShowAdvancedExpense(false); 
                  }} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {scanningReceipt && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                    <Loader className="w-5 h-5 animate-spin text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">AI is analyzing your receipt...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few seconds</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {budget.categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {getCategoryIcon(cat.name)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!showAdvancedExpense && (
                  <button
                    onClick={() => setShowAdvancedExpense(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    + Add more details
                  </button>
                )}

                {showAdvancedExpense && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Dinner at restaurant"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={expenseForm.location}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., City Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={expenseForm.paymentMethod}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select payment method</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Digital Wallet">Digital Wallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={expenseForm.tags}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, tags: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Social, Business"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { 
                      setShowExpenseForm(false); 
                      setShowAdvancedExpense(false); 
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    Save Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}