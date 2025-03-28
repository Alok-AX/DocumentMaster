import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { setViewMode } from '@/lib/store/documentSlice';
import Layout from '@/components/layout/Layout';
import DocumentGrid from '@/components/documents/DocumentGrid';
import DocumentList from '@/components/documents/DocumentList';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { Document } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Documents = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { viewMode, selectedDocument } = useSelector((state: RootState) => state.document);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Fetch documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    dispatch(setViewMode(mode));
  };
  
  const handleOpenDocument = (document: Document) => {
    setIsViewerOpen(true);
  };
  
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };
  
  // Pagination
  const totalPages = documents ? Math.ceil(documents.length / itemsPerPage) : 0;
  const paginatedDocuments = documents 
    ? documents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];
  
  return (
    <Layout>
      <div className="p-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div className="flex items-center space-x-2">
              <button 
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-background' : 'hover:bg-background/80'} transition-colors flex items-center justify-center`}
                onClick={() => handleViewModeChange('grid')}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-background' : 'hover:bg-background/80'} transition-colors flex items-center justify-center`}
                onClick={() => handleViewModeChange('list')}
              >
                <List size={18} />
              </button>
              <div className="relative ml-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <span>Sort by: Recent</span>
                  <ChevronDown size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Grid/List View */}
              {viewMode === 'grid' ? (
                <DocumentGrid 
                  documents={paginatedDocuments}
                  onOpenDocument={handleOpenDocument}
                />
              ) : (
                <DocumentList 
                  documents={paginatedDocuments}
                  onOpenDocument={handleOpenDocument}
                />
              )}
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, documents?.length || 0)}-
                    {Math.min(currentPage * itemsPerPage, documents?.length || 0)} of {documents?.length || 0} documents
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} className="mr-1" /> Previous
                    </Button>
                    
                    {[...Array(Math.min(totalPages, 3))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button 
                          key={i}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Document Viewer Modal */}
      <DocumentViewer 
        document={selectedDocument} 
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </Layout>
  );
};

export default Documents;
