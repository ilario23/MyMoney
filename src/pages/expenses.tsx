import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Expense, type Category } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

export function ExpensesPage() {
  const { user } = useAuthStore();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Map<string, Category>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load categories
        const userCategories = await db.categories.where('userId').equals(user.id).toArray();
        const categoryMap = new Map(userCategories.map(c => [c.id, c]));
        setCategories(categoryMap);

        // Load all expenses (not filtered by month)
        const allExpenses = await db.expenses
          .where('userId')
          .equals(user.id)
          .and((e) => !e.deletedAt)  // Exclude deleted
          .reverse()  // Most recent first
          .sortBy('date');

        setExpenses(allExpenses.reverse());
        setFilteredExpenses(allExpenses.reverse());
      } catch (error) {
        console.error('Error loading expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Filter and sort expenses
  useEffect(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((expense) => {
        const category = categories.get(expense.category);
        return (
          expense.description.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query) ||
          expense.amount.toString().includes(query)
        );
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((expense) => expense.category === selectedCategory);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((expense) => expense.date >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((expense) => expense.date <= toDate);
    }

    // Amount range filter
    if (amountMin) {
      const min = Math.abs(parseFloat(amountMin));
      filtered = filtered.filter((expense) => Math.abs(expense.amount) >= min);
    }
    if (amountMax) {
      const max = Math.abs(parseFloat(amountMax));
      filtered = filtered.filter((expense) => Math.abs(expense.amount) <= max);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = a.date.getTime() - b.date.getTime();
      } else if (sortBy === 'amount') {
        comparison = Math.abs(a.amount) - Math.abs(b.amount);
      } else if (sortBy === 'category') {
        const catA = categories.get(a.category)?.name || '';
        const catB = categories.get(b.category)?.name || '';
        comparison = catA.localeCompare(catB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredExpenses(filtered);
  }, [searchQuery, expenses, categories, selectedCategory, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder]);

  // Helper: Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Helper: Check if any filter is active
  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    amountMin !== '' ||
    amountMax !== '' ||
    sortBy !== 'date' ||
    sortOrder !== 'desc';

  if (!user) return null;

  const dateLocale = language === 'it' ? it : enUS;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">All Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredExpenses.length} of {expenses.length} expenses
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearFilters}
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Array.from(categories.values()).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Amount (€)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Amount (€)</label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'amount' | 'category')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{searchQuery ? 'No expenses found matching your search' : 'No expenses yet'}</p>
              {!searchQuery && (
                <Button
                  variant="link"
                  onClick={() => navigate('/expense/new')}
                  className="mt-2"
                >
                  Add your first expense
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => {
                const categoryObj = categories.get(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/expense/${expense.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{expense.description}</p>
                        {categoryObj && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {categoryObj.icon} {categoryObj.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(expense.date, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${expense.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {expense.amount > 0 ? '-' : '+'}€{Math.abs(expense.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
