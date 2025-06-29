'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { ValidationError } from '@/types/data';

export function ValidationPanel() {
  const { state } = useData();

  const { errors, warnings, suggestions } = useMemo(() => {
    const errors = state.validationErrors.filter(e => e.type === 'error');
    const warnings = state.validationErrors.filter(e => e.type === 'warning');
    const suggestions = state.validationErrors.filter(e => e.suggestion);

    return { errors, warnings, suggestions };
  }, [state.validationErrors]);

  const errorsByEntity = useMemo(() => {
    return {
      clients: state.validationErrors.filter(e => e.entity === 'clients'),
      workers: state.validationErrors.filter(e => e.entity === 'workers'),
      tasks: state.validationErrors.filter(e => e.entity === 'tasks'),
    };
  }, [state.validationErrors]);

  const overallStatus = useMemo(() => {
    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  }, [errors.length, warnings.length]);

  const renderValidationItem = (validation: ValidationError) => (
    <div key={validation.id} className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {validation.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium">{validation.message}</p>
            <p className="text-xs text-muted-foreground">
              {validation.entity} → {validation.rowId} {validation.field && `→ ${validation.field}`}
            </p>
          </div>
        </div>
        <Badge variant={validation.type === 'error' ? 'destructive' : 'secondary'}>
          {validation.type}
        </Badge>
      </div>
      
      {validation.suggestion && (
        <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">{validation.suggestion}</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              Apply Fix
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (state.validationErrors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All data validation checks passed! Your data is ready for processing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {overallStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {overallStatus === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {overallStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            Validation Report
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <Badge variant="destructive">{errors.length} errors</Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="secondary">{warnings.length} warnings</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="clients">
              Clients
              {errorsByEntity.clients.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5">
                  {errorsByEntity.clients.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workers">
              Workers
              {errorsByEntity.workers.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5">
                  {errorsByEntity.workers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks
              {errorsByEntity.tasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5">
                  {errorsByEntity.tasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-red-800">Critical Errors</h3>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-2">{errors.length}</p>
                <p className="text-sm text-red-600">Must be fixed before export</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold text-yellow-800">Warnings</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{warnings.length}</p>
                <p className="text-sm text-yellow-600">Recommended to review</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-800">Suggestions</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">{suggestions.length}</p>
                <p className="text-sm text-blue-600">Improvements available</p>
              </div>
            </div>

            {overallStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Action Required:</strong> {errors.length} critical error{errors.length !== 1 ? 's' : ''} must be resolved before you can export your data.
                </AlertDescription>
              </Alert>
            )}

            {overallStatus === 'warning' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Review Recommended:</strong> {warnings.length} warning{warnings.length !== 1 ? 's' : ''} detected. Your data can be exported, but reviewing these items is recommended.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-3">
            {errorsByEntity.clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No issues found with client data
              </div>
            ) : (
              errorsByEntity.clients.map(renderValidationItem)
            )}
          </TabsContent>

          <TabsContent value="workers" className="space-y-3">
            {errorsByEntity.workers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No issues found with worker data
              </div>
            ) : (
              errorsByEntity.workers.map(renderValidationItem)
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3">
            {errorsByEntity.tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No issues found with task data
              </div>
            ) : (
              errorsByEntity.tasks.map(renderValidationItem)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}