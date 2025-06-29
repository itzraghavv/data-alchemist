'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit3, Save, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Client, Worker, Task } from '@/types/data';

interface EditingCell {
  entityType: 'clients' | 'workers' | 'tasks';
  id: string;
  field: string;
  value: any;
}

export function DataGrid() {
  const { state, updateClient, updateWorker, updateTask } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery) return state.clients;
    return state.clients.filter(client =>
      Object.values(client).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.clients, searchQuery]);

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return state.workers;
    return state.workers.filter(worker =>
      Object.values(worker).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.workers, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return state.tasks;
    return state.tasks.filter(task =>
      Object.values(task).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.tasks, searchQuery]);

  const startEditing = (entityType: 'clients' | 'workers' | 'tasks', id: string, field: string, value: any) => {
    setEditingCell({ entityType, id, field, value });
    setEditValue(Array.isArray(value) ? value.join(', ') : String(value));
  };

  const saveEdit = () => {
    if (!editingCell) return;

    let processedValue: any = editValue;

    // Process array fields
    if (['RequestedTaskIDs', 'Skills', 'RequiredSkills', 'PreferredPhases', 'AvailableSlots'].includes(editingCell.field)) {
      processedValue = editValue.split(',').map(v => v.trim()).filter(Boolean);
      
      // Convert to numbers for numeric arrays
      if (['PreferredPhases', 'AvailableSlots'].includes(editingCell.field)) {
        processedValue = processedValue.map(v => parseInt(v, 10)).filter(n => !isNaN(n));
      }
    }

    // Process numeric fields
    if (['Duration', 'PriorityLevel', 'MaxConcurrent', 'MaxLoadPerPhase'].includes(editingCell.field)) {
      processedValue = parseInt(editValue, 10);
    }

    // Process JSON fields
    if (editingCell.field === 'AttributesJSON') {
      try {
        processedValue = editValue ? JSON.parse(editValue) : {};
      } catch {
        processedValue = {};
      }
    }

    const update = { [editingCell.field]: processedValue };

    switch (editingCell.entityType) {
      case 'clients':
        updateClient(editingCell.id, update);
        break;
      case 'workers':
        updateWorker(editingCell.id, update);
        break;
      case 'tasks':
        updateTask(editingCell.id, update);
        break;
    }

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getErrorsForEntity = (entityType: string, id: string) => {
    return state.validationErrors.filter(error => 
      error.entity === entityType && error.rowId === id
    );
  };

  const getCellClassName = (entityType: string, id: string, field?: string) => {
    const errors = getErrorsForEntity(entityType, id);
    const fieldErrors = field ? errors.filter(e => e.field === field) : errors;
    
    if (fieldErrors.some(e => e.type === 'error')) {
      return 'bg-red-50 border-red-200';
    }
    if (fieldErrors.some(e => e.type === 'warning')) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return '';
  };

  const renderEditableCell = (
    entityType: 'clients' | 'workers' | 'tasks',
    id: string,
    field: string,
    value: any
  ) => {
    const isEditing = editingCell?.entityType === entityType && 
                     editingCell?.id === id && 
                     editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className={`group flex items-center justify-between cursor-pointer p-2 rounded transition-colors hover:bg-accent/50 ${getCellClassName(entityType, id, field)}`}
        onClick={() => startEditing(entityType, id, field, value)}
      >
        <span className="text-sm truncate">
          {Array.isArray(value) ? value.join(', ') : String(value)}
        </span>
        <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search across all data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="relative">
            Clients
            {state.clients.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {filteredClients.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workers" className="relative">
            Workers
            {state.workers.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {filteredWorkers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="relative">
            Tasks
            {state.tasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {filteredTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clients Data</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No client data available. Upload a clients file to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Client ID</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Location</th>
                        <th className="text-left p-2 font-medium">Contact Info</th>
                        <th className="text-left p-2 font-medium">Requested Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.ClientID} className={`border-b hover:bg-muted/50 ${getCellClassName('clients', client.ClientID)}`}>
                          <td className="p-2">
                            {renderEditableCell('clients', client.ClientID, 'ClientID', client.ClientID)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('clients', client.ClientID, 'Name', client.Name)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('clients', client.ClientID, 'Location', client.Location)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('clients', client.ClientID, 'ContactInfo', client.ContactInfo)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('clients', client.ClientID, 'RequestedTaskIDs', client.RequestedTaskIDs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workers Data</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No worker data available. Upload a workers file to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Worker ID</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Location</th>
                        <th className="text-left p-2 font-medium">Skills</th>
                        <th className="text-left p-2 font-medium">Available Slots</th>
                        <th className="text-left p-2 font-medium">Max Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.WorkerID} className={`border-b hover:bg-muted/50 ${getCellClassName('workers', worker.WorkerID)}`}>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'WorkerID', worker.WorkerID)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'Name', worker.Name)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'Location', worker.Location)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'Skills', worker.Skills)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'AvailableSlots', worker.AvailableSlots)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('workers', worker.WorkerID, 'MaxLoadPerPhase', worker.MaxLoadPerPhase)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Data</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task data available. Upload a tasks file to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Task ID</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Required Skills</th>
                        <th className="text-left p-2 font-medium">Duration</th>
                        <th className="text-left p-2 font-medium">Priority</th>
                        <th className="text-left p-2 font-medium">Preferred Phases</th>
                        <th className="text-left p-2 font-medium">Max Concurrent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.TaskID} className={`border-b hover:bg-muted/50 ${getCellClassName('tasks', task.TaskID)}`}>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'TaskID', task.TaskID)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'Name', task.Name)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'RequiredSkills', task.RequiredSkills)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'Duration', task.Duration)}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {renderEditableCell('tasks', task.TaskID, 'PriorityLevel', task.PriorityLevel)}
                              <Badge variant={task.PriorityLevel >= 4 ? 'destructive' : task.PriorityLevel >= 3 ? 'default' : 'secondary'}>
                                {task.PriorityLevel}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'PreferredPhases', task.PreferredPhases)}
                          </td>
                          <td className="p-2">
                            {renderEditableCell('tasks', task.TaskID, 'MaxConcurrent', task.MaxConcurrent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}