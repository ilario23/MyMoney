import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { getDatabase } from "@/lib/db";

import { syncService } from "@/services/sync.service";
import type { CategoryDocType, TransactionDocType } from "@/lib/db-schemas";
import { dbLogger, syncLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CategorySelector } from "@/components/category-selector";
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

export function TransactionForm() {
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
  const [transaction, setTransaction] = useState<TransactionDocType | null>(
    null
  );
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(isEditing);

  // Load categories and transaction (if editing) from Dexie
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

        // Load transaction if editing
        if (isEditing && id) {
          const trans = await db.transactions.get(id);
          if (!trans) {
            setError(t("common.error") || "Transaction not found");
            setIsLoadingTransaction(false);
            return;
          }

          setTransaction(trans);
          setType(trans.type);
          setDescription(trans.description || "");
          setAmount(trans.amount.toString());
          setCategoryId(trans.category_id);
          setDate(trans.date.split("T")[0]);
          setIsLoadingTransaction(false);
        }
      } catch (error) {
        dbLogger.error("Error loading data:", error);
        setIsLoadingTransaction(false);
      }
    };
    loadData();
  }, [user, id, isEditing, t]);

  // Helper: Build grouped category structure (only active categories of selected type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !amount || !categoryId) return;

    setIsLoading(true);
    setError("");

    try {
      const db = getDatabase();

      if (isEditing && transaction) {
        // UPDATE existing transaction
        const updatedTransaction: TransactionDocType = {
          ...transaction,
          type,
          amount: parseFloat(amount),
          category_id: categoryId,
          description,
          date: new Date(date).toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.transactions.put(updatedTransaction);
        syncLogger.success("Transaction updated locally - syncing with server");
      } else {
        // CREATE new transaction
        const newTransaction = {
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

        await db.transactions.put(newTransaction);
        syncLogger.success("Transaction saved locally - syncing with server");
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
        navigate(isEditing ? "/transactions" : "/dashboard");
      }, 2000);
    } catch (error) {
      dbLogger.error("Error saving transaction:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !transaction) return;

    setIsDeleting(true);
    setError("");

    try {
      const db = getDatabase();

      // Soft delete
      await db.transactions.update(transaction.id, {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      syncLogger.success("Transaction deleted locally - syncing with server");

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
        navigate("/transactions");
      }, 2000);
    } catch (error) {
      dbLogger.error("Error deleting transaction:", error);
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
          onClick={() => navigate(isEditing ? "/transactions" : "/dashboard")}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEditing ? "Edit Transaction" : t("transaction.title")}
        </h1>
      </div>

      {isLoadingTransaction && (
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
              ? "✓ Transaction updated! Redirecting..."
              : t("transaction.addSuccess")}
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
            {isEditing ? "Edit Transaction" : t("transaction.newTransaction")}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the transaction details"
              : t("transaction.registerTransaction")}
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
                {t("transaction.description")}
              </label>
              <Input
                placeholder={t("transaction.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("transaction.amount")}
              </label>
              <Input
                type="number"
                placeholder={t("transaction.amountPlaceholder")}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("transaction.category")}
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
                <CategorySelector
                  categories={categories.filter(
                    (c) => !c.deleted_at && c.type === type
                  )}
                  categoryType={type}
                  selectedCategoryId={categoryId || null}
                  onSelectCategory={(catId) => setCategoryId(catId || "")}
                  dialogTitle={
                    isEditing ? "Seleziona categoria" : "Seleziona categoria"
                  }
                  dialogDescription={
                    isEditing
                      ? "Scegli la categoria per questa transazione."
                      : "Scegli la categoria per questa transazione."
                  }
                  selectButtonLabel={"Seleziona"}
                  cancelButtonLabel={"Indietro"}
                  rootCategoryLabel={"Nessuna categoria"}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t("transaction.addHint")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("transaction.date")}
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading || success || isLoadingTransaction}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() =>
                  navigate(isEditing ? "/transactions" : "/dashboard")
                }
                disabled={isLoading || success || isLoadingTransaction}
              >
                {t("transaction.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success || isLoadingTransaction}
                size="lg"
              >
                {isLoading
                  ? t("transaction.saving")
                  : success
                    ? "✓ " + (isEditing ? "Updated" : t("transaction.saved"))
                    : isEditing
                      ? "Update"
                      : t("transaction.addTransaction")}
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
                  disabled={isLoading || success || isLoadingTransaction}
                >
                  <Trash2 className="w-4 h-4" />
                  {t("transaction.delete")}
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t("transaction.deleteConfirmTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("transaction.deleteConfirmMessage")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      {t("transaction.deleteCancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? t("transaction.deleting")
                        : t("transaction.deleteButton")}
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
