import { useAuthStore } from "@/lib/auth.store";
import { useRxQuery } from "@/hooks/useRxDB";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryDocType } from "@/lib/db-schemas";

export function CategoriesPage() {
  const { user } = useAuthStore();

  const { data: categoryDocs } = useRxQuery(
    (table) =>
      user
        ? table
            .where("user_id")
            .equals(user.id)
            .filter((cat: CategoryDocType) => !cat.deleted_at)
        : Promise.resolve([]),
    "categories"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <h1 className="text-3xl font-bold">Categorie</h1>
      <div className="grid gap-4">
        {categoryDocs.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: cat.color || "#ccc" }}
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
