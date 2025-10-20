import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language';
import { useAuthStore } from '@/lib/auth.store';
import { db, type Expense, type SharedExpense, type Group } from '@/lib/dexie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Users, Check } from 'lucide-react';

export function SharedExpensesPage() {
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState<
    (SharedExpense & { expense?: Expense; group?: Group })[]
  >([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load shared expenses
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Load all groups first
        const allGroups = await db.groups.toArray();
        setGroups(allGroups);

        // Load shared expenses
        const sharedExpenses = await db.sharedExpenses.toArray();
        
        // Enrich with expense and group data
        const enrichedExpenses = await Promise.all(
          sharedExpenses.map(async (se) => {
            const expense = await db.expenses.get(se.expenseId);
            const group = await db.groups.get(se.groupId);
            return { ...se, expense, group };
          })
        );

        setExpenses(enrichedExpenses);
      } catch (err) {
        console.error('Error loading shared expenses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, [user]);

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedGroup !== 'all' && exp.groupId !== selectedGroup) return false;
    if (selectedStatus !== 'all') {
      const isSettled = exp.participants.every((p) => p.settled);
      if (selectedStatus === 'settled' && !isSettled) return false;
      if (selectedStatus === 'pending' && isSettled) return false;
    }
    return true;
  });

  const handleMarkSettled = async (expenseId: string) => {
    try {
      const expense = expenses.find((e) => e.id === expenseId);
      if (!expense) return;

      // Update all participants as settled
      const updated = {
        ...expense,
        participants: expense.participants.map((p) => ({ ...p, settled: true })),
        updatedAt: new Date(),
        isSynced: false,
      };

      await db.sharedExpenses.update(expenseId, {
        participants: updated.participants,
        updatedAt: updated.updatedAt,
        isSynced: updated.isSynced,
      });

      setExpenses(
        expenses.map((e) => (e.id === expenseId ? updated : e))
      );
    } catch (err) {
      console.error('Error marking as settled:', err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('profile.notSet')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('sharedExpenses.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('sharedExpenses.description')}</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">{t('sharedExpenses.filterByGroup')}</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sharedExpenses.allGroups')}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">{t('sharedExpenses.filterByStatus')}</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">{t('sharedExpenses.pending')}</SelectItem>
              <SelectItem value="settled">{t('sharedExpenses.settled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">{t('sharedExpenses.noExpenses')}</p>
              <p className="text-muted-foreground mt-1">
                {t('sharedExpenses.addToGroup')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map((sharedExp) => {
            const isSettled = sharedExp.participants.every((p) => p.settled);
            const paidByUser = sharedExp.creatorId === user.id;

            return (
              <Card key={sharedExp.id} className={isSettled ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {sharedExp.expense?.description || 'Expense'}
                        {isSettled && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {sharedExp.group?.name} •{' '}
                        {sharedExp.expense?.date.toLocaleDateString(
                          language === 'it' ? 'it-IT' : 'en-US'
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        €{sharedExp.expense?.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sharedExp.participants.length} {t('sharedExpenses.participants')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Participants */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('sharedExpenses.participants')}
                    </p>
                    <div className="space-y-1">
                      {sharedExp.participants.map((participant, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>
                            {participant.userId === user.id ? 'You' : 'Member'}
                            {paidByUser && participant.userId === user.id ? ' (Paid)' : ''}
                          </span>
                          <span>€{participant.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className={`text-sm font-medium ${
                      isSettled ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {isSettled ? t('sharedExpenses.settled') : t('sharedExpenses.pending')}
                    </span>
                    {!isSettled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkSettled(sharedExp.id)}
                      >
                        {t('sharedExpenses.markSettled')}
                      </Button>
                    )}
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
