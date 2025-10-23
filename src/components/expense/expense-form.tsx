import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth.store";
import { useLanguage } from "@/lib/language";
import { getDatabase } from "@/lib/db";
import type { CategoryDocType } from "@/lib/db-schemas";
import { dbLogger, syncLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react";
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
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Zap } from "lucide-react";

export function ExpenseForm() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
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

  // Helper: Render icon from name
  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-4 h-4" />;
    }
    return <IconComponent className="w-4 h-4" />;
  };

  // Load categories from Dexie
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
      } catch (error) {
        dbLogger.error("Error loading data:", error);
      }
    };
    loadData();
  }, [user]);

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

      const expense = {
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

      await db.expenses.put(expense);

      syncLogger.success("Expense saved - will sync automatically");

      setSuccess(true);
      // Reset form
      setDescription("");
      setAmount("");
      setCategoryId("");
      setDate(new Date().toISOString().split("T")[0]);

      // Redirect after 2s (give time to read any error message)
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      dbLogger.error("Error adding expense:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
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
          onClick={() => navigate("/dashboard")}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">{t("expense.title")}</h1>
      </div>

      {success && (
        <Alert className="border border-primary/30 bg-primary/10">
          <AlertDescription className="text-primary font-medium">
            {t("expense.addSuccess")}
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
            {t("expense.newTransaction")}
          </CardTitle>
          <CardDescription>{t("expense.registerExpense")}</CardDescription>
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
                >
                  <TrendingDown className="w-4 h-4" />
                  Expense
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
                >
                  <TrendingUp className="w-4 h-4" />
                  Income
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
                >
                  <Zap className="w-4 h-4" />
                  Investment
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
                disabled={isLoading || success}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isLoading || success}
              >
                {t("expense.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || success} size="lg">
                {isLoading
                  ? t("expense.saving")
                  : success
                    ? t("expense.saved")
                    : t("expense.addExpense")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
