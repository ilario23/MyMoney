import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { getDatabase } from "@/lib/db";
import { renderIcon } from "@/lib/icon-renderer";
import { syncService } from "@/services/sync.service";
import type { CategoryDocType, ExpenseDocType } from "@/lib/db-schemas";
import { dbLogger, syncLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft,
  Plus,
  TrendingDown,
  TrendingUp,
  Zap,
  Trash2,
} from "lucide-react";

export function ExpenseForm() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [type, setType] = useState<"expense" | "income" | "investment">(
    "expense"
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryDocType[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expense, setExpense] = useState<ExpenseDocType | null>(null);
  const [isLoadingExpense, setIsLoadingExpense] = useState(isEditing);

  // Load categories and expense (if editing) from Dexie
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const db = getDatabase();

        // Load categories
        const userCategories = await db.categories
          .where("user_id")
          .equals(user.id)
          .toArray();
        setCategories(userCategories);

        // Load expense if editing
        if (isEditing && id) {
          const exp = await db.expenses.get(id);
          if (!exp) {
            setError(t("common.error") || "Expense not found");
            setIsLoadingExpense(false);
            return;
          }

          setExpense(exp);
          setType(exp.type);
          setDescription(exp.description || "");
          setAmount(exp.amount.toString());
          setCategoryId(exp.category_id);
          setDate(exp.date.split("T")[0]);
          setIsLoadingExpense(false);
        }
      } catch (error) {
        dbLogger.error("Error loading data:", error);
        setIsLoadingExpense(false);
      }
    };
    loadData();
  }, [user, id, isEditing, t]);

  // Helper: Build grouped category structure (only active categories of selected type)
  const getGroupedCategories = () => {
    const activeCategories = categories.filter(
      (c) => !c.deleted_at && c.type === type
    );
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
    setError("");

    try {
      const db = getDatabase();

      if (isEditing && expense) {
        // UPDATE existing expense
        const updatedExpense: ExpenseDocType = {
          ...expense,
          type,
          amount: parseFloat(amount),
          category_id: categoryId,
          description,
          date: new Date(date).toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.expenses.put(updatedExpense);
        syncLogger.success("Expense updated locally - syncing with server");
      } else {
        // CREATE new expense
        const newExpense = {
          id: uuidv4(),
          user_id: user.id,
          type,
          amount: parseFloat(amount),
          category_id: categoryId,
          description,
          date: new Date(date).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };

        await db.expenses.put(newExpense);
        syncLogger.success("Expense saved locally - syncing with server");
      }

      // Mark that local data has changed (CRUD operation)
      syncService.markLocalChangesAsChanged();

      // Trigger background sync if online (don't wait for it)
      if (syncService.isAppOnline()) {
        syncService.syncAfterChange(user.id).catch((error) => {
          syncLogger.error("Background sync error:", error);
        });
      } else {
        syncLogger.info("Offline - data saved locally, will sync when online");
      }

      setSuccess(true);
      // Reset form
      setDescription("");
      setAmount("");
      setCategoryId("");
      setDate(new Date().toISOString().split("T")[0]);

      // Redirect after 2s (give time to read any error message)
      setTimeout(() => {
        navigate(isEditing ? "/expenses" : "/dashboard");
      }, 2000);
    } catch (error) {
      dbLogger.error("Error saving expense:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !expense) return;

    setIsDeleting(true);
    setError("");

    try {
      const db = getDatabase();

      // Soft delete
      await db.expenses.update(expense.id, {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      syncLogger.success("Expense deleted locally - syncing with server");

      // Mark that local data has changed (CRUD operation)
      syncService.markLocalChangesAsChanged();

      // Trigger background sync if online (don't wait for it)
      if (syncService.isAppOnline()) {
        syncService.syncAfterChange(user.id).catch((error) => {
          syncLogger.error("Background sync error:", error);
        });
      } else {
        syncLogger.info(
          "Offline - data deleted locally, will sync when online"
        );
      }

      setShowDeleteDialog(false);
      setSuccess(true);

      // Redirect after 2s
      setTimeout(() => {
        navigate("/expenses");
      }, 2000);
    } catch (error) {
      dbLogger.error("Error deleting expense:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Error: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(isEditing ? "/expenses" : "/dashboard")}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEditing ? "Edit Expense" : t("expense.title")}
        </h1>
      </div>

      {isLoadingExpense && (
        <Alert className="border border-primary/30 bg-primary/10">
          <AlertDescription className="text-primary font-medium">
            Loading...
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border border-primary/30 bg-primary/10">
          <AlertDescription className="text-primary font-medium">
            {isEditing
              ? "✓ Expense updated! Redirecting..."
              : t("expense.addSuccess")}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border border-destructive/30 bg-destructive/10">
          <AlertDescription className="text-destructive font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isEditing ? "Edit Transaction" : t("expense.newTransaction")}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the transaction details"
              : t("expense.registerExpense")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategoryId("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    type === "expense"
                      ? "bg-destructive text-destructive-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  disabled={isLoading || success}
                  title="Expense"
                >
                  <TrendingDown className="w-4 h-4 flex-shrink-0" />
                  {type === "expense" && (
                    <span className="animate-in fade-in duration-300">
                      Expense
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("income");
                    setCategoryId("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    type === "income"
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  disabled={isLoading || success}
                  title="Income"
                >
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  {type === "income" && (
                    <span className="animate-in fade-in duration-300">
                      Income
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("investment");
                    setCategoryId("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    type === "investment"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  disabled={isLoading || success}
                  title="Investment"
                >
                  <Zap className="w-4 h-4 flex-shrink-0" />
                  {type === "investment" && (
                    <span className="animate-in fade-in duration-300">
                      Investment
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("expense.description")}
              </label>
              <Input
                placeholder={t("expense.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("expense.amount")}
              </label>
              <Input
                type="number"
                placeholder={t("expense.amountPlaceholder")}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("expense.category")}
              </label>
              {categories.length === 0 ? (
                <Alert className="border border-ring bg-muted">
                  <AlertDescription className="text-muted-foreground flex items-center justify-between">
                    <span>No categories yet. Create one first!</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/categories")}
                      className="ml-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create Category
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={isLoading || success}
                >
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
                              <span className="flex items-center gap-2">
                                {renderIcon(parent.icon)} {parent.name}
                              </span>
                            </SelectItem>
                            {/* Child categories (indented) */}
                            {children.map((child) => (
                              <SelectItem
                                key={child.id}
                                value={child.id}
                                className="pl-8"
                              >
                                <span className="flex items-center gap-2">
                                  {renderIcon(child.icon)} {child.name}
                                </span>
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
                {t("expense.addHint")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("expense.date")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading || success || isLoadingExpense}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(isEditing ? "/expenses" : "/dashboard")}
                disabled={isLoading || success || isLoadingExpense}
              >
                {t("expense.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success || isLoadingExpense}
                size="lg"
              >
                {isLoading
                  ? t("expense.saving")
                  : success
                    ? "✓ " + (isEditing ? "Updated" : t("expense.saved"))
                    : isEditing
                      ? "Update"
                      : t("expense.addExpense")}
              </Button>
            </div>

            {/* Delete Button - only show when editing */}
            {isEditing && (
              <Dialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading || success || isLoadingExpense}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Expense
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Expense?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. The expense will be deleted
                      from your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
