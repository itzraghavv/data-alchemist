"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Edit3,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Client, Worker, Task } from "@/types/data";
import { validateData } from "@/utils/validator";

interface EditingCell {
  entityType: "clients" | "workers" | "tasks";
  id: string;
  field: string;
  value: any;
}

export function DataGrid() {
  const { state, updateClient, updateWorker, updateTask, setValidationErrors } =
    useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [recentlyEdited, setRecentlyEdited] = useState<Set<string>>(new Set());

  const filteredClients = useMemo(() => {
    if (!searchQuery) return state.clients;
    return state.clients.filter((client) =>
      Object.values(client).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.clients, searchQuery]);

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return state.workers;
    return state.workers.filter((worker) =>
      Object.values(worker).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.workers, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return state.tasks;
    return state.tasks.filter((task) =>
      Object.values(task).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [state.tasks, searchQuery]);

  useEffect(() => {
    if (recentlyEdited.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyEdited(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyEdited]);

  const startEditing = (
    entityType: "clients" | "workers" | "tasks",
    id: string,
    field: string,
    value: any
  ) => {
    setEditingCell({ entityType, id, field, value });
    setEditValue(Array.isArray(value) ? value.join(", ") : String(value));
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    let processedValue: any = editValue;

    if (
      [
        "RequestedTaskIDs",
        "Skills",
        "RequiredSkills",
        "PreferredPhases",
        "AvailableSlots",
      ].includes(editingCell.field)
    ) {
      processedValue = editValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      if (["PreferredPhases", "AvailableSlots"].includes(editingCell.field)) {
        processedValue = processedValue
          .map((v: string) => parseInt(v, 10))
          .filter((n: number) => !isNaN(n));
      }
    }

    if (
      [
        "Duration",
        "PriorityLevel",
        "MaxConcurrent",
        "MaxLoadPerPhase",
        "QualificationLevel",
      ].includes(editingCell.field)
    ) {
      processedValue = parseInt(editValue, 10);
    }

    if (editingCell.field === "AttributesJSON") {
      try {
        processedValue = editValue ? JSON.parse(editValue) : {};
      } catch {
        processedValue = {};
      }
    }

    const update = { [editingCell.field]: processedValue };
    const cellKey = `${editingCell.entityType}_${editingCell.id}_${editingCell.field}`;

    setRecentlyEdited((prev) => {
      const newSet = new Set(prev);
      newSet.add(cellKey);
      return newSet;
    });

    switch (editingCell.entityType) {
      case "clients":
        updateClient(editingCell.id, update);
        break;
      case "workers":
        updateWorker(editingCell.id, update);
        break;
      case "tasks":
        updateTask(editingCell.id, update);
        break;
    }

    // Re-run validation after edit
    setTimeout(() => {
      const errors = validateData(state.clients, state.workers, state.tasks);
      setValidationErrors(errors);
    }, 100);

    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const getErrorsForEntity = (entityType: string, id: string) => {
    return state.validationErrors.filter(
      (error) => error.entity === entityType && error.rowId === id
    );
  };

  const getFieldErrors = (entityType: string, id: string, field: string) => {
    return state.validationErrors.filter(
      (error) =>
        error.entity === entityType &&
        error.rowId === id &&
        error.field === field
    );
  };

  const getCellClassName = (entityType: string, id: string, field?: string) => {
    const cellKey = `${entityType}_${id}_${field}`;
    const isRecentlyEdited = recentlyEdited.has(cellKey);

    if (isRecentlyEdited) {
      return "bg-green-50 border-green-200 animate-pulse";
    }

    if (field) {
      const fieldErrors = getFieldErrors(entityType, id, field);
      if (fieldErrors.some((e) => e.type === "error")) {
        return "bg-red-50 border-red-200 border-2";
      }
      if (fieldErrors.some((e) => e.type === "warning")) {
        return "bg-yellow-50 border-yellow-200 border-2";
      }
    } else {
      const errors = getErrorsForEntity(entityType, id);
      if (errors.some((e) => e.type === "error")) {
        return "bg-red-50 border-red-200";
      }
      if (errors.some((e) => e.type === "warning")) {
        return "bg-yellow-50 border-yellow-200";
      }
    }

    return "";
  };

  const renderValidationIcon = (
    entityType: string,
    id: string,
    field: string
  ) => {
    const fieldErrors = getFieldErrors(entityType, id, field);
    if (fieldErrors.length === 0) return null;

    const hasError = fieldErrors.some((e) => e.type === "error");
    const hasWarning = fieldErrors.some((e) => e.type === "warning");

    return (
      <div className="flex items-center gap-1 ml-2">
        {hasError && <AlertCircle className="h-3 w-3 text-red-500" />}
        {hasWarning && !hasError && (
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
        )}
      </div>
    );
  };

  const renderEditableCell = (
    entityType: "clients" | "workers" | "tasks",
    id: string,
    field: string,
    value: any
  ) => {
    const isEditing =
      editingCell?.entityType === entityType &&
      editingCell?.id === id &&
      editingCell?.field === field;

    const fieldErrors = getFieldErrors(entityType, id, field);
    const hasValidationIssues = fieldErrors.length > 0;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={saveEdit}
            className="h-8 w-8 p-0"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className={`group flex items-center justify-between cursor-pointer p-2 rounded transition-all duration-200 hover:bg-accent/50 ${getCellClassName(
          entityType,
          id,
          field
        )}`}
        onClick={() => startEditing(entityType, id, field, value)}
        title={
          hasValidationIssues
            ? fieldErrors.map((e) => e.message).join("; ")
            : undefined
        }
      >
        <span className="text-sm truncate flex-1">
          {Array.isArray(value) ? value.join(", ") : String(value)}
        </span>
        <div className="flex items-center">
          {renderValidationIcon(entityType, id, field)}
          <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
            <span>Errors</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span>Warnings</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span>Recently Edited</span>
          </div>
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
            {getErrorsForEntity("clients", "").length > 0 && (
              <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="workers" className="relative">
            Workers
            {state.workers.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {filteredWorkers.length}
              </Badge>
            )}
            {state.validationErrors.some((e) => e.entity === "workers") && (
              <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="relative">
            Tasks
            {state.tasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {filteredTasks.length}
              </Badge>
            )}
            {state.validationErrors.some((e) => e.entity === "tasks") && (
              <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Clients Data</span>
                {state.validationErrors.filter((e) => e.entity === "clients")
                  .length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "clients" && e.type === "error"
                      ).length
                    }{" "}
                    errors,{" "}
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "clients" && e.type === "warning"
                      ).length
                    }{" "}
                    warnings
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No client data available. Upload a clients file to get
                  started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Client ID</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Priority</th>
                        <th className="text-left p-2 font-medium">
                          Requested Tasks
                        </th>
                        <th className="text-left p-2 font-medium">Group Tag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr
                          key={client.ClientID}
                          className={`border-b hover:bg-muted/50 transition-colors ${getCellClassName(
                            "clients",
                            client.ClientID
                          )}`}
                        >
                          <td className="p-2">
                            {renderEditableCell(
                              "clients",
                              client.ClientID,
                              "ClientID",
                              client.ClientID
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "clients",
                              client.ClientID,
                              "ClientName",
                              client.ClientName
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {renderEditableCell(
                                "clients",
                                client.ClientID,
                                "PriorityLevel",
                                client.PriorityLevel
                              )}
                              <Badge
                                variant={
                                  client.PriorityLevel >= 4
                                    ? "destructive"
                                    : client.PriorityLevel >= 3
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {client.PriorityLevel}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "clients",
                              client.ClientID,
                              "RequestedTaskIDs",
                              client.RequestedTaskIDs
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "clients",
                              client.ClientID,
                              "GroupTag",
                              client.GroupTag
                            )}
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
              <CardTitle className="flex items-center justify-between">
                <span>Workers Data</span>
                {state.validationErrors.filter((e) => e.entity === "workers")
                  .length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "workers" && e.type === "error"
                      ).length
                    }{" "}
                    errors,{" "}
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "workers" && e.type === "warning"
                      ).length
                    }{" "}
                    warnings
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No worker data available. Upload a workers file to get
                  started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Worker ID</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Skills</th>
                        <th className="text-left p-2 font-medium">
                          Available Slots
                        </th>
                        <th className="text-left p-2 font-medium">Max Load</th>
                        <th className="text-left p-2 font-medium">Group</th>
                        <th className="text-left p-2 font-medium">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => (
                        <tr
                          key={worker.WorkerID}
                          className={`border-b hover:bg-muted/50 transition-colors ${getCellClassName(
                            "workers",
                            worker.WorkerID
                          )}`}
                        >
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "WorkerID",
                              worker.WorkerID
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "WorkerName",
                              worker.WorkerName
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "Skills",
                              worker.Skills
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "AvailableSlots",
                              worker.AvailableSlots
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "MaxLoadPerPhase",
                              worker.MaxLoadPerPhase
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "WorkerGroup",
                              worker.WorkerGroup
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "workers",
                              worker.WorkerID,
                              "QualificationLevel",
                              worker.QualificationLevel
                            )}
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
              <CardTitle className="flex items-center justify-between">
                <span>Tasks Data</span>
                {state.validationErrors.filter((e) => e.entity === "tasks")
                  .length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "tasks" && e.type === "error"
                      ).length
                    }{" "}
                    errors,{" "}
                    {
                      state.validationErrors.filter(
                        (e) => e.entity === "tasks" && e.type === "warning"
                      ).length
                    }{" "}
                    warnings
                  </Badge>
                )}
              </CardTitle>
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
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-left p-2 font-medium">
                          Required Skills
                        </th>
                        <th className="text-left p-2 font-medium">Duration</th>
                        <th className="text-left p-2 font-medium">
                          Preferred Phases
                        </th>
                        <th className="text-left p-2 font-medium">
                          Max Concurrent
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.TaskID}
                          className={`border-b hover:bg-muted/50 transition-colors ${getCellClassName(
                            "tasks",
                            task.TaskID
                          )}`}
                        >
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "TaskID",
                              task.TaskID
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "TaskName",
                              task.TaskName
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "Category",
                              task.Category
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "RequiredSkills",
                              task.RequiredSkills
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "Duration",
                              task.Duration
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "PreferredPhases",
                              task.PreferredPhases
                            )}
                          </td>
                          <td className="p-2">
                            {renderEditableCell(
                              "tasks",
                              task.TaskID,
                              "MaxConcurrent",
                              task.MaxConcurrent
                            )}
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
