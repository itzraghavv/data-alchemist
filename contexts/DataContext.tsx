'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { DataState, Client, Worker, Task, ValidationError, BusinessRule, PrioritySettings } from '@/types/data';

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
  setPrioritySettings: (settings: PrioritySettings) => void;
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
  | { type: 'SET_PRIORITY_SETTINGS'; payload: PrioritySettings }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: DataState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  businessRules: [],
  prioritySettings: {
    costOptimization: 50,
    timeEfficiency: 50,
    qualityAssurance: 50,
    resourceUtilization: 50,
    clientSatisfaction: 50,
  },
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
    case 'SET_PRIORITY_SETTINGS':
      return { ...state, prioritySettings: action.payload };
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
    setPrioritySettings: (settings) => dispatch({ type: 'SET_PRIORITY_SETTINGS', payload: settings }),
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