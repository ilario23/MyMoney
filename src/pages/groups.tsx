import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { useRxDB, useRxQuery } from "@/hooks/useRxDB";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  UserPlus,
} from "lucide-react";

// Generate random 8-character invite code
const generateInviteCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function GroupsPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const db = useRxDB();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  // Join group states
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Copy code states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Reactive queries
  const { data: groupDocs, loading } = useRxQuery(() =>
    user ? db.groups.find({ selector: { deleted_at: null } }) : null
  );

  const { data: groupMemberDocs } = useRxQuery(() =>
    user
      ? db.group_members.find({
          selector: { user_id: user.id, deleted_at: null },
        })
      : null
  );

  const { data: allMemberDocs } = useRxQuery(() =>
    user ? db.group_members.find({ selector: { deleted_at: null } }) : null
  );

  // Convert to plain objects
  const allGroups = useMemo(() => {
    if (!user || !groupDocs) return [];
    const groups = groupDocs.map((doc) => doc.toJSON());
    const ownedGroups = groups.filter((g) => g.owner_id === user.id);

    // Get member groups
    const memberGroupIds =
      groupMemberDocs?.map((doc) => doc.toJSON().group_id) || [];
    const memberGroups = groups.filter(
      (g) => memberGroupIds.includes(g.id) && g.owner_id !== user.id
    );

    return [...ownedGroups, ...memberGroups];
  }, [groupDocs, groupMemberDocs, user]);

  // Calculate member info for each group
  const groupMembers = useMemo(() => {
    const memberInfo = new Map<string, { count: number; names: string[] }>();
    if (!allMemberDocs) return memberInfo;

    allGroups.forEach((group) => {
      const members = allMemberDocs
        .map((doc) => doc.toJSON())
        .filter((m) => m.group_id === group.id);

      memberInfo.set(group.id, {
        count: members.length,
        names: members.map(() => "Membro"), // Simplified - in real app fetch user names
      });
    });

    return memberInfo;
  }, [allGroups, allMemberDocs]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) {
      setError("Nome gruppo richiesto");
      return;
    }

    try {
      const newGroup = {
        id: crypto.randomUUID(),
        name: newGroupName,
        owner_id: user.id,
        description: newGroupDescription,
        color: "#3B82F6",
        invite_code: generateInviteCode(),
        allow_new_members: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      await db.groups.insert(newGroup);

      setSuccess("Gruppo creato con successo!");
      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateDialog(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      logger.error("Error creating group:", err);
      setError("Errore nella creazione del gruppo");
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode.trim()) {
      setError("Inserisci il codice invito");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const searchCode = joinCode.trim().toUpperCase();

      // Find group by invite code in Supabase
      const { data: groupData, error: fetchError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", searchCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!groupData) {
        setError("Codice invito non valido");
        setIsJoining(false);
        return;
      }

      // Check if group allows new members
      if (!groupData.allow_new_members) {
        setError("Il gruppo non accetta nuovi membri");
        setIsJoining(false);
        return;
      }

      // Check if already member
      const existingMember = await db.group_members
        .findOne({
          selector: {
            group_id: groupData.id,
            user_id: user.id,
            deleted_at: null,
          },
        })
        .exec();

      if (existingMember) {
        setError("Sei gi� membro di questo gruppo");
        setIsJoining(false);
        return;
      }

      // Add member to group_members in Supabase
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          id: crypto.randomUUID(),
          group_id: groupData.id,
          user_id: user.id,
          role: "member",
        });

      if (memberError) throw memberError;

      // Add group to local DB
      await db.groups.insert({
        id: groupData.id,
        name: groupData.name,
        owner_id: groupData.owner_id,
        description: groupData.description,
        color: groupData.color,
        invite_code: groupData.invite_code,
        allow_new_members: groupData.allow_new_members ?? true,
        created_at: groupData.created_at,
        updated_at: groupData.updated_at,
        deleted_at: null,
      });

      // Add group_member to local DB
      await db.group_members.insert({
        id: crypto.randomUUID(),
        group_id: groupData.id,
        user_id: user.id,
        role: "member",
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });

      setSuccess("Aggiunto al gruppo con successo!");
      setJoinCode("");
      setShowJoinDialog(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      logger.error("Error joining group:", err);
      setError("Errore nell'unirsi al gruppo");
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
      logger.error("Error copying code:", err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const doc = await db.groups.findOne({ selector: { id: groupId } }).exec();
      if (!doc) return;

      await doc.patch({ deleted_at: new Date().toISOString() });
      setSuccess("Gruppo eliminato");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      logger.error("Error deleting group:", err);
      setError("Errore nell'eliminazione");
    }
  };

  const handleToggleAllowNewMembers = async (groupId: string) => {
    if (!user) return;
    try {
      const group = allGroups.find((g) => g.id === groupId);
      if (!group || group.owner_id !== user.id) return;

      const doc = await db.groups.findOne({ selector: { id: groupId } }).exec();
      if (!doc) return;

      await doc.patch({
        allow_new_members: !group.allow_new_members,
        updated_at: new Date().toISOString(),
      });

      setSuccess(
        group.allow_new_members
          ? "Gruppo chiuso ai nuovi membri"
          : "Gruppo aperto ai nuovi membri"
      );
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      logger.error("Error toggling allowNewMembers:", err);
      setError("Errore nell'aggiornamento");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Accedi per vedere i gruppi</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("groups.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("groups.description")}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Join Group Dialog */}
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                {t("groups.joinGroup")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("groups.joinGroup")}</DialogTitle>
                <DialogDescription>
                  {t("groups.enterInviteCode")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <label className="text-sm font-medium">
                    {t("groups.inviteCode")}
                  </label>
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
                  {isJoining ? t("common.loading") : t("groups.joinGroup")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Group Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("groups.newGroup")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("groups.createGroup")}</DialogTitle>
                <DialogDescription>{t("groups.description")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {t("groups.groupName")}
                  </label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t("groups.groupName")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {t("groups.groupDescription")}
                  </label>
                  <Input
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder={t("groups.groupDescription")}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full">
                  {t("common.save")}
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
          <AlertDescription className="text-green-800">
            {" "}
            {success}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : allGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">{t("groups.noGroups")}</p>
              <p className="text-muted-foreground mt-1">
                {t("groups.createFirst")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {allGroups.map((group) => {
            const memberInfo = groupMembers.get(group.id);
            const isOwner = group.owner_id === user.id;

            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{group.name}</CardTitle>
                          {isOwner && <Badge variant="secondary">Owner</Badge>}
                        </div>
                        {group.description && (
                          <CardDescription>{group.description}</CardDescription>
                        )}
                        {memberInfo && (
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {memberInfo.count} membri
                            </span>
                          </div>
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
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Eliminare ${group.name}?`)) {
                            handleDeleteGroup(group.id);
                          }
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {/* Invite Code Section (only for owners) */}
                {isOwner && group.invite_code && (
                  <CardContent className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {t("groups.shareInvite")}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAllowNewMembers(group.id)}
                          className="gap-2"
                        >
                          {group.allow_new_members ? " Aperto" : " Chiuso"}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono text-lg tracking-wider">
                          {group.invite_code}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(group.invite_code!)}
                          className="gap-2"
                        >
                          {copiedCode === group.invite_code ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copiato
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copia
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Codice riutilizzabile
                        </Badge>
                        {!group.allow_new_members && (
                          <Badge variant="outline" className="text-xs">
                            Non accetta nuovi membri
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
