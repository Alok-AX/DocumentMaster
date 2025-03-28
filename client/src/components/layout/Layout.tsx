import { useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchCurrentUser } from '@/lib/store/authSlice';
import { useLocation, useRoute } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../common/Toast';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, status } = useSelector((state: RootState) => state.auth);
  const [, setLocation] = useLocation();
  const [isLoginPage] = useRoute('/login');
  const [isSignupPage] = useRoute('/signup');
  
  useEffect(() => {
    if (!isLoginPage && !isSignupPage) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isLoginPage, isSignupPage]);
  
  useEffect(() => {
    if (status === 'failed' && !isLoginPage && !isSignupPage) {
      setLocation('/login');
    }
  }, [status, setLocation, isLoginPage, isSignupPage]);
  
  // Don't show layout on login/signup pages
  if (isLoginPage || isSignupPage) {
    return (
      <div>
        {children}
        <Toast />
        <Toaster />
      </div>
    );
  }
  
  // Show loading state while checking authentication
  if (status === 'loading' && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-background">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <Toast />
      <Toaster />
    </div>
  );
};

export default Layout;
