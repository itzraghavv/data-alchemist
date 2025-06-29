export interface Client {
  ClientID: string;
  Name: string;
  Location: string;
  ContactInfo: string;
  RequestedTaskIDs: string[];
  AttributesJSON: Record<string, any>;
}

export interface Worker {
  WorkerID: string;
  Name: string;
  Location: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  AttributesJSON: Record<string, any>;
}

export interface Task {
  TaskID: string;
  Name: string;
  RequiredSkills: string[];
  Duration: number;
  PriorityLevel: number;
  PreferredPhases: number[];
  MaxConcurrent: number;
  CoRunGroupID?: string;
  AttributesJSON: Record<string, any>;
}

export interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  entity: 'clients' | 'workers' | 'tasks';
  rowId: string;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  active: boolean;
}

export interface PrioritySettings {
  costOptimization: number;
  timeEfficiency: number;
  qualityAssurance: number;
  resourceUtilization: number;
  clientSatisfaction: number;
}

export interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  businessRules: BusinessRule[];
  prioritySettings: PrioritySettings;
  isLoading: boolean;
}