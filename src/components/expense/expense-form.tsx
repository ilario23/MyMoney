import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db } from '@/lib/dexie';
import { syncService } from '@/services/sync.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft } from 'lucide-react';

export function ExpenseForm() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('EUR');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load custom categories from Dexie
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return;
      try {
        const userCategories = await db.categories.where('userId').equals(user.id).toArray();
        const categoryNames = userCategories.map((c) => c.name);
        setCategories(categoryNames);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !amount) return;

    setIsLoading(true);
    setError('');

    try {
      const expense = {
        id: uuidv4(),
        userId: user.id,
        amount: parseFloat(amount),
        currency,
        category,
        description,
        date: new Date(date),
        isSynced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.expenses.add(expense);

      // Sync immediato con Supabase se online
      if (navigator.onLine) {
        try {
          const syncResult = await syncService.sync({ userId: user.id, verbose: true });
          
          if (syncResult.success) {
            console.log('✅ Expense synced to Supabase');
          } else {
            console.warn(`⚠️ Sync completed with issues: ${syncResult.failed} failed, ${syncResult.conflicts} conflicts`);
            setError(`Sync error: ${syncResult.failed} failed, will retry later`);
          }
        } catch (syncError) {
          console.error('❌ Sync error:', syncError);
          setError('Sync failed - changes saved locally, will sync when online');
        }
      } else {
        console.log('📡 Offline - expense saved locally, will sync when online');
        setError('You are offline - expense will sync when back online');
      }

      setSuccess(true);
      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);

      // Redirect after 2s (give time to read any error message)
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{t('expense.title')}</h1>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {t('expense.addSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('expense.newTransaction')}</CardTitle>
          <CardDescription>{t('expense.registerExpense')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('expense.description')}</label>
              <Input
                placeholder={t('expense.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('expense.amount')}</label>
                <Input
                  type="number"
                  placeholder={t('expense.amountPlaceholder')}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('expense.currency')}</label>
                <Select value={currency} onValueChange={setCurrency} disabled={isLoading || success}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('expense.category')}</label>
              <Select value={category} onValueChange={setCategory} disabled={isLoading || success}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('expense.addHint')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('expense.date')}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading || success}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isLoading || success}
              >
                {t('expense.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || success} size="lg">
                {isLoading ? t('expense.saving') : success ? t('expense.saved') : t('expense.addExpense')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
