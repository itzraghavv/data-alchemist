'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { DataState, Client, Worker, Task, ValidationError, BusinessRule, RuleSuggestion, PrioritySettings } from '@/types/data';

interface DataContextType {
  state: DataState;
  updateClients: (clients: Client[]) => void;
  updateWorkers: (workers: Worker[]) => void;
  updateTasks: (tasks: Task[]) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  updateWorker: (id: string, worker: Partial<Worker>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  addBusinessRule: (rule: BusinessRule) => void;
  updateBusinessRule: (id: string, rule: Partial<BusinessRule>) => void;
  deleteBusinessRule: (id: string) => void;
  setRuleSuggestions: (suggestions: RuleSuggestion[]) => void;
  acceptRuleSuggestion: (suggestionId: string) => void;
  dismissRuleSuggestion: (suggestionId: string) => void;
  setPrioritySettings: (settings: PrioritySettings) => void;
  setPriorityProfile: (profile: string) => void;
  setLoading: (loading: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

type DataAction =
  | { type: 'UPDATE_CLIENTS'; payload: Client[] }
  | { type: 'UPDATE_WORKERS'; payload: Worker[] }
  | { type: 'UPDATE_TASKS'; payload: Task[] }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; client: Partial<Client> } }
  | { type: 'UPDATE_WORKER'; payload: { id: string; worker: Partial<Worker> } }
  | { type: 'UPDATE_TASK'; payload: { id: string; task: Partial<Task> } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'ADD_BUSINESS_RULE'; payload: BusinessRule }
  | { type: 'UPDATE_BUSINESS_RULE'; payload: { id: string; rule: Partial<BusinessRule> } }
  | { type: 'DELETE_BUSINESS_RULE'; payload: string }
  | { type: 'SET_RULE_SUGGESTIONS'; payload: RuleSuggestion[] }
  | { type: 'ACCEPT_RULE_SUGGESTION'; payload: string }
  | { type: 'DISMISS_RULE_SUGGESTION'; payload: string }
  | { type: 'SET_PRIORITY_SETTINGS'; payload: PrioritySettings }
  | { type: 'SET_PRIORITY_PROFILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: DataState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  businessRules: [],
  ruleSuggestions: [],
  prioritySettings: {
    priorityLevel: 25,
    taskFulfillment: 20,
    fairnessConstraints: 15,
    skillMatching: 15,
    phaseOptimization: 10,
    workloadBalance: 10,
    clientSatisfaction: 3,
    resourceUtilization: 2,
  },
  priorityProfile: 'balanced',
  isLoading: false,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'UPDATE_CLIENTS':
      return { ...state, clients: action.payload };
    case 'UPDATE_WORKERS':
      return { ...state, workers: action.payload };
    case 'UPDATE_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.ClientID === action.payload.id
            ? { ...client, ...action.payload.client }
            : client
        ),
      };
    case 'UPDATE_WORKER':
      return {
        ...state,
        workers: state.workers.map(worker =>
          worker.WorkerID === action.payload.id
            ? { ...worker, ...action.payload.worker }
            : worker
        ),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.TaskID === action.payload.id
            ? { ...task, ...action.payload.task }
            : task
        ),
      };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'ADD_BUSINESS_RULE':
      return { ...state, businessRules: [...state.businessRules, action.payload] };
    case 'UPDATE_BUSINESS_RULE':
      return {
        ...state,
        businessRules: state.businessRules.map(rule =>
          rule.id === action.payload.id
            ? { ...rule, ...action.payload.rule }
            : rule
        ),
      };
    case 'DELETE_BUSINESS_RULE':
      return {
        ...state,
        businessRules: state.businessRules.filter(rule => rule.id !== action.payload),
      };
    case 'SET_RULE_SUGGESTIONS':
      return { ...state, ruleSuggestions: action.payload };
    case 'ACCEPT_RULE_SUGGESTION':
      const suggestion = state.ruleSuggestions.find(s => s.id === action.payload);
      if (suggestion) {
        const newRule: BusinessRule = {
          id: `rule_${Date.now()}`,
          name: suggestion.title,
          description: suggestion.description,
          type: suggestion.type as any,
          parameters: suggestion.parameters,
          priority: 50,
          active: true,
          createdAt: new Date().toISOString()
        };
        return {
          ...state,
          businessRules: [...state.businessRules, newRule],
          ruleSuggestions: state.ruleSuggestions.filter(s => s.id !== action.payload)
        };
      }
      return state;
    case 'DISMISS_RULE_SUGGESTION':
      return {
        ...state,
        ruleSuggestions: state.ruleSuggestions.filter(s => s.id !== action.payload)
      };
    case 'SET_PRIORITY_SETTINGS':
      return { ...state, prioritySettings: action.payload };
    case 'SET_PRIORITY_PROFILE':
      return { ...state, priorityProfile: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const contextValue: DataContextType = {
    state,
    updateClients: (clients) => dispatch({ type: 'UPDATE_CLIENTS', payload: clients }),
    updateWorkers: (workers) => dispatch({ type: 'UPDATE_WORKERS', payload: workers }),
    updateTasks: (tasks) => dispatch({ type: 'UPDATE_TASKS', payload: tasks }),
    updateClient: (id, client) => dispatch({ type: 'UPDATE_CLIENT', payload: { id, client } }),
    updateWorker: (id, worker) => dispatch({ type: 'UPDATE_WORKER', payload: { id, worker } }),
    updateTask: (id, task) => dispatch({ type: 'UPDATE_TASK', payload: { id, task } }),
    setValidationErrors: (errors) => dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors }),
    addBusinessRule: (rule) => dispatch({ type: 'ADD_BUSINESS_RULE', payload: rule }),
    updateBusinessRule: (id, rule) => dispatch({ type: 'UPDATE_BUSINESS_RULE', payload: { id, rule } }),
    deleteBusinessRule: (id) => dispatch({ type: 'DELETE_BUSINESS_RULE', payload: id }),
    setRuleSuggestions: (suggestions) => dispatch({ type: 'SET_RULE_SUGGESTIONS', payload: suggestions }),
    acceptRuleSuggestion: (suggestionId) => dispatch({ type: 'ACCEPT_RULE_SUGGESTION', payload: suggestionId }),
    dismissRuleSuggestion: (suggestionId) => dispatch({ type: 'DISMISS_RULE_SUGGESTION', payload: suggestionId }),
    setPrioritySettings: (settings) => dispatch({ type: 'SET_PRIORITY_SETTINGS', payload: settings }),
    setPriorityProfile: (profile) => dispatch({ type: 'SET_PRIORITY_PROFILE', payload: profile }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}