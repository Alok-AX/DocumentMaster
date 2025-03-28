import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { logout } from '@/lib/store/authSlice';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

const UserAvatar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();
  
  // Generate user initials from name
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">
        <span>{getUserInitials()}</span>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted capitalize">{user.role}</p>
      </div>
      <button 
        className="ml-auto p-1 text-muted hover:text-primary"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserAvatar;
