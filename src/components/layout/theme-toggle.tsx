import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { isDark, setTheme } = useTheme();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="gap-2"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
