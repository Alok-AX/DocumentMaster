import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { uploadDocument } from '@/lib/store/documentSlice';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  MoreVertical,
  FileIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentUpload {
  id: number;
  name: string;
  type: string;
  size: number;
  modifiedAt: Date;
}

const UploadSection = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, TXT, or XLSX file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get file extension from name
      const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
      
      // In a real app, you would upload to a server first
      // For now, we'll just simulate the API call
      await dispatch(uploadDocument({
        name: file.name,
        type: fileExtension,
        size: file.size,
        path: `/uploads/${file.name}`, // Simulated path
      })).unwrap();

      // Add to recent uploads
      const newUpload: RecentUpload = {
        id: Date.now(),
        name: file.name,
        type: fileExtension,
        size: file.size,
        modifiedAt: new Date(),
      };
      setRecentUploads(prev => [newUpload, ...prev.slice(0, 4)]);

      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: typeof error === 'string' ? error : "An error occurred while uploading the file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="text-red-500" />;
      case 'DOCX':
        return <FileText className="text-blue-500" />;
      case 'XLSX':
        return <FileSpreadsheet className="text-green-500" />;
      default:
        return <FileIcon className="text-yellow-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  return (
    <motion.div 
      className="bg-card p-6 rounded-lg border border-border shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
      
      <div 
        className={`border-2 border-dashed ${isDragging ? 'border-secondary bg-secondary/5' : 'border-border'} rounded-lg p-6 text-center transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto text-4xl text-muted mb-2" />
        <p className="text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted mt-1">or</p>
        <Button 
          className="mt-3"
          onClick={handleBrowseClick}
        >
          Browse Files
        </Button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.xlsx"
        />
        <p className="text-xs text-muted mt-3">Supported formats: PDF, DOCX, TXT, XLSX (max 50MB)</p>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3">Recent Uploads</h4>
        <div className="space-y-3">
          {recentUploads.length > 0 ? (
            recentUploads.map((upload) => (
              <div key={upload.id} className="flex items-center p-2 rounded-md bg-background">
                {getFileIcon(upload.type)}
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-sm font-medium truncate">{upload.name}</p>
                  <p className="text-xs text-muted">
                    {formatFileSize(upload.size)} • {formatDistanceToNow(upload.modifiedAt, { addSuffix: true })}
                  </p>
                </div>
                <button className="text-muted hover:text-primary p-1">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted text-center py-4">No recent uploads</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UploadSection;
