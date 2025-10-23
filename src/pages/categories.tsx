import { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useQuery } from "@/hooks/useQuery";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, X } from "lucide-react";
import type { CategoryDocType } from "@/lib/db-schemas";
import { getDatabase } from "@/lib/db";

export function CategoriesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "📂",
    color: "#3B82F6",
  });

  const { data: categoryDocs } = useQuery(
    useCallback(
      (table: any) =>
        user
          ? table
              .where("user_id")
              .equals(user.id)
              .filter((cat: CategoryDocType) => !cat.deleted_at)
          : Promise.resolve([]),
      [user?.id]
    ),
    "categories"
  );

  const handleAddCategory = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const db = getDatabase();
      await db.categories.add({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        is_custom: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });

      setFormData({ name: "", icon: "📂", color: "#3B82F6" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (confirm("Elimina questa categoria?")) {
      try {
        const db = getDatabase();
        await db.categories.update(catId, {
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <h1 className="text-3xl font-bold">Categorie</h1>

      {showForm && (
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nuova Categoria</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome</label>
                <Input
                  placeholder="Es: Cibo, Trasporto..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Emoji</label>
                <Input
                  placeholder="Es: 🍔 🚗 ✈️"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  maxLength={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Colore</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground self-center">
                    {formData.color}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAddCategory}
                  className="flex-1"
                  disabled={!formData.name.trim()}
                >
                  Crea Categoria
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {categoryDocs.map((cat) => (
          <Card
            key={cat.id}
            className="hover:shadow-md transition-all cursor-pointer group"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: cat.color || "#ccc" }}
                  >
                    {cat.icon}
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </div>
                {cat.is_custom && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FloatingActionButton
        onClick={() => setShowForm(true)}
        label="Add category"
      />
    </div>
  );
}
