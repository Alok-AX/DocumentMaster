import { useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { Provider } from 'react-redux';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from './lib/store';
import { Toaster } from './components/ui/toaster';
import NotFound from './pages/not-found';

// Page imports
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import Documents from './pages/documents';
import IngestionPage from './pages/ingestion';
import QA from './pages/qa';
import Users from './pages/users';
import Settings from './pages/settings';

function Router() {
  return (
    <Switch>
      {/* Auth pages */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Main application pages */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/documents" component={Documents} />
      <Route path="/ingestion" component={IngestionPage} />
      <Route path="/qa" component={QA} />
      <Route path="/users" component={Users} />
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();

  // Redirect to login page if at root path
  useEffect(() => {
    if (location === '/') {
      setLocation('/dashboard');
    }
  }, [location, setLocation]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
