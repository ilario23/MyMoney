import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Expense, type Category } from '@/lib/dexie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
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

  // Filter expenses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExpenses(expenses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = expenses.filter((expense) => {
      const category = categories.get(expense.category);
      return (
        expense.description.toLowerCase().includes(query) ||
        category?.name.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      );
    });
    setFilteredExpenses(filtered);
  }, [searchQuery, expenses, categories]);

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
        <CardContent className="pt-6">
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
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
                      <p className="text-xs text-muted-foreground">{expense.currency}</p>
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
