import { useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { useRxDB, useRxQuery } from '@/hooks/useRxDB';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export function ExpensesPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const db = useRxDB();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Reactive queries
  const { data: expenseDocs, loading } = useRxQuery(() => 
    user ? db.expenses.find({
      selector: {
        user_id: user.id,
        deleted_at: null
      },
      sort: sortBy === 'date' 
        ? [{ date: sortOrder }] 
        : [{ amount: sortOrder }]
    }) : null
  );
  
  const { data: categoryDocs } = useRxQuery(() =>
    user ? db.categories.find({
      selector: { user_id: user.id, deleted_at: null }
    }) : null
  );
  
  // Convert to plain objects
  const allExpenses = useMemo(() => expenseDocs.map(doc => doc.toJSON()), [expenseDocs]);
  const categories = useMemo(() => {
    const map = new Map();
    categoryDocs.forEach(doc => {
      const data = doc.toJSON();
      map.set(data.id, data);
    });
    return map;
  }, [categoryDocs]);
  
  // Filter expenses by search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return allExpenses;
    
    const query = searchQuery.toLowerCase();
    return allExpenses.filter(expense => {
      const description = expense.description?.toLowerCase() || '';
      const category = categories.get(expense.category_id);
      const categoryName = category?.name?.toLowerCase() || '';
      const amount = expense.amount.toString();
      
      return description.includes(query) || 
             categoryName.includes(query) || 
             amount.includes(query);
    });
  }, [allExpenses, searchQuery, categories]);
  
  if (!user) {
    return null;
  }
  
  const dateLocale = language === 'it' ? it : enUS;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spese</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'spesa' : 'spese'}
          </p>
        </div>
        <FloatingActionButton href="/expense/new" label="Add expense" />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca spese..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              Data
            </Button>
            <Button
              variant={sortBy === 'amount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('amount')}
            >
              Importo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '' : ''}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading') || 'Caricamento...'}</p>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Nessuna spesa trovata' : 'Nessuna spesa'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/expense/new')}>
                Aggiungi la prima spesa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const category = categories.get(expense.category_id);
            
            return (
              <Card
                key={expense.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/expense/${expense.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{category?.icon || ''}</span>
                        <h3 className="font-medium truncate">{expense.description}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{category?.name || 'Senza categoria'}</span>
                        <span></span>
                        <span>{format(new Date(expense.date), 'd MMM yyyy', { locale: dateLocale })}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-xl font-bold ${expense.amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {expense.amount > 0 ? '-' : '+'}{Math.abs(expense.amount).toFixed(2)}
                      </p>
                      {expense.group_id && (
                        <Badge variant="secondary" className="mt-1">
                          Gruppo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
