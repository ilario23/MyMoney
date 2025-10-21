import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguage } from '@/lib/language';
import { db } from '@/lib/dexie';
import { syncService } from '@/services/sync.service';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Edit2, Save, X, Search, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { Category, Expense } from '@/lib/dexie';

const CATEGORY_ICONS = ['🍕', '🚗', '🏠', '🎬', '💊', '🛍️', '⚡', '📌', '🎮', '📚', '✈️', '🎵', '⚽', '🎨', '📖', '🍎'];
const CATEGORY_COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6', '#6B7280'];

export function CategoriesPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Tree view states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expenseStats, setExpenseStats] = useState<Map<string, {count: number; total: number}>>(new Map());

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteWarnings, setDeleteWarnings] = useState<{hasChildren: boolean; hasExpenses: boolean; childCount: number; expenseCount: number}>({ hasChildren: false, hasExpenses: false, childCount: 0, expenseCount: 0 });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const userCategories = await db.categories.where('userId').equals(user.id).toArray();
        const expenses = await db.expenses.where('userId').equals(user.id).toArray();
        
        // Build expense statistics per category
        const stats = new Map<string, {count: number; total: number}>();
        expenses.forEach((expense: Expense) => {
          const category = userCategories.find(c => c.name === expense.category);
          if (!category) return;
          
          const existing = stats.get(category.id) || { count: 0, total: 0 };
          stats.set(category.id, {
            count: existing.count + 1,
            total: existing.total + Math.abs(expense.amount)
          });
        });
        
        setCategories(userCategories);
        setFilteredCategories(userCategories);
        setExpenseStats(stats);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(t('categories.usedError'));
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, [user]);

  // Filter categories based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  // Helper: Build category tree structure
  const buildCategoryTree = () => {
    const topLevel = filteredCategories.filter((c) => !c.parentId);
    const childrenMap = new Map<string, Category[]>();
    
    filteredCategories.forEach((category) => {
      if (category.parentId) {
        const siblings = childrenMap.get(category.parentId) || [];
        siblings.push(category);
        childrenMap.set(category.parentId, siblings);
      }
    });
    
    return { topLevel, childrenMap };
  };

  // Helper: Check for circular references
  const wouldCreateCircularRef = (categoryId: string, newParentId: string | undefined): boolean => {
    if (!newParentId) return false;
    
    let currentId: string | undefined = newParentId;
    const visited = new Set<string>();
    
    while (currentId) {
      if (currentId === categoryId) return true;
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      
      const parent = categories.find((c) => c.id === currentId);
      currentId = parent?.parentId;
    }
    
    return false;
  };

  // Helper: Toggle expand/collapse
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Helper: Toggle isActive
  const toggleActive = async (categoryId: string) => {
    try {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      const updated = { ...category, isActive: !category.isActive, isSynced: false, updatedAt: new Date() };
      await db.categories.put(updated);
      setCategories(categories.map((c) => (c.id === categoryId ? updated : c)));

      // Sync
      if (navigator.onLine && user) {
        try {
          await syncService.sync({ userId: user.id, verbose: true });
        } catch (syncError) {
          console.warn('⚠️ Sync failed, will retry later:', syncError);
        }
      }

      setSuccess(updated.isActive ? 'Category activated' : 'Category deactivated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error toggling active:', err);
      setError(t('common.error'));
    }
  };

  // Helper: Prepare delete with validation
  const prepareDelete = async (category: Category) => {
    try {
      // Check children
      const children = categories.filter((c) => c.parentId === category.id);
      const hasChildren = children.length > 0;

      // Check expenses
      const expenses = await db.expenses.where('userId').equals(user?.id || '').toArray();
      const categoryExpenses = expenses.filter((e) => e.category === category.id);
      const hasExpenses = categoryExpenses.length > 0;

      setDeleteWarnings({
        hasChildren,
        hasExpenses,
        childCount: children.length,
        expenseCount: categoryExpenses.length,
      });

      setCategoryToDelete(category);
      setDeleteDialogOpen(true);
    } catch (err) {
      console.error('Error preparing delete:', err);
      setError(t('common.error'));
    }
  };

  // Helper: Confirm delete with reassignment
  const confirmDelete = async (reassignToParent: boolean) => {
    if (!categoryToDelete) return;

    try {
      const categoryId = categoryToDelete.id;
      const parentId = categoryToDelete.parentId;

      // 1. Reassign children (to grandparent if exists)
      if (deleteWarnings.hasChildren && parentId && reassignToParent) {
        const children = categories.filter((c) => c.parentId === categoryId);
        for (const child of children) {
          const updated = { ...child, parentId, isSynced: false, updatedAt: new Date() };
          await db.categories.put(updated);
        }
        setCategories(categories.map((c) => (c.parentId === categoryId ? { ...c, parentId } : c)));
      } else if (deleteWarnings.hasChildren && !reassignToParent) {
        // Cancel - don't delete
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        return;
      }

      // 2. Reassign expenses (to parent if exists)
      if (deleteWarnings.hasExpenses && parentId && reassignToParent) {
        const expenses = await db.expenses.where('category').equals(categoryId).toArray();
        for (const expense of expenses) {
          const updated = { ...expense, category: parentId, isSynced: false, updatedAt: new Date() };
          await db.expenses.put(updated);
        }
      } else if (deleteWarnings.hasExpenses && !reassignToParent) {
        // Cancel - don't delete
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        return;
      }

      // 3. Delete category
      await db.categories.delete(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));

      // Sync
      if (navigator.onLine && user) {
        try {
          await syncService.sync({ userId: user.id, verbose: true });
        } catch (syncError) {
          console.warn('⚠️ Sync failed, will retry later:', syncError);
        }
      }

      setSuccess(t('categories.deleteSuccess'));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(t('common.error'));
    }
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      setError(t('categories.categoryName'));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t('categories.minCharsError'));
      return;
    }

    // Check for duplicates (case-sensitive, already trimmed)
    if (categories.some((c) => c.name === trimmedName)) {
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
        name: trimmedName,  // Save trimmed name
        icon: newCategoryIcon,
        color: newCategoryColor,
        parentId: newCategoryParentId || undefined,  // Support hierarchical
        isActive: true,  // New categories are active by default
        isSynced: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.categories.add(newCategory);
      setCategories([...categories, newCategory]);
      
      // Sync immediato con Supabase se online
      if (navigator.onLine && user) {
        try {
          await syncService.sync({ userId: user.id, verbose: true });
          console.log('✅ Category synced to Supabase');
        } catch (syncError) {
          console.warn('⚠️ Sync failed, will retry later:', syncError);
        }
      }
      
      setSuccess(t('categories.createSuccess'));
      setNewCategoryName('');
      setNewCategoryIcon('📌');
      setNewCategoryColor('#3B82F6');
      setNewCategoryParentId('');  // Reset parent
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
    setEditParentId(category.parentId || '');
  };

  const handleSaveEdit = async (categoryId: string) => {
    const trimmedName = editName.trim();
    
    if (!trimmedName) {
      setError(t('categories.minCharsError'));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t('categories.minCharsError'));
      return;
    }

    // Check for duplicates (case-sensitive, already trimmed, exclude current)
    if (categories.some((c) => c.id !== categoryId && c.name === trimmedName)) {
      setError(t('categories.duplicateError'));
      return;
    }

    // Check for circular references
    if (editParentId && wouldCreateCircularRef(categoryId, editParentId)) {
      setError('Cannot set parent: would create circular reference');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const updated = categories.find((c) => c.id === categoryId);
      if (!updated) return;

      updated.name = trimmedName;  // Save trimmed name
      updated.icon = editIcon;
      updated.color = editColor;
      updated.parentId = editParentId || undefined;
      updated.isSynced = false;
      updated.updatedAt = new Date();

      await db.categories.put(updated);
      setCategories([...categories]);
      
      // Sync immediato con Supabase se online
      if (navigator.onLine && user) {
        try {
          await syncService.sync({ userId: user.id, verbose: true });
          console.log('✅ Category update synced to Supabase');
        } catch (syncError) {
          console.warn('⚠️ Sync failed, will retry later:', syncError);
        }
      }
      
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Category (Optional)</label>
                <Select value={newCategoryParentId} onValueChange={setNewCategoryParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => !c.parentId).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a parent to create a subcategory
                </p>
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

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('categories.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredCategories.length} of {categories.length} categories
            </p>
          )}
        </CardContent>
      </Card>

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
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No categories found matching your search' : t('categories.title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : t('categories.description')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(() => {
            const { topLevel, childrenMap } = buildCategoryTree();
            
            const renderCategory = (category: Category, depth: number = 0): React.ReactElement => {
              const children = childrenMap.get(category.id) || [];
              const hasChildren = children.length > 0;
              const isExpanded = expandedCategories.has(category.id);
              const stats = expenseStats.get(category.id);
              
              return (
                <div key={category.id} className="space-y-2">
                  <Card className={`relative ${depth > 0 ? 'ml-8' : ''}`}>
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

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Parent Category</label>
                            <Select value={editParentId} onValueChange={setEditParentId}>
                              <SelectTrigger>
                                <SelectValue placeholder="None (Top-level)" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter((c) => c.id !== category.id && !c.parentId)
                                  .map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.icon} {cat.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
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
                              {hasChildren && (
                                <button
                                  onClick={() => toggleExpand(category.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-5 h-5" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                              <span className="text-4xl">{category.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{category.name}</h3>
                                  {stats && (
                                    <Badge variant="outline" className="text-xs">
                                      {stats.count} • €{stats.total.toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
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
                            {!category.isActive && <Badge variant="destructive">Inactive</Badge>}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => toggleActive(category.id)}
                              title={category.isActive ? 'Hide from expense form' : 'Show in expense form'}
                            >
                              {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit2 className="w-4 h-4" />
                              {t('categories.edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 gap-2"
                              onClick={() => prepareDelete(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('categories.delete')}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  {isExpanded && children.length > 0 && (
                    <div className="space-y-2">
                      {children.map((child) => renderCategory(child, depth + 1))}
                    </div>
                  )}
                </div>
              );
            };
            
            return topLevel.map((category) => renderCategory(category, 0));
          })()}
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

      {/* Smart Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category: {categoryToDelete?.name}</DialogTitle>
            <DialogDescription>
              {deleteWarnings.hasChildren || deleteWarnings.hasExpenses
                ? 'This category has dependencies. Choose an action:'
                : 'Are you sure you want to delete this category?'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warnings */}
            {deleteWarnings.hasChildren && (
              <Alert>
                <AlertDescription>
                  ⚠️ <strong>{deleteWarnings.childCount} subcategories</strong> depend on this category.
                </AlertDescription>
              </Alert>
            )}
            {deleteWarnings.hasExpenses && (
              <Alert>
                <AlertDescription>
                  ⚠️ <strong>{deleteWarnings.expenseCount} expenses</strong> are linked to this category.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {(deleteWarnings.hasChildren || deleteWarnings.hasExpenses) && categoryToDelete?.parentId && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => confirmDelete(true)}
                >
                  Reassign to Parent &amp; Delete
                  <p className="text-xs text-muted-foreground mt-1">
                    {deleteWarnings.hasChildren && `Move ${deleteWarnings.childCount} subcategories to grandparent. `}
                    {deleteWarnings.hasExpenses && `Move ${deleteWarnings.expenseCount} expenses to parent.`}
                  </p>
                </Button>
              )}
              
              {!(deleteWarnings.hasChildren || deleteWarnings.hasExpenses) && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => confirmDelete(false)}
                >
                  Delete Category
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </Button>
            </div>

            {/* Info Message */}
            {(deleteWarnings.hasChildren || deleteWarnings.hasExpenses) && !categoryToDelete?.parentId && (
              <Alert variant="destructive">
                <AlertDescription>
                  Cannot delete: This category has no parent to reassign dependencies to.
                  Please reassign subcategories and expenses manually first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
