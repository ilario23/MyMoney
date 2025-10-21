import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Expense, type Category } from '@/lib/dexie';
import { getUserExpenseSummary, getUserCategoryStats, getCurrentVsPreviousMonth } from '@/lib/aggregations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Calendar, PieChart, Target, BarChart3 } from 'lucide-react';
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
  
  // Nuove statistiche da Views
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [avgExpense, setAvgExpense] = useState(0);
  const [topCategories, setTopCategories] = useState<Array<{category: string; total_amount: number; expense_count: number}>>([]);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadExpensesAndCategories = async () => {
      // Load categories
      const userCategories = await db.categories.where('userId').equals(user.id).toArray();
      const categoryMap = new Map(userCategories.map(c => [c.id, c]));
      setCategories(categoryMap);

      // Load groups where user is owner or member
      const ownedGroups = await db.groups.where('ownerId').equals(user.id).toArray();
      const memberships = await db.groupMembers.where('userId').equals(user.id).toArray();
      const memberGroupIds = memberships.map(m => m.groupId);
      const memberGroups = memberGroupIds.length > 0 
        ? await db.groups.where('id').anyOf(memberGroupIds).toArray()
        : [];
      
      // Combine and deduplicate
      const allGroups = [...ownedGroups];
      memberGroups.forEach(group => {
        if (!allGroups.find(g => g.id === group.id)) {
          allGroups.push(group);
        }
      });
      const groupIds = allGroups.map(g => g.id);

      // Load expenses for current month
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);

      // Load personal expenses
      const personalExpenses = await db.expenses
        .where('[userId+date]')
        .between([user.id, start], [user.id, end])
        .toArray();

      // Load group expenses
      const groupExpenses = groupIds.length > 0
        ? await db.expenses
            .where('groupId')
            .anyOf(groupIds)
            .and((e) => e.date >= start && e.date <= end && !e.deletedAt)
            .toArray()
        : [];

      // Combine expenses and deduplicate
      const allExpenses = [...personalExpenses];
      groupExpenses.forEach(expense => {
        if (!allExpenses.find(e => e.id === expense.id)) {
          allExpenses.push(expense);
        }
      });

      // Filtra solo le spese NON eliminate (deletedAt === undefined)
      const activeExpenses = allExpenses.filter((e) => !e.deletedAt);

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
      
      // Carica statistiche avanzate da Views
      try {
        const summary = await getUserExpenseSummary(user.id);
        if (summary) {
          setTotalExpenses(summary.total_expenses);
          setAvgExpense(summary.avg_expense);
        }
        
        const topCats = await getUserCategoryStats(user.id);
        setTopCategories(topCats.slice(0, 5)); // Top 5 categorie
        
        const comparison = await getCurrentVsPreviousMonth(user.id);
        setPercentageChange(comparison.percentageChange);
      } catch (error) {
        console.error('Error loading aggregated stats:', error);
      }
    };

    loadExpensesAndCategories();
  }, [user]);

  if (!user) {
    return null;
  }

  const dateLocale = language === 'it' ? it : enUS;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('dashboard.greeting').replace('{name}', user.displayName || t('dashboard.welcome'))}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
          </p>
        </div>
        <FloatingActionButton href="/expense/new" label="Add expense" />
      </div>

        {/* Summary Card - Simplified for Mobile */}
        <Card 
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 hover:shadow-lg transition-all cursor-pointer md:cursor-default"
          onClick={() => navigate('/statistics')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{t('dashboard.monthlySummary')}</CardTitle>
              <CardDescription>{format(new Date(), 'MMMM yyyy', { locale: dateLocale })}</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden text-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/statistics');
              }}
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Mobile: Solo spese del mese */}
            <div className="md:hidden">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span>{t('dashboard.expensesThisMonth')}</span>
                  </div>
                  <div className="text-4xl font-bold text-destructive">€{monthlyTotal.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.transactions').replace('{count}', String(expenses.filter(e => e.amount > 0).length))}
                  </p>
                </div>
                <div className="pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>{t('dashboard.tapForStats') || 'Tap per vedere statistiche complete'}</span>
                </div>
              </div>
            </div>

            {/* Desktop: Vista completa */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {/* Expenses */}
              <div className="space-y-2 hover:scale-105 transition-transform">
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

      {/* Statistiche Avanzate - Top Categories - Solo Desktop */}
      {topCategories.length > 0 && (
        <div className="hidden md:grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {/* Top Categories Card */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle>{t('dashboard.topCategories') || 'Top Categorie'}</CardTitle>
              </div>
              <CardDescription>
                {t('dashboard.topCategoriesDesc') || 'Dove spendi di più'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((cat, index) => {
                  const categoryInfo = Array.from(categories.values()).find(c => c.name === cat.category);
                  const percentage = monthlyTotal > 0 ? (cat.total_amount / monthlyTotal * 100) : 0;
                  
                  return (
                    <div key={cat.category} className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{categoryInfo?.icon || '📌'}</span>
                          <span className="font-medium truncate">{cat.category}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {cat.expense_count} {cat.expense_count === 1 ? t('dashboard.expense') : t('dashboard.expenses')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground w-16 text-right">
                            €{cat.total_amount.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Overall Stats Card */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle>{t('dashboard.overallStats') || 'Statistiche Generali'}</CardTitle>
              </div>
              <CardDescription>
                {t('dashboard.overallStatsDesc') || 'Tutte le tue spese'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Total Expenses */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.totalExpenses') || 'Spese Totali'}</p>
                    <p className="text-2xl font-bold">{totalExpenses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Average Expense */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('dashboard.avgExpense') || 'Media per Spesa'}</p>
                    <p className="text-2xl font-bold">€{avgExpense.toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                {/* Month Comparison */}
                {percentageChange !== 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('dashboard.vsLastMonth') || 'vs Mese Scorso'}</p>
                      <p className={`text-xl font-bold ${percentageChange > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                      </p>
                    </div>
                    {percentageChange > 0 ? (
                      <TrendingUp className="h-8 w-8 text-destructive" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Expenses */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 hover:shadow-lg transition-shadow">
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
              className="text-primary hover:text-primary hover:scale-105 transition-transform"
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
              {expenses.slice(0, 3).map((expense, index) => {
                const categoryObj = categories.get(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-right-4"
                    style={{ animationDelay: `${index * 100}ms` }}
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
