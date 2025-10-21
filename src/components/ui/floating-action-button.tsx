import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
  onClick?: () => void;
  href?: string;
  label?: string;
}

export function FloatingActionButton({ onClick, href, label = 'Add' }: FloatingActionButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className="h-12 w-12 rounded-full shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-110 active:scale-95 transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 animate-pulse-glow"
      aria-label={label}
    >
      <Plus className="w-5 h-5" />
    </Button>
  );
}
