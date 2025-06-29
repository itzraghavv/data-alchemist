'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { searchWithNaturalLanguage, SearchResult } from '@/utils/nlpSearch';

export function NaturalLanguageSearch() {
  const { state } = useData();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const results = searchWithNaturalLanguage(
      query,
      state.clients,
      state.workers,
      state.tasks
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const getEntityData = (result: SearchResult) => {
    switch (result.entity) {
      case 'clients':
        return state.clients.find(c => c.ClientID === result.id);
      case 'workers':
        return state.workers.find(w => w.WorkerID === result.id);
      case 'tasks':
        return state.tasks.find(t => t.TaskID === result.id);
      default:
        return null;
    }
  };

  const exampleQueries = [
    "All tasks having a Duration of more than 1 phase and having phase 2 in their Preferred Phases list",
    "Workers with programming skills in San Francisco",
    "High priority tasks requiring JavaScript skills",
    "Clients requesting web development tasks",
    "Tasks with duration less than 3 hours"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Natural Language Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your data using plain English..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={!query.trim() || isSearching}
            className="transition-all duration-200 hover:scale-105"
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Filter className="h-4 w-4 mr-2" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Example queries */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2 whitespace-normal text-left"
                onClick={() => setQuery(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Search Results</h3>
              <Badge variant="secondary">{searchResults.length} found</Badge>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => {
                const data = getEntityData(result);
                if (!data) return null;

                return (
                  <div key={`${result.entity}-${result.id}-${index}`} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={result.entity === 'tasks' ? 'default' : result.entity === 'workers' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {result.entity.slice(0, -1)}
                          </Badge>
                          <span className="font-medium text-sm">
                            {(data as any).Name || result.id}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          ID: {result.id}
                        </p>
                        <p className="text-sm">{result.match}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Match Score
                        </div>
                        <div className="text-sm font-medium">
                          {Math.round(result.score)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {searchResults.length === 0 && query && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No results found for "{query}"</p>
            <p className="text-xs mt-1">Try a different search term or check the examples above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}