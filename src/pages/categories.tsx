import { useMemo } from "react";
import { useAuthStore } from "@/lib/auth.store";
import { useRxDB, useRxQuery } from "@/hooks/useRxDB";
import { Card, CardContent } from "@/components/ui/card";
export function CategoriesPage() {
  const { user } = useAuthStore();
  const db = useRxDB();
  const { data: categoryDocs } = useRxQuery(() =>
    user
      ? db.categories.find({ selector: { user_id: user.id, deleted_at: null } })
      : null
  );
  const categories = useMemo(
    () => categoryDocs?.map((doc) => doc.toJSON()) || [],
    [categoryDocs]
  );
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <h1 className="text-3xl font-bold">Categorie</h1>
      <div className="grid gap-4">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <span className="font-medium">{cat.name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
