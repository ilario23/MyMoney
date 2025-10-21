import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import { BarChart3, ShoppingCart, Layers, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import packageJson from '../../../package.json';

const navItems = [
  { id: 'dashboard', path: '/dashboard', icon: BarChart3, labelKey: 'nav.dashboard' as const },
  { id: 'expenses', path: '/expenses', icon: ShoppingCart, labelKey: 'nav.expenses' as const },
  { id: 'categories', path: '/categories', icon: Layers, labelKey: 'nav.categories' as const },
  { id: 'groups', path: '/groups', icon: Users, labelKey: 'nav.groups' as const },
  { id: 'sharedExpenses', path: '/shared-expenses', icon: Users, labelKey: 'nav.sharedExpenses' as const },
  { id: 'profile', path: '/profile', icon: User, labelKey: 'nav.profile' as const },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-muted/30 flex-col px-4 py-6">
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-border text-xs text-muted-foreground">
          <p>Spendix v{packageJson.version}</p>
          <p className="mt-1">PWA • Offline Ready</p>
        </div>
      </aside>
    </>
  );
}
