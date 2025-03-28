import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { 
  Save, 
  User, 
  Bell, 
  Lock, 
  Shield, 
  Database, 
  Key, 
  Loader2 
} from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  
  // User form state
  const [userForm, setUserForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    documentUploads: true,
    documentUpdates: true,
    documentDeletions: false,
    userActivities: true,
    systemNotifications: true,
  });
  
  // API keys (these would usually be fetched from an API)
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Development API Key', key: 'dev_api_xxx...', createdAt: new Date(2023, 5, 15) },
    { id: 2, name: 'Production API Key', key: 'prod_api_xxx...', createdAt: new Date(2023, 8, 3) },
  ]);
  
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'User profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateApiKey = () => {
    toast({
      title: 'New API Key Generated',
      description: 'Your new API key has been created',
    });
  };
  
  const handleRevokeApiKey = (id: number) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: 'API Key Revoked',
      description: 'The API key has been revoked successfully',
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: 'Success',
      description: 'Notification settings saved successfully',
    });
  };
  
  return (
    <Layout>
      <div className="p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api" disabled={user?.role !== 'admin'}>API</TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    User Profile
                  </CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUserFormSubmit} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={userForm.name}
                        onChange={handleUserFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userForm.email}
                        onChange={handleUserFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={user?.role || 'N/A'}
                        readOnly
                        disabled
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordFormSubmit} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
                      <ul className="text-xs text-muted space-y-1 list-disc pl-4">
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                      </ul>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure which notifications you'd like to receive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Document Uploads</h4>
                        <p className="text-xs text-muted">Get notified when a new document is uploaded</p>
                      </div>
                      <Switch
                        checked={notifications.documentUploads}
                        onCheckedChange={() => handleNotificationChange('documentUploads')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Document Updates</h4>
                        <p className="text-xs text-muted">Get notified when a document is modified</p>
                      </div>
                      <Switch
                        checked={notifications.documentUpdates}
                        onCheckedChange={() => handleNotificationChange('documentUpdates')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Document Deletions</h4>
                        <p className="text-xs text-muted">Get notified when a document is deleted</p>
                      </div>
                      <Switch
                        checked={notifications.documentDeletions}
                        onCheckedChange={() => handleNotificationChange('documentDeletions')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">User Activities</h4>
                        <p className="text-xs text-muted">Get notified about user activities (admin only)</p>
                      </div>
                      <Switch
                        checked={notifications.userActivities}
                        onCheckedChange={() => handleNotificationChange('userActivities')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">System Notifications</h4>
                        <p className="text-xs text-muted">Get notified about system updates and maintenance</p>
                      </div>
                      <Switch
                        checked={notifications.systemNotifications}
                        onCheckedChange={() => handleNotificationChange('systemNotifications')}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveNotifications} 
                      className="w-full md:w-auto mt-4"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* API Settings (Admin Only) */}
          <TabsContent value="api" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    API Access
                  </CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to the document management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-medium">API Keys</h4>
                        <p className="text-xs text-muted">Generate and manage API keys for secure access</p>
                      </div>
                      <Button onClick={handleGenerateApiKey}>
                        <Key className="mr-2 h-4 w-4" />
                        Generate New Key
                      </Button>
                    </div>
                    
                    <div className="border rounded-md divide-y">
                      {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h5 className="font-medium">{apiKey.name}</h5>
                              <p className="text-xs text-muted mt-1">
                                Created: {apiKey.createdAt.toLocaleDateString()}
                              </p>
                              <div className="bg-muted/10 rounded p-2 my-2 font-mono text-xs">
                                {apiKey.key}
                              </div>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRevokeApiKey(apiKey.id)}
                            >
                              Revoke
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {apiKeys.length === 0 && (
                        <div className="p-6 text-center">
                          <p className="text-muted">No API keys found. Generate a new key to get started.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
                      <h4 className="font-medium">Security Notice</h4>
                      <p className="mt-1 text-xs">
                        API keys grant complete access to the system. Store them securely and never share them in public repositories or client-side code.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
