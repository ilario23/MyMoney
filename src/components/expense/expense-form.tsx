import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { getDatabase } from '@/lib/rxdb';
import type { CategoryDocType, GroupDocType } from '@/lib/rxdb-schemas';
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
import { ArrowLeft, Plus } from 'lucide-react';

export function ExpenseForm() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupId, setGroupId] = useState<string>('personal'); // 'personal' or group UUID
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryDocType[]>([]);
  const [groups, setGroups] = useState<GroupDocType[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load custom categories and groups from RxDB
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const db = getDatabase();
        
        // Load categories
        const userCategories = await db.categories
          .find({ selector: { user_id: user.id, deleted_at: null } })
          .exec();
        setCategories(userCategories.map(c => c.toJSON()));

        // Load groups where user is owner
        const ownedGroups = await db.groups
          .find({ selector: { owner_id: user.id, deleted_at: null } })
          .exec();
        
        // Load groups where user is member
        const memberships = await db.group_members
          .find({ selector: { user_id: user.id, deleted_at: null } })
          .exec();
        const memberGroupIds = memberships.map(m => m.group_id);
        
        const memberGroups = memberGroupIds.length > 0 
          ? await db.groups
              .find({ 
                selector: { 
                  id: { $in: memberGroupIds },
                  deleted_at: null 
                } 
              })
              .exec()
          : [];
        
        // Combine and deduplicate
        const allGroups = [...ownedGroups];
        memberGroups.forEach(group => {
          if (!allGroups.find(g => g.id === group.id)) {
            allGroups.push(group);
          }
        });
        
        setGroups(allGroups.map(g => g.toJSON()));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user]);

  // Helper: Build grouped category structure (only active categories)
  // Filter by selected group: personal categories for personal expenses, group categories for group expenses
  const getGroupedCategories = () => {
    let activeCategories = categories.filter((c) => !c.deleted_at); // Show only active
    
    // Filter by expense type
    if (groupId === 'personal') {
      // Personal expense: show only personal categories (no group_id)
      activeCategories = activeCategories.filter(c => !c.group_id);
    } else {
      // Group expense: show both personal and that group's categories
      activeCategories = activeCategories.filter(c => !c.group_id || c.group_id === groupId);
    }
    
    const topLevel = activeCategories.filter((c) => !c.parent_id);
    const childrenMap = new Map<string, CategoryDocType[]>();
    
    // Group children by parent
    activeCategories.forEach((cat) => {
      if (cat.parent_id) {
        if (!childrenMap.has(cat.parent_id)) {
          childrenMap.set(cat.parent_id, []);
        }
        childrenMap.get(cat.parent_id)!.push(cat);
      }
    });
    
    return { topLevel, childrenMap };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !amount || !categoryId) return;

    setIsLoading(true);
    setError('');

    try {
      const db = getDatabase();
      
      const expense = {
        id: uuidv4(),
        user_id: user.id,
        group_id: groupId === 'personal' ? null : groupId,
        amount: parseFloat(amount),
        category_id: categoryId,
        description,
        date: new Date(date).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      await db.expenses.insert(expense);

      // Sync happens automatically via RxDB replication
      console.log('✅ Expense saved - will sync automatically');

      setSuccess(true);
      // Reset form
      setDescription('');
      setAmount('');
      setCategoryId('');
      setGroupId('personal');
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

            {groups.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('expense.group')}</label>
                <Select value={groupId} onValueChange={setGroupId} disabled={isLoading || success}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('expense.personalExpense')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">{t('expense.personalExpense')}</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('expense.category')}</label>
              {categories.length === 0 ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800 flex items-center justify-between">
                    <span>No categories yet. Create one first!</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/categories')}
                      className="ml-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create Category
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading || success}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const { topLevel, childrenMap } = getGroupedCategories();
                      return topLevel.map((parent) => {
                        const children = childrenMap.get(parent.id) || [];
                        return (
                          <div key={parent.id}>
                            {/* Parent category */}
                            <SelectItem value={parent.id}>
                              {parent.icon} {parent.name}
                            </SelectItem>
                            {/* Child categories (indented) */}
                            {children.map((child) => (
                              <SelectItem key={child.id} value={child.id} className="pl-8">
                                {child.icon} {child.name}
                              </SelectItem>
                            ))}
                          </div>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              )}
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
