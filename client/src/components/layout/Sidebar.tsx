import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'wouter';
import { RootState } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  Users,
  Settings,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [location] = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-2" /> },
    { path: '/documents', label: 'Documents', icon: <FileText className="w-5 h-5 mr-2" /> },
    { path: '/ingestion', label: 'Ingestion', icon: <Upload className="w-5 h-5 mr-2" /> },
    { path: '/qa', label: 'Q&A', icon: <Search className="w-5 h-5 mr-2" /> },
  ];

  const adminNavItems = [
    { path: '/users', label: 'User Management', icon: <Users className="w-5 h-5 mr-2" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5 mr-2" /> },
  ];

  // Sidebar toggle button (mobile only)
  const SidebarToggleButton = () => (
    <button
      className="fixed bottom-4 right-4 md:hidden bg-secondary text-white p-3 rounded-full shadow-lg z-20"
      onClick={toggleMobileSidebar}
    >
      <Menu />
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo and App Name */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileText className="text-secondary text-xl" />
          <h1 className="text-lg font-semibold">DocManager</h1>
          {isMobile && (
            <button
              className="ml-auto text-muted hover:text-primary"
              onClick={closeMobileSidebar}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Main</span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeMobileSidebar}
              className={cn(
                "flex items-center px-3 py-2 mt-1 text-sm rounded-md hover:bg-primary/5 transition-colors",
                location === item.path && "bg-secondary/10 text-secondary hover:bg-secondary/20"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Admin Section - Only visible for admin role */}
        {isAdmin && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Admin</span>
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobileSidebar}
                className={cn(
                  "flex items-center px-3 py-2 mt-1 text-sm rounded-md hover:bg-primary/5 transition-colors",
                  location === item.path && "bg-secondary/10 text-secondary hover:bg-secondary/20"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <UserAvatar />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r border-border h-full flex-shrink-0 transition-all duration-300 ease-in-out hidden md:block">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Toggle Button */}
      <SidebarToggleButton />
    </>
  );
};

export default Sidebar;
