import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  ArrowUpDown, 
  TrendingUp, 
  Wallet, 
  Settings,
  BarChart3,
  User,
  Shield
} from 'lucide-react';
import '../../styles/mobile.css';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const navigationItems: MobileNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="h-5 w-5" />,
    path: '/'
  },
  {
    id: 'swap',
    label: 'Swap',
    icon: <ArrowUpDown className="h-5 w-5" />,
    path: '/swap'
  },
  {
    id: 'trade',
    label: 'Trade',
    icon: <TrendingUp className="h-5 w-5" />,
    path: '/trade'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: <BarChart3 className="h-5 w-5" />,
    path: '/portfolio'
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: <Wallet className="h-5 w-5" />,
    path: '/wallet'
  }
];

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    navigate(path);
  };

  return (
    <nav className="mobile-nav">
      <div className="flex justify-around items-center">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`mobile-nav-item mobile-haptic ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="mobile-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              className="mobile-touch-button p-2 mr-2"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-white font-poppins">{title}</h1>
        </div>
        
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
};

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  hideNavigation?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBack = false,
  onBack,
  rightAction,
  hideNavigation = false
}) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <MobileHeader 
        title={title}
        showBack={showBack}
        onBack={onBack}
        rightAction={rightAction}
      />
      
      <main className="mobile-content mobile-scroll">
        {children}
      </main>
      
      {!hideNavigation && <MobileNavigation />}
    </div>
  );
};

// Mobile-specific utility components
export const MobileCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`mobile-card mobile-gpu-accelerated ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const MobileButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'mobile-touch-button mobile-haptic';
  const variantClasses = {
    primary: 'mobile-primary-button',
    secondary: 'mobile-secondary-button',
    ghost: 'bg-transparent border-none text-white hover:bg-gray-800'
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-3',
    lg: 'text-lg px-6 py-4'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="mobile-spinner mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export const MobileInput: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}> = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`mobile-input ${className}`}
    />
  );
};

export const MobileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className={`mobile-modal ${isOpen ? 'open' : ''}`}>
      <div className="mobile-modal-header">
        <h3 className="text-lg font-semibold text-white font-poppins">{title}</h3>
        <button
          onClick={onClose}
          className="mobile-touch-button p-2"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mobile-modal-content mobile-scroll">
        {children}
      </div>
    </div>
  );
};

// Mobile-specific hooks
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export const useHapticFeedback = () => {
  const triggerHaptic = React.useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return triggerHaptic;
};
