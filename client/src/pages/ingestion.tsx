import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { Ingestion, Document } from '@shared/schema';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  RefreshCw,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const IngestionPage = () => {
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  
  // Fetch documents for ingestion
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Fetch ingestion history
  const { data: ingestions, isLoading: isLoadingIngestions } = useQuery<Ingestion[]>({
    queryKey: ['/api/ingestions'],
  });
  
  // Start ingestion mutation
  const startIngestion = useMutation({
    mutationFn: async () => {
      if (!selectedDocumentId) {
        throw new Error('No document selected');
      }
      const res = await apiRequest('POST', '/api/ingestions', {
        documentId: selectedDocumentId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ingestion process started',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ingestions'] });
      setSelectedDocumentId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start ingestion',
        variant: 'destructive',
      });
    },
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Ingestion Panel */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Start Document Ingestion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Document</label>
                  <div className="relative">
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 appearance-none"
                      value={selectedDocumentId || ''}
                      onChange={(e) => setSelectedDocumentId(Number(e.target.value))}
                      disabled={isLoadingDocuments || startIngestion.isPending}
                    >
                      <option value="">Select a document</option>
                      {documents?.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted pointer-events-none" />
                  </div>
                </div>
                
                <div className="bg-muted/10 rounded-md p-3 text-sm">
                  <p>Ingestion processes the document content, making it available for Q&A and search. This operation may take a few minutes depending on document size.</p>
                </div>
                
                <Button 
                  onClick={() => startIngestion.mutate()}
                  disabled={!selectedDocumentId || startIngestion.isPending}
                  className="w-full"
                >
                  {startIngestion.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Start Ingestion'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Ingestion History */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Ingestion History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingIngestions ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
              ) : ingestions && ingestions.length > 0 ? (
                <div className="space-y-4">
                  {ingestions.map((ingestion, index) => (
                    <motion.div
                      key={ingestion.id}
                      className="border border-border rounded-md overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between bg-card p-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-secondary mr-2" />
                          <span className="font-medium">Document ID: {ingestion.documentId}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(ingestion.status)}
                          {getStatusBadge(ingestion.status)}
                        </div>
                      </div>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value={`logs-${ingestion.id}`} className="border-0">
                          <AccordionTrigger className="px-4 py-2 hover:no-underline">
                            <span className="text-sm">View Logs</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="bg-background p-3 rounded-md font-mono text-xs overflow-x-auto">
                              {ingestion.logs || 'No logs available'}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No ingestion history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default IngestionPage;
