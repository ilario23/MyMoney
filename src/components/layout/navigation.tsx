import { useLocation, Link } from 'react-router-dom';
import { Home, Plus, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/expense/new', icon: Plus, label: 'Nuova' },
  { path: '/groups', icon: Users, label: 'Gruppi' },
  { path: '/profile', icon: Settings, label: 'Profilo' },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:hidden">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full flex-col h-16 gap-1 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
