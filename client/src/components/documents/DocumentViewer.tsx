import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { selectDocument } from '@/lib/store/documentSlice';
import { Document } from '@shared/schema';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FileSpreadsheet,
  File,
  X,
  Download,
  Printer,
  Share2,
  Edit,
  Clock,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer = ({ document, isOpen, onClose }: DocumentViewerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [userName, setUserName] = useState('John Doe');

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleClose = (): void => {
    dispatch(selectDocument(null));
    onClose();
  };

  const getFileIcon = (type: string | undefined): JSX.Element => {
    if (!type) return <File className="text-yellow-500 mr-3" size={24} />;

    switch (type) {
      case 'PDF':
        return <FileText className="text-red-500 mr-3" size={24} />;
      case 'DOCX':
        return <FileText className="text-blue-500 mr-3" size={24} />;
      case 'XLSX':
        return <FileSpreadsheet className="text-green-500 mr-3" size={24} />;
      default:
        return <File className="text-yellow-500 mr-3" size={24} />;
    }
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-primary/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-card rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center">
                {getFileIcon(document.type)}
                <h3 className="text-lg font-semibold">{document.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-muted hover:text-primary rounded-md">
                  <Download size={18} />
                </button>
                <button className="p-2 text-muted hover:text-primary rounded-md">
                  <Printer size={18} />
                </button>
                <button
                  className="p-2 text-muted hover:text-primary rounded-md"
                  onClick={handleClose}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-background rounded-lg p-8 min-h-[600px]">
                {/* Placeholder document content based on document type */}
                {document.type === 'PDF' && (
                  <>
                    <h1 className="text-2xl font-bold mb-4">{document.name.replace('.pdf', '')}</h1>
                    <h2 className="text-xl font-semibold mb-3">Executive Summary</h2>
                    <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>

                    <h2 className="text-xl font-semibold mb-3">Financial Highlights</h2>
                    <p className="mb-4">Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>

                    <div className="bg-card border border-border rounded-lg p-4 mb-6">
                      <h3 className="font-semibold mb-2">Revenue Growth</h3>
                      <div className="h-40 bg-background/50 rounded flex items-center justify-center">
                        <p className="text-muted">Revenue chart visualization</p>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold mb-3">Strategic Initiatives</h2>
                    <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>

                    <h3 className="text-lg font-semibold mb-2">Key Projects</h3>
                    <ul className="list-disc pl-5 mb-4">
                      <li className="mb-1">Project Alpha: Expansion into European markets</li>
                      <li className="mb-1">Project Beta: New product line development</li>
                      <li className="mb-1">Project Gamma: Digital transformation initiative</li>
                    </ul>

                    <h2 className="text-xl font-semibold mb-3">Outlook for 2024</h2>
                    <p>Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                  </>
                )}

                {document.type === 'DOCX' && (
                  <>
                    <h1 className="text-2xl font-bold mb-4">{document.name.replace('.docx', '')}</h1>
                    <p className="mb-4">This is a Word document. The content would be displayed here in a real application.</p>
                    <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  </>
                )}

                {document.type === 'XLSX' && (
                  <>
                    <h1 className="text-2xl font-bold mb-4">{document.name.replace('.xlsx', '')}</h1>
                    <p className="mb-4">This is an Excel spreadsheet. The content would be displayed here in a real application.</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-background/50">
                            <th className="border border-border p-2 text-left">Quarter</th>
                            <th className="border border-border p-2 text-left">Revenue</th>
                            <th className="border border-border p-2 text-left">Expenses</th>
                            <th className="border border-border p-2 text-left">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-border p-2">Q1</td>
                            <td className="border border-border p-2">$250,000</td>
                            <td className="border border-border p-2">$180,000</td>
                            <td className="border border-border p-2">$70,000</td>
                          </tr>
                          <tr className="bg-background/50">
                            <td className="border border-border p-2">Q2</td>
                            <td className="border border-border p-2">$310,000</td>
                            <td className="border border-border p-2">$195,000</td>
                            <td className="border border-border p-2">$115,000</td>
                          </tr>
                          <tr>
                            <td className="border border-border p-2">Q3</td>
                            <td className="border border-border p-2">$290,000</td>
                            <td className="border border-border p-2">$210,000</td>
                            <td className="border border-border p-2">$80,000</td>
                          </tr>
                          <tr className="bg-background/50">
                            <td className="border border-border p-2">Q4</td>
                            <td className="border border-border p-2">$350,000</td>
                            <td className="border border-border p-2">$225,000</td>
                            <td className="border border-border p-2">$125,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {document.type === 'TXT' && (
                  <>
                    <h1 className="text-2xl font-bold mb-4">{document.name.replace('.txt', '')}</h1>
                    <pre className="font-mono bg-background/50 p-4 rounded-md">
                      {`Meeting Notes - Project Status
Date: ${format(new Date(), 'MMMM d, yyyy')}
Attendees: John, Sarah, Mike, Lisa

Action Items:
1. Complete market research by next week
2. Prepare budget proposal for Q3
3. Schedule follow-up meeting with client
4. Review design mockups

Next Steps:
- Team to provide status updates by Friday
- Finalize project timeline by end of month
- Assign resources to critical path tasks`}
                    </pre>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-4 flex justify-between items-center">
              <div className="flex items-center text-sm text-muted">
                <Clock size={16} className="mr-2" />
                <span>
                  Last modified: {document.updatedAt
                    ? format(new Date(document.updatedAt), 'MMM d, yyyy')
                    : 'Unknown'} by {userName}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                <Button>
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentViewer;
