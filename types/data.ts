export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string[];
  GroupTag: string;
  AttributesJSON: Record<string, any>;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
  AttributesJSON: Record<string, any>;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string[];
  PreferredPhases: number[];
  MaxConcurrent: number;
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
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride' | 'custom';
  parameters: Record<string, any>;
  priority: number;
  active: boolean;
  createdAt: string;
}

export interface RuleSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  parameters: Record<string, any>;
  reasoning: string;
}

export interface PrioritySettings {
  priorityLevel: number;
  taskFulfillment: number;
  fairnessConstraints: number;
  skillMatching: number;
  phaseOptimization: number;
  workloadBalance: number;
  clientSatisfaction: number;
  resourceUtilization: number;
}

export interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  businessRules: BusinessRule[];
  ruleSuggestions: RuleSuggestion[];
  prioritySettings: PrioritySettings;
  priorityProfile: string;
  isLoading: boolean;
}