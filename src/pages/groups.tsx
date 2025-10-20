import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Group } from '@/lib/dexie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';

export function GroupsPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const userGroups = await db.groups.where('ownerId').equals(user.id).toArray();
        setGroups(userGroups);
      } catch (err) {
        console.error('Error loading groups:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user, t]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) {
      setError(t('groups.minCharsError'));
      return;
    }

    try {
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name: newGroupName,
        ownerId: user.id,
        description: newGroupDescription,
        color: '#3B82F6',
        isSynced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.groups.add(newGroup);
      setGroups([...groups, newGroup]);
      setSuccess(t('groups.createSuccess'));
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateDialog(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(t('common.error'));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await db.groups.delete(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      setSuccess(t('groups.deleteSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(t('common.error'));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('profile.notSet')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('groups.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('groups.description')}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('groups.newGroup')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('groups.createGroup')}</DialogTitle>
              <DialogDescription>{t('groups.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('groups.groupName')}</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t('groups.groupName')}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('groups.groupDescription')}</label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder={t('groups.groupDescription')}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">✓ {success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">{t('groups.noGroups')}</p>
              <p className="text-muted-foreground mt-1">{t('groups.createFirst')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription>{group.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            t('groups.confirmDelete').replace('{name}', group.name)
                          )
                        ) {
                          handleDeleteGroup(group.id);
                        }
                      }}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
