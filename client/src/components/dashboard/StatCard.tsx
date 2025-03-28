import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({ icon: Icon, title, value, change, className }: StatCardProps) => {
  return (
    <motion.div 
      className={cn("bg-card p-4 rounded-lg border border-border shadow-sm", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <div className={cn(
          "rounded-full p-3",
          title.includes("Document") ? "bg-secondary/10 text-secondary" :
          title.includes("Ingestion") ? "bg-green-100 text-green-600" :
          title.includes("Queries") ? "bg-purple-100 text-purple-600" :
          "bg-yellow-100 text-yellow-600"
        )}>
          <Icon size={20} />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-muted">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
      {change && (
        <div className={cn(
          "mt-2 text-xs flex items-center",
          change.isPositive ? "text-success" : "text-error"
        )}>
          {change.isPositive ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 01-.707-.293l-4-4a1 1 0 011.414-1.414L12 4.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0112 7z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 13a1 1 0 01-.707-.293l-4-4a1 1 0 011.414-1.414L12 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0112 13z" clipRule="evenodd" />
            </svg>
          )}
          <span>{change.value}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
