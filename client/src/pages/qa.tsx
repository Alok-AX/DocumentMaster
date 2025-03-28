import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryResult {
  answer: string;
  sources: {
    documentId: number;
    title: string;
    relevance: number;
  }[];
}

const QA = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Perform query mutation
  const performQuery = useMutation({
    mutationFn: async (queryText: string) => {
      const res = await apiRequest('POST', '/api/qa/query', { query: queryText });
      return res.json() as Promise<QueryResult>;
    },
    onSuccess: () => {
      if (!searchHistory.includes(query) && query.trim() !== '') {
        setSearchHistory([query, ...searchHistory.slice(0, 4)]);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to perform query',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performQuery.mutate(query);
    }
  };

  const handleHistoryItemClick = (historyItem: string) => {
    setQuery(historyItem);
    performQuery.mutate(historyItem);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask a question about your documents..."
              className="flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" disabled={performQuery.isPending || !query.trim()}>
              {performQuery.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search History */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Search History</CardTitle>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <ul className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left truncate"
                        onClick={() => handleHistoryItemClick(item)}
                      >
                        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                        {item}
                      </Button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No search history</p>
                  <p className="text-xs mt-1">Your recent searches will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {performQuery.isPending ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-secondary mb-4" />
                    <p className="text-muted">Searching documents...</p>
                  </div>
                ) : performQuery.data ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Tabs defaultValue="answer">
                      <TabsList className="mb-4">
                        <TabsTrigger value="answer">Answer</TabsTrigger>
                        <TabsTrigger value="sources">Sources ({performQuery.data.sources.length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="answer" className="mt-0">
                        <div className="bg-background p-4 rounded-md">
                          <ScrollArea className="h-[350px]">
                            <div className="prose max-w-none">
                              {performQuery.data.answer}
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sources" className="mt-0">
                        <ScrollArea className="h-[350px]">
                          <div className="space-y-4">
                            {performQuery.data.sources.map((source, index) => (
                              <div key={index} className="border border-border rounded-md p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                                    <h3 className="font-medium">{source.title}</h3>
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {Math.round(source.relevance * 100)}% match
                                  </span>
                                </div>
                                <div className="flex justify-end mt-2">
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Document
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-muted">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Enter a query to search your documents</p>
                    <p className="text-xs mt-1">
                      For example: "What are the revenue projections for Q3?"
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QA;
