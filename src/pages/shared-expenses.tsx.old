import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { useAuthStore } from "@/lib/auth.store";
import { useRxDB, useRxQuery } from "@/hooks/useRxDB";
import type { SharedExpenseDocType } from "@/lib/rxdb-schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Users, Check } from "lucide-react";
import type { ExpenseDocType, GroupDocType } from "@/lib/rxdb-schemas";

export function SharedExpensesPage() {
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const db = useRxDB();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Reactive queries
  const { data: sharedExpenseDocs, loading: loadingExpenses } = useRxQuery(
    () =>
      user ? db.shared_expenses.find({ selector: { deleted_at: null } }) : null
  );

  const { data: expenseDocs } = useRxQuery(() =>
    user
      ? db.expenses.find({ selector: { user_id: user.id, deleted_at: null } })
      : null
  );

  const { data: groupDocs } = useRxQuery(() =>
    user ? db.groups.find({ selector: { deleted_at: null } }) : null
  );

  // Convert to plain objects
  const sharedExpenses = useMemo(
    () => sharedExpenseDocs?.map((doc) => doc.toJSON()) || [],
    [sharedExpenseDocs]
  );

  const expenses = useMemo(() => {
    const map = new Map<string, ExpenseDocType>();
    expenseDocs?.forEach((doc) => {
      const data = doc.toJSON();
      map.set(data.id, data);
    });
    return map;
  }, [expenseDocs]);

  const groups = useMemo(() => {
    const map = new Map<string, GroupDocType>();
    groupDocs?.forEach((doc) => {
      const data = doc.toJSON();
      map.set(data.id, data);
    });
    return map;
  }, [groupDocs]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return sharedExpenses.filter((exp) => {
      if (selectedGroup !== "all" && exp.group_id !== selectedGroup)
        return false;
      if (selectedStatus !== "all") {
        const isSettled = exp.participants.every(
          (p: SharedExpenseDocType["participants"][number]) => p.settled
        );
        if (selectedStatus === "settled" && !isSettled) return false;
        if (selectedStatus === "pending" && isSettled) return false;
      }
      return true;
    });
  }, [sharedExpenses, selectedGroup, selectedStatus]);

  const handleMarkSettled = async (expenseId: string) => {
    if (!user) return;
    try {
      const doc = await db.shared_expenses
        .findOne({ selector: { id: expenseId } })
        .exec();
      if (!doc) return;

      const data = doc.toJSON();
      await doc.patch({
        participants: data.participants.map(
          (p: SharedExpenseDocType["participants"][number]) => ({
            ...p,
            settled: true,
          })
        ),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error marking as settled:", err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("profile.notSet")}</p>
      </div>
    );
  }

  if (loadingExpenses) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("sharedExpenses.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("sharedExpenses.description")}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">
            {t("sharedExpenses.filterByGroup")}
          </label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("sharedExpenses.allGroups")}
              </SelectItem>
              {Array.from(groups.values()).map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">
            {t("sharedExpenses.filterByStatus")}
          </label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">
                {t("sharedExpenses.pending")}
              </SelectItem>
              <SelectItem value="settled">
                {t("sharedExpenses.settled")}
              </SelectItem>
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
              <p className="text-lg font-medium">
                {t("sharedExpenses.noExpenses")}
              </p>
              <p className="text-muted-foreground mt-1">
                {t("sharedExpenses.addToGroup")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExpenses.map((sharedExp) => {
            const isSettled = sharedExp.participants.every(
              (p: SharedExpenseDocType["participants"][number]) => p.settled
            );
            const paidByUser = sharedExp.creator_id === user.id;
            const expense = expenses.get(sharedExp.expense_id);
            const group = groups.get(sharedExp.group_id);

            return (
              <Card
                key={sharedExp.id}
                className={isSettled ? "opacity-60" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {expense?.description || "Expense"}
                        {isSettled && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {group?.name}{" "}
                        {expense?.date
                          ? new Date(expense.date).toLocaleDateString(
                              language === "it" ? "it-IT" : "en-US"
                            )
                          : ""}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {expense?.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sharedExp.participants.length}{" "}
                        {t("sharedExpenses.participants")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Participants */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t("sharedExpenses.participants")}
                    </p>
                    <div className="space-y-1">
                      {sharedExp.participants.map(
                        (
                          participant: SharedExpenseDocType["participants"][number],
                          idx: number
                        ) => (
                          <div
                            key={idx}
                            className="text-sm flex justify-between"
                          >
                            <span>
                              {participant.user_id === user.id
                                ? "Tu"
                                : "Membro"}
                              {paidByUser && participant.user_id === user.id
                                ? " (Pagato)"
                                : ""}
                            </span>
                            <span>{participant.amount.toFixed(2)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span
                      className={`text-sm font-medium ${
                        isSettled ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {isSettled
                        ? t("sharedExpenses.settled")
                        : t("sharedExpenses.pending")}
                    </span>
                    {!isSettled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkSettled(sharedExp.id)}
                      >
                        {t("sharedExpenses.markSettled")}
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
