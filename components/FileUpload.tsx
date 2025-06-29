'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/DataContext';
import { parseFile } from '@/utils/fileParser';
import { validateData } from '@/utils/validator';

export function FileUpload() {
  const { updateClients, updateWorkers, updateTasks, setValidationErrors } = useData();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload a CSV or Excel file'
      });
      return;
    }

    setUploadStatus({ type: null, message: 'Processing file...' });

    try {
      const result = await parseFile(file);
      
      if (result.error) {
        setUploadStatus({
          type: 'error',
          message: result.error
        });
        return;
      }

      // Update the appropriate data based on what was parsed
      if (result.clients) {
        updateClients(result.clients);
        setUploadStatus({
          type: 'success',
          message: `Successfully loaded ${result.clients.length} clients`
        });
      } else if (result.workers) {
        updateWorkers(result.workers);
        setUploadStatus({
          type: 'success',
          message: `Successfully loaded ${result.workers.length} workers`
        });
      } else if (result.tasks) {
        updateTasks(result.tasks);
        setUploadStatus({
          type: 'success',
          message: `Successfully loaded ${result.tasks.length} tasks`
        });
      }

      // Run validation on all data
      // Note: This is a simplified version - in a real app, you'd get current state
      const errors = validateData(
        result.clients || [],
        result.workers || [],
        result.tasks || []
      );
      setValidationErrors(errors);

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [updateClients, updateWorkers, updateTasks, setValidationErrors]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

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
            <h3 className="mb-2 text-lg font-semibold">Upload Your Data Files</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Drag and drop your CSV or Excel files here, or click to browse
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              Supports: Clients, Workers, and Tasks data
            </p>
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild className="transition-all duration-200 hover:scale-105">
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadStatus.type && (
        <Alert className={`transition-all duration-300 ${
          uploadStatus.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="font-medium">
              {uploadStatus.message}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}