import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import UploadSection from '@/components/dashboard/UploadSection';
import { Button } from '@/components/ui/button';
import { Activity, Document } from '@shared/schema';
import { 
  FileText, 
  Upload, 
  Search, 
  Users,
} from 'lucide-react';

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: documents } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Fetch activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });
  
  // Stats cards data
  const stats = [
    {
      title: 'Total Documents',
      value: documents?.length || 0,
      icon: FileText,
      change: { value: '12% from last month', isPositive: true }
    },
    {
      title: 'Ingestion Jobs',
      value: 24,
      icon: Upload,
      change: { value: '4% from last month', isPositive: true }
    },
    {
      title: 'Queries',
      value: '1,204',
      icon: Search,
      change: { value: '3% from last month', isPositive: false }
    },
    {
      title: 'Users',
      value: 32,
      icon: Users,
      change: { value: '2 new this month', isPositive: true }
    }
  ];
  
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  
  return (
    <Layout>
      <div className="p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                change={stat.change}
              />
            ))}
          </div>
          
          {/* Recent Activity & Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="bg-card p-6 rounded-lg border border-border shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="link" className="text-secondary hover:text-secondary/80 p-0">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {activities && activities.length > 0 ? (
                  activities.slice(0, 4).map((activity, index) => (
                    <ActivityItem key={activity.id} activity={activity} index={index} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upload Document */}
            <UploadSection />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
