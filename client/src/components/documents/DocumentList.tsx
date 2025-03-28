import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { selectDocument } from '@/lib/store/documentSlice';
import { Document } from '@shared/schema';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  File,
  LucideIcon
} from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onOpenDocument: (document: Document) => void;
}

interface UserInitials {
  initials: string;
  color: string;
}

const DocumentList = ({ documents, onOpenDocument }: DocumentListProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const getFileIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'PDF':
        return <FileText className="text-red-500" />;
      case 'DOCX':
        return <FileText className="text-blue-500" />;
      case 'XLSX':
        return <FileSpreadsheet className="text-green-500" />;
      default:
        return <File className="text-yellow-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  const getUserInitials = (userId: number): UserInitials => {
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

  const handleDocumentClick = (document: Document): void => {
    dispatch(selectDocument(document));
    onOpenDocument(document);
  };

  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-background text-xs font-medium text-muted uppercase tracking-wider">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1">Owner</div>
      </div>

      {/* Table Rows */}
      {documents.map((document, index) => {
        const fileIcon = getFileIcon(document.type);
        const { initials, color } = getUserInitials(document.userId || 0);
        const formattedDate = document.updatedAt
          ? format(new Date(document.updatedAt), 'MMM d, yyyy')
          : 'Unknown';

        return (
          <motion.div
            key={document.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-background/50 cursor-pointer"
            onClick={() => handleDocumentClick(document)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            <div className="col-span-5 flex items-center">
              {fileIcon}
              <span className="ml-3 text-sm truncate">{document.name}</span>
            </div>
            <div className="col-span-2 text-sm text-muted">{formatFileSize(document.size)}</div>
            <div className="col-span-2 text-sm text-muted">{document.type}</div>
            <div className="col-span-2 text-sm text-muted">{formattedDate}</div>
            <div className="col-span-1">
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

export default DocumentList;
