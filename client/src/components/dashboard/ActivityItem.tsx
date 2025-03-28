import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Document, Activity } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Upload, UserPlus } from 'lucide-react';

// Activity icon mapping
const ActivityIcon = {
  'upload': Upload,
  'comment': MessageSquare,
  'share': UserPlus,
  'edit': FileText
} as const;

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

const ActivityItem = ({ activity, index }: ActivityItemProps) => {
  const Icon = activity.type && activity.type in ActivityIcon 
    ? ActivityIcon[activity.type as keyof typeof ActivityIcon] 
    : FileText;
  
  // Format the timestamp safely
  const formattedTime = activity.createdAt 
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) 
    : 'recently';
  
  return (
    <div className="flex items-start space-x-4 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={activity.user?.avatar || ''} alt={activity.user?.name || 'User'} />
        <AvatarFallback>{activity.user?.name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            <span className="font-semibold">{activity.user?.name || 'A user'}</span>{' '}
            {activity.action || 'performed an action'}
          </p>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        
        {activity.documentName && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{activity.documentName}</span>
          </p>
        )}
      </div>
      
      <div className="rounded-full p-2 bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
};

export default ActivityItem;
