import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db } from '@/lib/dexie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import type { Category } from '@/lib/dexie';

const CATEGORY_ICONS = ['🍕', '🚗', '🏠', '🎬', '💊', '🛍️', '⚡', '📌', '🎮', '📚', '✈️', '🎵', '⚽', '🎨', '📖', '🍎'];
const CATEGORY_COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6', '#6B7280'];

export function CategoriesPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const userCategories = await db.categories.where('userId').equals(user.id).toArray();
        setCategories(userCategories);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(t('categories.usedError'));
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, [user]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError(t('categories.categoryName'));
      return;
    }

    if (newCategoryName.length < 2) {
      setError(t('categories.minCharsError'));
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
      setError(t('categories.duplicateError'));
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      if (!user) return;

      const newCategory: Category = {
        id: uuidv4(),
        userId: user.id,
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
        isSynced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.categories.add(newCategory);
      setCategories([...categories, newCategory]);
      setSuccess(t('categories.createSuccess'));
      setNewCategoryName('');
      setNewCategoryIcon('📌');
      setNewCategoryColor('#3B82F6');
      setOpenCreateDialog(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating category:', err);
      setError(t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCategory = async (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setEditColor(category.color);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editName.trim()) {
      setError(t('categories.minCharsError'));
      return;
    }

    if (editName.length < 2) {
      setError(t('categories.minCharsError'));
      return;
    }

    if (categories.some((c) => c.id !== categoryId && c.name.toLowerCase() === editName.toLowerCase())) {
      setError(t('categories.duplicateError'));
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const updated = categories.find((c) => c.id === categoryId);
      if (!updated) return;

      updated.name = editName;
      updated.icon = editIcon;
      updated.color = editColor;
      updated.isSynced = false;
      updated.updatedAt = new Date();

      await db.categories.put(updated);
      setCategories([...categories]);
      setSuccess(t('categories.updateSuccess'));
      setEditingId(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(t('common.error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setError('');
    try {
      // Check if category is used
      const expenses = await db.expenses
        .where('userId')
        .equals(user?.id || '')
        .toArray();

      const isUsed = expenses.some((e) => {
        const cat = categories.find((c) => c.id === categoryId);
        return e.category === cat?.name;
      });

      if (isUsed) {
        setError(t('categories.usedError'));
        return;
      }

      await db.categories.delete(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
      setSuccess(t('categories.deleteSuccess'));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(t('common.error'));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('categories.title')}</h1>
          <p className="text-muted-foreground">{t('categories.description')}</p>
        </div>
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('categories.newCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('categories.createCategory')}</DialogTitle>
              <DialogDescription>{t('categories.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('categories.categoryName')}</label>
                <Input
                  placeholder="Es. Alimentari"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('categories.icon')}</label>
                <div className="grid grid-cols-8 gap-2">
                  {CATEGORY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`p-2 text-2xl border rounded-lg transition-colors ${
                        newCategoryIcon === icon ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('categories.color')}</label>
                <div className="grid grid-cols-8 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      style={{ backgroundColor: color }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        newCategoryColor === color ? 'border-black scale-110' : 'border-transparent'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateCategory} disabled={isCreating} className="w-full">
                {isCreating ? t('common.loading') : t('categories.createCategory')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">✓ {success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('categories.totalCategories')}</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t('categories.toSync')}</p>
              <p className="text-3xl font-bold">{categories.filter((c) => !c.isSynced).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t('categories.title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('categories.description')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="relative">
              <CardContent className="pt-6">
                {editingId === category.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome categoria"
                      disabled={isUpdating}
                    />

                    <div className="grid grid-cols-8 gap-2">
                      {CATEGORY_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setEditIcon(icon)}
                          className={`p-2 text-2xl border rounded-lg transition-colors ${
                            editIcon === icon ? 'bg-primary text-white border-primary' : 'bg-background border-border'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-8 gap-2">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          style={{ backgroundColor: color }}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            editColor === color ? 'border-black scale-110' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleSaveEdit(category.id)}
                        disabled={isUpdating}
                      >
                        <Save className="w-4 h-4" />
                        {t('categories.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => setEditingId(null)}
                        disabled={isUpdating}
                      >
                        <X className="w-4 h-4" />
                        {t('categories.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(category.updatedAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>

                    <div className="flex gap-2">
                      {!category.isSynced && <Badge variant="outline">{t('categories.notSynced')}</Badge>}
                      {category.isSynced && <Badge variant="secondary">{t('categories.synced')}</Badge>}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                        {t('categories.edit')}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1 gap-2">
                            <Trash2 className="w-4 h-4" />
                            {t('categories.delete')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('categories.deleteCategory')}</DialogTitle>
                            <DialogDescription>
                              {t('categories.confirmDelete').replace('{name}', category.name)}
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            {t('categories.deleteConfirmation')}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">{t('categories.categoryInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>• <strong>{t('categories.personal')}</strong></p>
          <p>• <strong>{t('categories.local')}</strong></p>
          <p>• <strong>{t('categories.syncable')}</strong></p>
          <p>• <strong>{t('categories.usedWarning')}</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}
