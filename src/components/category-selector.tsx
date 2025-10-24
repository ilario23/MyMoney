import { useState, useEffect } from "react";
// Hook per sapere se siamo su desktop (md breakpoint)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ParentCategoryWizard } from "@/components/parent-category-wizard";
import { ChevronRight } from "lucide-react";
import type { CategoryDocType } from "@/lib/db-schemas";

interface CategorySelectorProps {
  categories: CategoryDocType[];
  categoryType: "expense" | "income" | "investment";
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  currentEditingCategoryId?: string;
  dialogTitle: string;
  dialogDescription: string;
  selectButtonLabel: string;
  cancelButtonLabel: string;
  rootCategoryLabel: string;
}

export function CategorySelector({
  categories,
  categoryType,
  selectedCategoryId,
  onSelectCategory,
  currentEditingCategoryId,
  dialogTitle,
  dialogDescription,
  selectButtonLabel,
  cancelButtonLabel,
  rootCategoryLabel,
}: CategorySelectorProps) {
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const [navigationStack, setNavigationStack] = useState<(string | null)[]>([
    null,
  ]);

  const handleClose = () => {
    setIsOpen(false);
    setNavigationStack([null]); // Reset on close
  };

  const handleSelect = (categoryId: string | null) => {
    onSelectCategory(categoryId);
    handleClose();
  };

  const selectedCategoryName =
    selectedCategoryId === null
      ? rootCategoryLabel
      : categories.find((c) => c.id === selectedCategoryId)?.name ||
        rootCategoryLabel;

  // Dialog Content Component
  const DialogContentComponent = () => (
    <div className="flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <ParentCategoryWizard
          categories={categories}
          categoryType={categoryType}
          currentEditingCategoryId={currentEditingCategoryId}
          onSelectCategory={handleSelect}
          showActions={false}
          navigationStack={navigationStack}
          onNavigationStackChange={setNavigationStack}
        />
      </div>
      <DialogFooter className="pt-4 border-t px-4">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => setNavigationStack(navigationStack.slice(0, -1))}
            className="flex-1"
            disabled={navigationStack.length <= 1}
          >
            {cancelButtonLabel}
          </Button>
          <Button
            onClick={() => {
              const currentLevel = navigationStack[navigationStack.length - 1];
              handleSelect(currentLevel);
            }}
            className="flex-1"
          >
            {selectButtonLabel}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsOpen(true)}
            >
              <span>{selectedCategoryName}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <DialogContent className="max-w-2xl max-h-[80vh] flex-col">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            <DialogContentComponent />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(true)}
          >
            <span>{selectedCategoryName}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <DrawerContent className="flex flex-col max-h-[90vh] min-h-[60vh]">
            <DrawerHeader>
              <DrawerTitle>{dialogTitle}</DrawerTitle>
              <DrawerDescription>{dialogDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <ParentCategoryWizard
                categories={categories}
                categoryType={categoryType}
                currentEditingCategoryId={currentEditingCategoryId}
                onSelectCategory={handleSelect}
                showActions={false}
                navigationStack={navigationStack}
                onNavigationStackChange={setNavigationStack}
              />
            </div>
            <DrawerFooter className="pt-4 pb-6 px-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setNavigationStack(navigationStack.slice(0, -1))
                  }
                  className="flex-1"
                  disabled={navigationStack.length <= 1}
                >
                  {cancelButtonLabel}
                </Button>
                <Button
                  onClick={() => {
                    const currentLevel =
                      navigationStack[navigationStack.length - 1];
                    handleSelect(currentLevel);
                  }}
                  className="flex-1"
                >
                  {selectButtonLabel}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
