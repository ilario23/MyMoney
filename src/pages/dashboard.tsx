import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Expense, type Category } from '@/lib/dexie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Map<string, Category>>(new Map());
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadExpensesAndCategories = async () => {
      // Load categories
      const userCategories = await db.categories.where('userId').equals(user.id).toArray();
      const categoryMap = new Map(userCategories.map(c => [c.id, c]));
      setCategories(categoryMap);

      // Load expenses for current month
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      const data = await db.expenses
        .where('[userId+date]')
        .between([user.id, start], [user.id, end])
        .toArray();

      // Filtra solo le spese NON eliminate (deletedAt === undefined)
      const activeExpenses = data.filter((e) => !e.deletedAt);

      setExpenses(activeExpenses);

      // Calcola totali
      const total = activeExpenses
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      const income = activeExpenses
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      setMonthlyTotal(total);
      setMonthlyIncome(income);
    };

    loadExpensesAndCategories();
  }, [user]);

  if (!user) {
    return null;
  }

  const dateLocale = language === 'it' ? it : enUS;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('dashboard.greeting').replace('{name}', user.displayName || t('dashboard.welcome'))}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
          </p>
        </div>
        <Button onClick={() => navigate('/expense/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('dashboard.newExpense')}</span>
        </Button>
      </div>

      {/* Summary Card - Combined */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.monthlySummary')}</CardTitle>
          <CardDescription>{format(new Date(), 'MMMM yyyy', { locale: dateLocale })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expenses */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span>{t('dashboard.expensesThisMonth')}</span>
              </div>
              <div className="text-3xl font-bold text-destructive">€{monthlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.transactions').replace('{count}', String(expenses.filter(e => e.amount > 0).length))}
              </p>
            </div>

            {/* Income */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{t('dashboard.incomeThisMonth')}</span>
              </div>
              <div className="text-3xl font-bold text-green-600">€{monthlyIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.transactions').replace('{count}', String(expenses.filter(e => e.amount < 0).length))}
              </p>
            </div>

            {/* Net Balance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{t('dashboard.netBalance')}</span>
              </div>
              <div className={`text-3xl font-bold ${(monthlyIncome - monthlyTotal) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                €{(monthlyIncome - monthlyTotal).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalTransactions').replace('{count}', String(expenses.length))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{t('dashboard.recentExpenses')}</CardTitle>
            <CardDescription>{t('dashboard.recentDescription')}</CardDescription>
          </div>
          {expenses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/expenses')}
              className="text-primary hover:text-primary"
            >
              View All →
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('dashboard.noExpenses')}</p>
              <Button
                variant="link"
                onClick={() => navigate('/expense/new')}
                className="mt-2"
              >
                {t('dashboard.addFirstExpense')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => {
                const categoryObj = categories.get(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/expense/${expense.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {categoryObj ? `${categoryObj.icon} ${categoryObj.name}` : 'Unknown category'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${expense.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {expense.amount > 0 ? '-' : '+'}€{Math.abs(expense.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(expense.date, 'd MMM', { locale: dateLocale })}
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
