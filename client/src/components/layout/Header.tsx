import { useState } from 'react';
import { useLocation } from 'wouter';
import { Menu, Bell, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Header = () => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Helper function to get page title from current location
  const getPageTitle = () => {
    const pathSegments = location.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    
    const page = pathSegments[0];
    return page.charAt(0).toUpperCase() + page.slice(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to Q&A page with search query
      window.location.href = `/qa?query=${encodeURIComponent(searchQuery)}`;
    }
  };
  
  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-10">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center md:hidden">
          <button 
            id="mobile-menu-button" 
            className="p-2 rounded-md text-muted hover:text-primary"
          >
            <Menu />
          </button>
          <h1 className="ml-2 text-lg font-semibold">DocManager</h1>
        </div>
        
        <div className="flex-1 mx-4 hidden md:block">
          <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <form 
            className="relative" 
            onSubmit={handleSearchSubmit}
          >
            <Input
              type="text"
              placeholder="Search..."
              className="py-2 px-4 pr-10 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-3 top-2.5 text-muted"
            >
              <SearchIcon size={16} />
            </button>
          </form>
          
          <button className="p-2 rounded-md text-muted hover:text-primary relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
