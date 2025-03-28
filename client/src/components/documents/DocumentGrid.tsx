import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import {
  selectDocument,
  starDocument as starDocumentAction
} from '@/lib/store/documentSlice';
import { Document } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  File,
  MoreVertical,
  Star
} from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onOpenDocument: (document: Document) => void;
}

interface FileIcon {
  icon: typeof FileText | typeof FileSpreadsheet | typeof File;
  bgColor: string;
  iconColor: string;
}

const DocumentGrid = ({ documents, onOpenDocument }: DocumentGridProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const getFileIcon = (type: string): FileIcon => {
    switch (type) {
      case 'PDF':
        return { icon: FileText, bgColor: 'bg-red-100', iconColor: 'text-red-500' };
      case 'DOCX':
        return { icon: FileText, bgColor: 'bg-blue-100', iconColor: 'text-blue-500' };
      case 'XLSX':
        return { icon: FileSpreadsheet, bgColor: 'bg-green-100', iconColor: 'text-green-500' };
      default:
        return { icon: File, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-500' };
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  const getUserInitials = (userId: number): { initials: string; color: string } => {
    // In a real app, you'd get the user name from a users state/store
    const initials = ['JD', 'AS', 'RJ', 'ML', 'DK'];
    const colors = [
      'bg-secondary', 'bg-purple-500', 'bg-green-500',
      'bg-orange-500', 'bg-pink-500'
    ];

    // Use userId to pick a consistent color and initials for demo purposes
    const index = userId % initials.length;
    return { initials: initials[index], color: colors[index] };
  };

  const handleStarClick = (e: React.MouseEvent, document: Document): void => {
    e.stopPropagation();
    dispatch(starDocumentAction({ id: document.id, starred: !document.starred }));
  };

  const handleDocumentClick = (document: Document): void => {
    dispatch(selectDocument(document));
    onOpenDocument(document);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {documents.map((document, index) => {
        const { icon: Icon, bgColor, iconColor } = getFileIcon(document.type);
        const { initials, color } = getUserInitials(document.userId || 0);
        const formattedDate = document.updatedAt ? formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true }) : 'Unknown';

        return (
          <motion.div
            key={document.id}
            className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleDocumentClick(document)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-md ${bgColor}`}>
                <Icon className={iconColor} />
              </div>
              <div className="flex">
                <button
                  className={`${document.starred ? 'text-yellow-400' : 'text-muted hover:text-primary'} p-1`}
                  onClick={(e) => handleStarClick(e, document)}
                >
                  <Star size={16} fill={document.starred ? 'currentColor' : 'none'} />
                </button>
                <button className="text-muted hover:text-primary p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
            <h4 className="font-medium mt-3 text-sm truncate">{document.name}</h4>
            <p className="text-xs text-muted mt-1">{formatFileSize(document.size)} • {document.type}</p>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-muted">Modified: {formattedDate}</p>
              <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs`}>
                {initials}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DocumentGrid;
