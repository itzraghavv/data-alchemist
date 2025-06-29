'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

export function ExportControls() {
  const { state } = useData();
  const [isExporting, setIsExporting] = useState(false);

  const hasErrors = state.validationErrors.some(e => e.type === 'error');
  const hasWarnings = state.validationErrors.some(e => e.type === 'warning');
  const hasData = state.clients.length > 0 || state.workers.length > 0 || state.tasks.length > 0;

  const exportData = async () => {
    if (hasErrors) return;
    
    setIsExporting(true);
    
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create clean data export
    const cleanData = {
      clients: state.clients,
      workers: state.workers,
      tasks: state.tasks,
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: state.clients.length + state.workers.length + state.tasks.length,
        validationStatus: hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'clean'
      }
    };

    // Create rules export
    const rulesExport = {
      businessRules: state.businessRules,
      prioritySettings: state.prioritySettings,
      version: '1.0',
      createdAt: new Date().toISOString()
    };

    // Download files
    downloadJSON(cleanData, 'cleaned-data.json');
    downloadJSON(rulesExport, 'rules.json');
    
    setIsExporting(false);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = (entityType: 'clients' | 'workers' | 'tasks') => {
    const data = state[entityType];
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          if (Array.isArray(value)) return `"${value.join('; ')}"`;
          if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
          return `"${String(value)}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-green-500" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No data available for export. Please upload some files first.
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Cannot Export:</strong> Please fix all validation errors before exporting.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Warning:</strong> Some validation warnings exist. Data can be exported but review is recommended.
            </AlertDescription>
          </Alert>
        )}

        {!hasErrors && !hasWarnings && hasData && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Ready to Export:</strong> All validation checks passed successfully.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-medium">Complete Package</h3>
                <p className="text-sm text-muted-foreground">
                  Cleaned data + business rules in JSON format
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {state.clients.length + state.workers.length + state.tasks.length} records
              </Badge>
              <Button
                onClick={exportData}
                disabled={!hasData || hasErrors || isExporting}
                className="transition-all duration-200 hover:scale-105"
              >
                {isExporting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Export All'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Clients CSV</h4>
                <Badge variant="secondary">{state.clients.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportCSV('clients')}
                disabled={state.clients.length === 0}
                className="w-full"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Workers CSV</h4>
                <Badge variant="secondary">{state.workers.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportCSV('workers')}
                disabled={state.workers.length === 0}
                className="w-full"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Tasks CSV</h4>
                <Badge variant="secondary">{state.tasks.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportCSV('tasks')}
                disabled={state.tasks.length === 0}
                className="w-full"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Export Summary</h4>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Cleaned data will be exported in JSON format</p>
              <p>• Business rules and priority settings included</p>
              <p>• CSV exports available for individual entities</p>
              <p>• All validation issues must be resolved first</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}