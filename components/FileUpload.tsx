'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/contexts/DataContext';
import { parseFile } from '@/utils/fileParser';
import { validateData } from '@/utils/validator';

interface FileUploadResult {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message: string;
  entityType?: 'clients' | 'workers' | 'tasks';
  recordCount?: number;
}

export function FileUpload() {
  const { updateClients, updateWorkers, updateTasks, setValidationErrors, state } = useData();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResults, setUploadResults] = useState<FileUploadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Filter for valid file types
    const validFiles = fileArray.filter(file => 
      file.name.match(/\.(csv|xlsx|xls)$/i)
    );

    if (validFiles.length === 0) {
      setUploadResults([{
        file: fileArray[0],
        status: 'error',
        message: 'Please upload CSV or Excel files only'
      }]);
      return;
    }

    setIsProcessing(true);
    
    // Initialize upload results
    const initialResults: FileUploadResult[] = validFiles.map(file => ({
      file,
      status: 'pending',
      message: 'Waiting to process...'
    }));
    
    setUploadResults(initialResults);

    // Process files sequentially to avoid conflicts
    const processedData = {
      clients: [...state.clients],
      workers: [...state.workers],
      tasks: [...state.tasks]
    };

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      // Update status to processing
      setUploadResults(prev => prev.map((result, index) => 
        index === i 
          ? { ...result, status: 'processing', message: 'Processing file...' }
          : result
      ));

      try {
        const result = await parseFile(file);
        
        if (result.error) {
          setUploadResults(prev => prev.map((uploadResult, index) => 
            index === i 
              ? { 
                  ...uploadResult, 
                  status: 'error', 
                  message: result.error || 'Unknown error' 
                }
              : uploadResult
          ));
          continue;
        }

        // Determine what type of data was parsed and merge it
        let entityType: 'clients' | 'workers' | 'tasks' | undefined;
        let recordCount = 0;

        if (result.clients) {
          entityType = 'clients';
          recordCount = result.clients.length;
          // Merge with existing clients, avoiding duplicates
          const existingIds = new Set(processedData.clients.map(c => c.ClientID));
          const newClients = result.clients.filter(c => !existingIds.has(c.ClientID));
          processedData.clients = [...processedData.clients, ...newClients];
        } else if (result.workers) {
          entityType = 'workers';
          recordCount = result.workers.length;
          // Merge with existing workers, avoiding duplicates
          const existingIds = new Set(processedData.workers.map(w => w.WorkerID));
          const newWorkers = result.workers.filter(w => !existingIds.has(w.WorkerID));
          processedData.workers = [...processedData.workers, ...newWorkers];
        } else if (result.tasks) {
          entityType = 'tasks';
          recordCount = result.tasks.length;
          // Merge with existing tasks, avoiding duplicates
          const existingIds = new Set(processedData.tasks.map(t => t.TaskID));
          const newTasks = result.tasks.filter(t => !existingIds.has(t.TaskID));
          processedData.tasks = [...processedData.tasks, ...newTasks];
        }

        setUploadResults(prev => prev.map((uploadResult, index) => 
          index === i 
            ? { 
                ...uploadResult, 
                status: 'success', 
                message: `Successfully loaded ${recordCount} ${entityType}`,
                entityType,
                recordCount
              }
            : uploadResult
        ));

      } catch (error) {
        setUploadResults(prev => prev.map((uploadResult, index) => 
          index === i 
            ? { 
                ...uploadResult, 
                status: 'error', 
                message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` 
              }
            : uploadResult
        ));
      }
    }

    // Update the context with all processed data
    updateClients(processedData.clients);
    updateWorkers(processedData.workers);
    updateTasks(processedData.tasks);

    // Run validation on all data
    const errors = validateData(
      processedData.clients,
      processedData.workers,
      processedData.tasks
    );
    setValidationErrors(errors);

    setIsProcessing(false);
  }, [updateClients, updateWorkers, updateTasks, setValidationErrors, state]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeUploadResult = (index: number) => {
    setUploadResults(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllResults = () => {
    setUploadResults([]);
  };

  const getProgressValue = () => {
    if (uploadResults.length === 0) return 0;
    const completed = uploadResults.filter(r => r.status === 'success' || r.status === 'error').length;
    return (completed / uploadResults.length) * 100;
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case 'clients': return '👥';
      case 'workers': return '👷';
      case 'tasks': return '📋';
      default: return '📄';
    }
  };

  const getEntityColor = (entityType?: string) => {
    switch (entityType) {
      case 'clients': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'workers': return 'bg-green-100 text-green-800 border-green-200';
      case 'tasks': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed transition-colors duration-200 hover:border-primary/50">
        <CardContent className="p-8">
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
              <Upload className="h-full w-full" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Upload Multiple Data Files</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Drag and drop multiple CSV or Excel files here, or click to browse
            </p>
            <div className="mb-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>👥</span>
                <span>Clients</span>
              </div>
              <div className="flex items-center gap-1">
                <span>👷</span>
                <span>Workers</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📋</span>
                <span>Tasks</span>
              </div>
            </div>
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
              multiple
            />
            <Button asChild className="transition-all duration-200 hover:scale-105">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Choose Files
              </label>
            </Button>
            
            <p className="mt-4 text-xs text-muted-foreground">
              Supports multiple file selection • CSV, XLSX, XLS formats
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isProcessing && uploadResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Processing Files</span>
              <span className="text-xs text-muted-foreground">
                {uploadResults.filter(r => r.status === 'success' || r.status === 'error').length} of {uploadResults.length} completed
              </span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Upload Results</h3>
              <Button size="sm" variant="outline" onClick={clearAllResults}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
              {uploadResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {result.status === 'pending' && (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    {result.status === 'processing' && (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {result.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{result.file.name}</span>
                      {result.entityType && (
                        <Badge className={`text-xs ${getEntityColor(result.entityType)}`}>
                          {getEntityIcon(result.entityType)} {result.entityType}
                        </Badge>
                      )}
                      {result.recordCount && (
                        <Badge variant="outline" className="text-xs">
                          {result.recordCount} records
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs ${
                      result.status === 'success' ? 'text-green-600' : 
                      result.status === 'error' ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUploadResult(index)}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            {uploadResults.some(r => r.status === 'success') && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Upload Summary</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  {uploadResults.filter(r => r.status === 'success' && r.entityType === 'clients').length > 0 && (
                    <p>• {uploadResults.filter(r => r.status === 'success' && r.entityType === 'clients').reduce((sum, r) => sum + (r.recordCount || 0), 0)} clients loaded</p>
                  )}
                  {uploadResults.filter(r => r.status === 'success' && r.entityType === 'workers').length > 0 && (
                    <p>• {uploadResults.filter(r => r.status === 'success' && r.entityType === 'workers').reduce((sum, r) => sum + (r.recordCount || 0), 0)} workers loaded</p>
                  )}
                  {uploadResults.filter(r => r.status === 'success' && r.entityType === 'tasks').length > 0 && (
                    <p>• {uploadResults.filter(r => r.status === 'success' && r.entityType === 'tasks').reduce((sum, r) => sum + (r.recordCount || 0), 0)} tasks loaded</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Summary */}
      {uploadResults.some(r => r.status === 'error') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Some files failed to upload:</strong> Please check the error messages above and try uploading those files again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}