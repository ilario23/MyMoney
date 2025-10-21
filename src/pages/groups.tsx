import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db, type Group } from '@/lib/dexie';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Trash2, Edit2, Copy, Check, UserPlus } from 'lucide-react';

// Generate random 8-character invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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
  
  // Join group states
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Copy code states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;
      try {
        setLoading(true);
        
        // Load groups where user is owner
        const ownedGroups = await db.groups.where('ownerId').equals(user.id).toArray();
        
        // Load groups where user is member
        const memberships = await db.groupMembers.where('userId').equals(user.id).toArray();
        const memberGroupIds = memberships.map(m => m.groupId);
        const memberGroups = memberGroupIds.length > 0 
          ? await db.groups.where('id').anyOf(memberGroupIds).toArray()
          : [];
        
        // Combine and deduplicate (in case user is both owner and member)
        const allGroups = [...ownedGroups];
        memberGroups.forEach(group => {
          if (!allGroups.find(g => g.id === group.id)) {
            allGroups.push(group);
          }
        });
        
        setGroups(allGroups);
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
        inviteCode: generateInviteCode(), // Generate invite code
        isSynced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.groups.add(newGroup);
      setGroups([...groups, newGroup]);
      
      // Sync immediately to Supabase if online
      if (navigator.onLine && user) {
        try {
          const { syncService } = await import('@/services/sync.service');
          await syncService.sync({ userId: user.id, verbose: true });
          console.log('✅ Group synced to Supabase with invite code');
        } catch (syncError) {
          console.warn('⚠️ Sync failed, will retry later:', syncError);
        }
      }
      
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

  const handleJoinGroup = async () => {
    if (!user || !joinCode.trim()) {
      setError(t('groups.enterInviteCode'));
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const searchCode = joinCode.trim().toUpperCase();
      console.log('🔍 Searching for invite code:', searchCode);
      
      // Find group by invite code in Supabase
      const { data: groupData, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', searchCode)
        .maybeSingle();

      console.log('📦 Group data:', groupData);
      console.log('❌ Fetch error:', fetchError);

      if (fetchError) {
        console.error('Error fetching group:', fetchError);
        throw fetchError;
      }

      if (!groupData) {
        console.warn('⚠️ No group found with code:', searchCode);
        setError(t('groups.invalidCode'));
        setIsJoining(false);
        return;
      }

      console.log('✅ Found group:', groupData.name, 'Code:', groupData.invite_code);

      // Check if code already used
      if (groupData.used_by_user_id) {
        console.warn('⚠️ Code already used by:', groupData.used_by_user_id);
        setError(t('groups.codeAlreadyUsed'));
        setIsJoining(false);
        return;
      }

      // Check if already member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        setError(t('groups.alreadyMember'));
        setIsJoining(false);
        return;
      }

      // Add member to group_members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          id: crypto.randomUUID(),
          group_id: groupData.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Mark invite code as used
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          used_by_user_id: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', groupData.id);

      if (updateError) throw updateError;

      // Add group to local DB
      const localGroup: Group = {
        id: groupData.id,
        name: groupData.name,
        ownerId: groupData.owner_id,
        description: groupData.description,
        color: groupData.color,
        inviteCode: groupData.invite_code,
        usedByUserId: user.id,
        usedAt: new Date(),
        isSynced: true,
        createdAt: new Date(groupData.created_at),
        updatedAt: new Date(groupData.updated_at),
      };

      await db.groups.add(localGroup);
      
      // Add group_member to local DB
      const localMember = {
        id: crypto.randomUUID(),
        groupId: groupData.id,
        userId: user.id,
        role: 'member' as const,
        joinedAt: new Date(),
        isSynced: true,
      };
      
      await db.groupMembers.add(localMember);
      
      setGroups([...groups, localGroup]);

      setSuccess(t('groups.joinSuccess'));
      setJoinCode('');
      setShowJoinDialog(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error joining group:', err);
      setError(t('common.error'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Error copying code:', err);
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
        <div className="flex gap-2">
          {/* Join Group Dialog */}
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                {t('groups.joinGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('groups.joinGroup')}</DialogTitle>
                <DialogDescription>{t('groups.enterInviteCode')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <label className="text-sm font-medium">{t('groups.inviteCode')}</label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123XY"
                    className="mt-1 font-mono text-lg tracking-wider"
                    maxLength={8}
                  />
                </div>
                <Button 
                  onClick={handleJoinGroup} 
                  className="w-full" 
                  disabled={isJoining || !joinCode.trim()}
                >
                  {isJoining ? t('common.loading') : t('groups.joinGroup')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Group Dialog */}
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
              {/* Invite Code Section (only for owners) */}
              {group.ownerId === user.id && group.inviteCode && !group.usedByUserId && (
                <CardContent className="border-t pt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('groups.shareInvite')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono text-lg tracking-wider">
                        {group.inviteCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(group.inviteCode!)}
                        className="gap-2"
                      >
                        {copiedCode === group.inviteCode ? (
                          <>
                            <Check className="w-4 h-4" />
                            {t('groups.codeCopied')}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {t('groups.copyCode')}
                          </>
                        )}
                      </Button>
                    </div>
                    {group.inviteCode && (
                      <Badge variant="secondary" className="text-xs">
                        Single-use • Not used yet
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
              {/* Show if code was used */}
              {group.usedByUserId && (
                <CardContent className="border-t pt-4">
                  <Badge variant="outline" className="text-xs">
                    Invite code used
                  </Badge>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
