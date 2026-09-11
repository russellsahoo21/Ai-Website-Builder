/**
 * Production-ready templates showcasing instant capabilities
 */
import { ensureStandardReactStructure } from '../utils/projectStructure.js';
import { COOL_TEMPLATES } from './coolTemplates.js';

const RAW_TEMPLATES = [
  {
    id: "react-expense-tracker",
    name: "Apex Ledger - React Expense Tracker",
    tagline: "Full-Stack React 18 Application with state, analytics & persistent storage",
    description: "Complete interactive React expense tracker with real-time analytics, CRUD operations, category filters, and localStorage persistence.",
    category: "React Web Apps",
    tags: ["React 18", "State Management", "Tailwind CSS", "LocalStorage"],
    author: "AetherCraft Engineering",
    stars: 2840,
    files: {
      "App.jsx": `import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  Calendar, 
  PieChart, 
  CreditCard,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const INITIAL_TRANSACTIONS = [
  { id: '1', title: 'Consulting Retainer', amount: 4850, type: 'income', category: 'Salary', date: '2026-03-01' },
  { id: '2', title: 'Cloud Infrastructure (AWS)', amount: 280, type: 'expense', category: 'Software', date: '2026-03-02' },
  { id: '3', title: 'Studio Workspace Rent', amount: 1200, type: 'expense', category: 'Housing', date: '2026-03-03' },
  { id: '4', title: 'Team Dinner & Catering', amount: 165, type: 'expense', category: 'Food', date: '2026-03-05' },
  { id: '5', title: 'Design System Licensing', amount: 750, type: 'income', category: 'Royalties', date: '2026-03-07' },
  { id: '6', title: 'Ergonomic Standing Desk', amount: 490, type: 'expense', category: 'Equipment', date: '2026-03-08' }
];

const CATEGORIES = ['Salary', 'Housing', 'Food', 'Software', 'Equipment', 'Royalties', 'Utilities', 'Travel'];

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_ledger_txs');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Transaction Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('apex_ledger_txs', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  // Calculations
  const { totalIncome, totalExpenses, netBalance, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    });
    const balance = income - expense;
    const rate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    return { totalIncome: income, totalExpenses: expense, netBalance: balance, savingsRate: rate };
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, filterType, selectedCategory, searchQuery]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const newTx = {
      id: Date.now().toString(),
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    setTransactions([newTx, ...transactions]);
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans p-4 sm:p-8 selection:bg-zinc-700">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black font-bold flex items-center justify-center text-sm shadow-md">
                $
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Apex Ledger</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                React 18 SPA
              </span>
            </div>
            <p className="text-xs text-zinc-400">Full-stack expense intelligence with persistent local storage.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        </header>

        {/* Telemetry / Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Net Balance</span>
              <CreditCard className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              \${netBalance.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
              <span>Savings Rate:</span>
              <span className={\`font-semibold \${savingsRate >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                {savingsRate}%
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              +\${totalIncome.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">
              {transactions.filter(t => t.type === 'income').length} credit events logged
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              -\${totalExpenses.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">
              {transactions.filter(t => t.type === 'expense').length} debit deductions
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span>Active Storage</span>
              <PieChart className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-200 font-mono">
              {transactions.length} Records
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-persisted to client
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Transaction Ledger */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  {['all', 'income', 'expense'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={\`px-3 py-1 rounded-md text-[11px] capitalize font-medium transition \${
                        filterType === type ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                      }\`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No transaction records matched your query.
                </div>
              ) : (
                filteredTransactions.map(tx => (
                  <div 
                    key={tx.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={\`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold \${
                        tx.type === 'income' 
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }\`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{tx.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">{tx.category}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={\`font-mono text-sm font-bold \${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                      }\`}>
                        {tx.type === 'income' ? '+' : '-'}\${Number(tx.amount).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Col: Category Breakdown & Spending Intelligence */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Expense Breakdown</span>
                <PieChart className="w-3.5 h-3.5 text-zinc-500" />
              </h3>

              <div className="space-y-3 pt-2">
                {categoryStats.length === 0 ? (
                  <p className="text-xs text-zinc-500">No expense data recorded.</p>
                ) : (
                  categoryStats.map(([cat, amt]) => {
                    const percent = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-300">
                          <span>{cat}</span>
                          <span className="font-mono text-zinc-400">\${amt.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className="h-full bg-zinc-300 rounded-full transition-all duration-300"
                            style={{ width: \`\${percent}%\` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Export / Reset Tools */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-200">Local Sandbox State</span>
                <p className="text-[11px] text-zinc-500">Changes persist across page reloads.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Reset transactions to default starter data?')) {
                    setTransactions(INITIAL_TRANSACTIONS);
                  }
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition"
              >
                Reset Data
              </button>
            </div>
          </div>

        </div>

        {/* Create Transaction Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-[#0f1219] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
              <h2 className="text-base font-bold text-white mb-1">New Transaction</h2>
              <p className="text-xs text-zinc-400 mb-5">Record a debit or credit event into your ledger.</p>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Cloud Server Subscription"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                    >
                      <option value="expense">Expense (Debit)</option>
                      <option value="income">Income (Credit)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}`,
      "styles.css": `/* Custom animations and scrollbar */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}`
    }
  },
  {
    id: "saas-landing",
    name: "Nexus - Dark SaaS Landing",
    tagline: "High-converting dark-mode AI software landing page",
    description: "Features glowing gradient backdrops, interactive ROI calculator, feature cards, and pricing tiers.",
    category: "SaaS & AI",
    tags: ["Dark Mode", "Interactive Calculator", "Tailwind CSS"],
    author: "AetherCraft Engineering",
    stars: 1420,
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexusAI - Next Gen Intelligence</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 500: '#6366f1', 600: '#4f46e5' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#0b0f17] text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white">
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/20 blur-[140px] rounded-full"></div>
    <div class="absolute top-1/2 -left-40 w-[500px] h-[400px] bg-violet-600/15 blur-[120px] rounded-full"></div>
  </div>

  <header class="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f17]/70 border-b border-white/5">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <i data-lucide="sparkles" class="w-4 h-4 text-white"></i>
        </div>
        <span class="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">NexusAI</span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
        <a href="#features" class="hover:text-white transition">Features</a>
        <a href="#calculator" class="hover:text-white transition">ROI Estimator</a>
        <a href="#pricing" class="hover:text-white transition">Pricing</a>
      </nav>
      <div class="flex items-center gap-4">
        <button class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5">
          <span>Get Started</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  </header>

  <section class="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm">
      <span class="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
      <span>Introducing Nexus Engine 3.0</span>
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
      Build web experiences <br class="hidden sm:inline"/>
      <span class="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">at the speed of thought</span>
    </h1>
    <p class="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
      Harness high-precision AI agents that turn simple concepts into deployable, enterprise-ready software in seconds.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2">
        <i data-lucide="zap" class="w-4 h-4"></i>
        <span>Start Building Free</span>
      </button>
      <button class="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 font-medium transition backdrop-blur-sm flex items-center justify-center gap-2">
        <i data-lucide="play" class="w-4 h-4 text-slate-400"></i>
        <span>Watch 2-Min Demo</span>
      </button>
    </div>
  </section>

  <section id="features" class="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold tracking-tight mb-3">Engineered for absolute speed</h2>
      <p class="text-slate-400 max-w-xl mx-auto">Everything you need to ship world-class digital products with zero configuration.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition duration-300 group">
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition">
          <i data-lucide="cpu" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2 text-white">Neural Code Synthesis</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Generates production-standard semantic markup, accessible primitives, and optimized styling.</p>
      </div>
      <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition duration-300 group">
        <div class="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition">
          <i data-lucide="layers" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2 text-white">Zero-Latency Sandbox</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Preview changes dynamically inside an isolated in-memory environment with zero flicker.</p>
      </div>
      <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition duration-300 group">
        <div class="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition">
          <i data-lucide="rocket" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2 text-white">1-Click Global Deploy</h3>
        <p class="text-slate-400 text-sm leading-relaxed">Export deployable ZIP archives or publish directly to edge distribution CDNs.</p>
      </div>
    </div>
  </section>

  <section id="calculator" class="max-w-4xl mx-auto px-6 py-16">
    <div class="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl">
      <div class="text-center mb-8">
        <h3 class="text-2xl font-bold mb-2">Estimate Your Team Savings</h3>
        <p class="text-slate-400 text-sm">See how many engineering hours NexusAI saves your company monthly.</p>
      </div>
      <div class="space-y-6 max-w-xl mx-auto">
        <div>
          <div class="flex justify-between text-sm font-medium mb-2">
            <span class="text-slate-300">Engineers on your team:</span>
            <span id="team-count" class="text-indigo-400 font-bold">5 Developers</span>
          </div>
          <input id="team-slider" type="range" min="1" max="25" value="5" class="w-full accent-indigo-500 cursor-pointer">
        </div>
        <div class="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Estimated Monthly Savings</div>
            <div id="savings-display" class="text-3xl font-extrabold text-white mt-1">$12,500 / mo</div>
          </div>
          <button class="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition">Calculate ROI</button>
        </div>
      </div>
    </div>
  </section>

  <footer class="border-t border-white/5 py-8 text-center text-xs text-slate-500">
    <p>© 2026 NexusAI Systems. Powered by AetherCraft Engine.</p>
  </footer>

  <script src="script.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>`,
      "styles.css": `@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }`,
      "script.js": `const teamSlider = document.getElementById('team-slider');
const teamCount = document.getElementById('team-count');
const savingsDisplay = document.getElementById('savings-display');

if (teamSlider && teamCount && savingsDisplay) {
  teamSlider.addEventListener('input', (e) => {
    const devs = parseInt(e.target.value);
    teamCount.textContent = devs === 1 ? '1 Developer' : \`\${devs} Developers\`;
    const savings = devs * 2500;
    savingsDisplay.textContent = \`$\${savings.toLocaleString()} / mo\`;
  });
}`
    }
  },
  {
    id: "luxury-real-estate",
    name: "Aura Estates - Architectural Sanctuaries",
    tagline: "Luxury property portfolio with mortgage estimator",
    description: "Curated residential showcase with villa photo gallery, filter tags, and interactive financial calculator.",
    category: "Real Estate",
    tags: ["Luxury", "Mortgage Calculator", "Gallery"],
    author: "Studio Nord",
    stars: 980,
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Estates - Exclusive Architectural Living</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['Cinzel', 'serif'],
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="bg-[#0f1115] text-slate-100 font-sans selection:bg-amber-600 selection:text-white">
  <nav class="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#0f1115]/80 border-b border-white/5">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-serif text-2xl tracking-widest text-amber-300 font-bold">AURA</span>
        <span class="text-xs uppercase tracking-widest text-slate-400 mt-1">Estates</span>
      </div>
      <div class="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-slate-300 font-medium">
        <a href="#properties" class="hover:text-amber-300 transition">Residences</a>
        <a href="#calculator" class="hover:text-amber-300 transition">Mortgage</a>
      </div>
      <button class="px-5 py-2.5 rounded-full border border-amber-400/40 hover:bg-amber-400/10 text-amber-300 text-xs uppercase tracking-widest font-semibold transition">
        Inquire Privately
      </button>
    </div>
  </nav>

  <header class="relative min-h-screen flex items-center justify-center text-center px-6 pt-20">
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80" alt="Villa" class="w-full h-full object-cover opacity-35 scale-105 transition duration-1000">
      <div class="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/60 to-transparent"></div>
    </div>
    <div class="max-w-4xl mx-auto">
      <p class="text-xs uppercase tracking-[0.3em] text-amber-400 font-semibold mb-4">Architectural Mastery</p>
      <h1 class="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
        Sanctuaries for the Discerning Soul
      </h1>
      <p class="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-10 font-light leading-relaxed">
        Curated portfolio of prime architectural residences along the Mediterranean and Pacific coasts.
      </p>
      <a href="#properties" class="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs uppercase tracking-widest font-bold transition shadow-xl shadow-amber-500/20">
        <span>Explore Collection</span>
        <i data-lucide="arrow-down" class="w-4 h-4"></i>
      </a>
    </div>
  </header>

  <section id="properties" class="max-w-7xl mx-auto px-6 py-24">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
      <div>
        <h2 class="font-serif text-3xl font-bold mb-2">Featured Residences</h2>
        <p class="text-slate-400 text-sm">Privately listed and verified for immediate acquisition.</p>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition duration-500">
        <div class="relative aspect-[4/3] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80" alt="Villa" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold">$14,500,000</div>
        </div>
        <div class="p-6">
          <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">Amalfi Coast, Italy</div>
          <h3 class="font-serif text-xl font-bold text-white mb-4">Villa Solaria</h3>
          <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/5">
            <span>6 Bed • 8 Bath</span>
            <span>9,400 sq ft</span>
          </div>
        </div>
      </div>
      <div class="group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition duration-500">
        <div class="relative aspect-[4/3] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80" alt="Villa" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold">$22,000,000</div>
        </div>
        <div class="p-6">
          <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">Malibu, California</div>
          <h3 class="font-serif text-xl font-bold text-white mb-4">Pacific Pavilion</h3>
          <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/5">
            <span>5 Bed • 7 Bath</span>
            <span>11,200 sq ft</span>
          </div>
        </div>
      </div>
      <div class="group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition duration-500">
        <div class="relative aspect-[4/3] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80" alt="Villa" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">
          <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold">$9,800,000</div>
        </div>
        <div class="p-6">
          <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">Santorini, Greece</div>
          <h3 class="font-serif text-xl font-bold text-white mb-4">Caldera Horizon</h3>
          <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/5">
            <span>4 Bed • 5 Bath</span>
            <span>6,800 sq ft</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="calculator" class="max-w-4xl mx-auto px-6 py-16">
    <div class="p-8 sm:p-12 rounded-3xl bg-[#14171d] border border-white/10 shadow-2xl">
      <h3 class="font-serif text-2xl font-bold mb-2 text-white">Investment Financing Estimator</h3>
      <p class="text-slate-400 text-sm mb-8">Calculate estimated monthly principal and interest payments.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-medium">Purchase Price ($)</label>
          <input id="prop-price" type="number" value="12000000" class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-medium">Down Payment (%)</label>
          <input id="down-payment" type="number" value="25" class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-amber-400 focus:outline-none">
        </div>
      </div>
      <div class="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div class="text-xs uppercase tracking-widest text-slate-400">Estimated Monthly Payment (6.2% APR)</div>
          <div id="mortgage-result" class="text-3xl font-serif text-amber-300 font-bold mt-1">$55,116 / month</div>
        </div>
        <button id="recalc-btn" class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs uppercase tracking-widest font-bold transition">Recalculate</button>
      </div>
    </div>
  </section>

  <footer class="border-t border-white/5 py-12 text-center text-xs text-slate-500">
    <p>© 2026 Aura Luxury Real Estate Global. All rights reserved.</p>
  </footer>
  <script src="script.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>`,
      "styles.css": `/* Luxury custom styles */`,
      "script.js": `function calculateMortgage() {
  const price = parseFloat(document.getElementById('prop-price')?.value) || 0;
  const down = parseFloat(document.getElementById('down-payment')?.value) || 0;
  const principal = price * (1 - down / 100);
  const monthlyRate = 0.062 / 12;
  const numPayments = 360;
  if (principal <= 0) return;
  const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const el = document.getElementById('mortgage-result');
  if (el) el.textContent = \`$\${Math.round(monthly).toLocaleString()} / month\`;
}
document.getElementById('recalc-btn')?.addEventListener('click', calculateMortgage);
document.getElementById('prop-price')?.addEventListener('input', calculateMortgage);
document.getElementById('down-payment')?.addEventListener('input', calculateMortgage);`
    }
  },
  {
    id: "ecom-sneakers",
    name: "Kinetics - High-Performance Footwear",
    tagline: "E-Commerce store with shopping cart and size selector",
    description: "Modern streetwear and performance footwear store with interactive size selector, instant cart drawer, and checkout mockup.",
    category: "E-Commerce",
    tags: ["Cart Drawer", "Product Selector", "Tailwind CSS"],
    author: "Elena Rostova",
    stars: 840,
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KINETICS // Kinetic Propulsion Running</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-[#09090b] text-zinc-100 antialiased font-sans selection:bg-orange-500 selection:text-white">
  <!-- Top Bar -->
  <div class="bg-orange-600 text-black text-center text-xs font-bold py-2 uppercase tracking-widest">
    Worldwide Express Shipping // Use Code 'VIBECODE' for 20% Off
  </div>

  <!-- Navigation -->
  <nav class="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <span class="font-black text-2xl tracking-tighter uppercase italic">KINETICS<span class="text-orange-500">.</span></span>
      <div class="flex items-center gap-4">
        <button id="cart-toggle" class="relative p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 transition">
          <i data-lucide="shopping-bag" class="w-5 h-5 text-zinc-300"></i>
          <span id="cart-badge" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-black font-bold text-xs flex items-center justify-center">0</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Product Hero -->
  <main class="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    <div class="relative rounded-3xl bg-zinc-900/60 border border-zinc-800 p-8 flex items-center justify-center overflow-hidden">
      <div class="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
      <img id="main-product-img" src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80" alt="Sneaker" class="w-full max-w-md object-contain -rotate-12 hover:rotate-0 transition duration-500">
    </div>

    <div>
      <div class="text-orange-500 font-mono text-xs uppercase tracking-widest font-bold mb-2">Carbon Matrix Plate V3</div>
      <h1 class="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-4">AERO-PULSE 900</h1>
      <div class="flex items-center gap-3 mb-6">
        <span class="text-3xl font-black text-white">$240.00</span>
        <span class="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">In Stock</span>
      </div>

      <p class="text-zinc-400 text-sm leading-relaxed mb-8">
        Built with aerospace-grade carbon fiber and responsive nitrogen-infused foam to return maximum kinetic energy with every stride.
      </p>

      <div class="mb-8">
        <label class="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">Select Size (US Men)</label>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2" id="size-options">
          <button class="size-btn py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 text-xs font-bold transition">8.0</button>
          <button class="size-btn py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 text-xs font-bold transition">8.5</button>
          <button class="size-btn py-2.5 rounded-xl border border-orange-500 bg-orange-500/10 text-orange-400 text-xs font-bold transition">9.0</button>
          <button class="size-btn py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 text-xs font-bold transition">9.5</button>
          <button class="size-btn py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 text-xs font-bold transition">10.0</button>
          <button class="size-btn py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 text-xs font-bold transition">11.0</button>
        </div>
      </div>

      <button id="add-to-cart-btn" class="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wider text-sm transition shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2">
        <i data-lucide="shopping-cart" class="w-5 h-5"></i>
        <span>Add to Bag - $240.00</span>
      </button>
    </div>
  </main>

  <!-- Slide-out Cart Drawer -->
  <div id="cart-drawer" class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl p-6 transform translate-x-full transition duration-300 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
        <span class="font-black uppercase tracking-tight text-lg">Your Cart (<span id="drawer-count">0</span>)</span>
        <button id="close-cart" class="p-1 rounded-lg hover:bg-zinc-900"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div id="cart-items" class="py-6 space-y-4">
        <div class="text-zinc-500 text-sm text-center py-12">Your shopping bag is empty.</div>
      </div>
    </div>
    <div class="pt-6 border-t border-zinc-800">
      <div class="flex justify-between text-sm mb-4">
        <span class="text-zinc-400">Estimated Total:</span>
        <span id="cart-total" class="font-black text-xl">$0.00</span>
      </div>
      <button class="w-full py-3.5 rounded-xl bg-orange-500 text-black font-bold uppercase text-xs tracking-wider">Proceed to Checkout</button>
    </div>
  </div>

  <script src="script.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>`,
      "styles.css": ``,
      "script.js": `let cartCount = 0;
const cartDrawer = document.getElementById('cart-drawer');
const cartBadge = document.getElementById('cart-badge');
const drawerCount = document.getElementById('drawer-count');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

document.getElementById('cart-toggle')?.addEventListener('click', () => {
  cartDrawer?.classList.remove('translate-x-full');
});

document.getElementById('close-cart')?.addEventListener('click', () => {
  cartDrawer?.classList.add('translate-x-full');
});

document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
  cartCount++;
  if (cartBadge) cartBadge.textContent = cartCount;
  if (drawerCount) drawerCount.textContent = cartCount;
  if (cartTotal) cartTotal.textContent = \`$\${(cartCount * 240).toLocaleString()}.00\`;
  if (cartItems) {
    cartItems.innerHTML = \`
      <div class="flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=200&q=80" class="w-16 h-16 object-contain">
        <div>
          <div class="font-bold text-sm">AERO-PULSE 900</div>
          <div class="text-xs text-zinc-400">Size: US 9.0 • Qty: \${cartCount}</div>
          <div class="text-orange-400 font-bold text-sm mt-1">$\${(cartCount * 240).toLocaleString()}.00</div>
        </div>
      </div>
    \`;
  }
  cartDrawer?.classList.remove('translate-x-full');
});`
    }
  },
  {
    id: "fintech-dashboard",
    name: "Apex Finance - Portfolio Analytics",
    tagline: "Cryptocurrency & stock portfolio tracking dashboard",
    description: "Fintech analytics dashboard with balance breakdown, animated asset distribution, and transaction history.",
    category: "Dashboards",
    tags: ["Fintech", "Charts", "Dark Mode"],
    author: "Klaus Weber",
    stars: 1120,
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Capital // Wealth Management</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-[#090b10] text-slate-100 font-sans antialiased">
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#0e1117] border-r border-white/5 p-6 flex flex-col justify-between hidden md:flex">
      <div>
        <div class="flex items-center gap-2 mb-10">
          <div class="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">▲</div>
          <span class="font-bold text-lg tracking-tight">APEX<span class="text-emerald-400">.</span></span>
        </div>
        <nav class="space-y-1">
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-white text-xs font-semibold"><i data-lucide="layout-dashboard" class="w-4 h-4 text-emerald-400"></i> Dashboard</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.02] text-xs font-medium transition"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.02] text-xs font-medium transition"><i data-lucide="arrow-left-right" class="w-4 h-4"></i> Transactions</a>
        </nav>
      </div>
      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
        <div class="text-emerald-300 font-bold mb-1">Portfolio Verified</div>
        <div class="text-slate-400 text-[11px]">Cold storage multisig active.</div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-6 sm:p-10">
      <div class="max-w-6xl mx-auto space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Balance</div>
            <div class="text-4xl font-extrabold text-white mt-1">$148,290.45 <span class="text-emerald-400 text-sm font-semibold">+12.4% this mo</span></div>
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition">Deposit Funds</button>
            <button class="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-200 text-xs font-semibold transition">Transfer</button>
          </div>
        </div>

        <!-- Asset Allocation Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-[#0f131a] border border-white/5">
            <div class="text-xs text-slate-400 mb-1">Bitcoin (BTC)</div>
            <div class="text-2xl font-bold text-white">$84,120.00</div>
            <div class="text-xs text-emerald-400 mt-2 flex items-center gap-1"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +4.8% 24h</div>
          </div>
          <div class="p-6 rounded-2xl bg-[#0f131a] border border-white/5">
            <div class="text-xs text-slate-400 mb-1">Ethereum (ETH)</div>
            <div class="text-2xl font-bold text-white">$42,910.20</div>
            <div class="text-xs text-emerald-400 mt-2 flex items-center gap-1"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +8.1% 24h</div>
          </div>
          <div class="p-6 rounded-2xl bg-[#0f131a] border border-white/5">
            <div class="text-xs text-slate-400 mb-1">USDC Liquid Yield</div>
            <div class="text-2xl font-bold text-white">$21,260.25</div>
            <div class="text-xs text-slate-400 mt-2">5.2% APY Compounding</div>
          </div>
        </div>
      </div>
    </main>
  </div>
  <script src="script.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>`,
      "styles.css": ``,
      "script.js": `console.log("Apex Finance Dashboard Initialized");`
    }
  }
];

export const STARTER_TEMPLATES = [...RAW_TEMPLATES, ...COOL_TEMPLATES].map(tmpl => ({
  ...tmpl,
  files: ensureStandardReactStructure(tmpl.files || {}, tmpl.name)
}));

