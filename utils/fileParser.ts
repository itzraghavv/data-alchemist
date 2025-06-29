import * as XLSX from 'xlsx';
import { Client, Worker, Task } from '@/types/data';

export async function parseFile(file: File): Promise<{
  clients?: Client[];
  workers?: Worker[];
  tasks?: Task[];
  error?: string;
}> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return { error: 'File appears to be empty' };
    }

    // Detect entity type based on headers
    const headers = Object.keys(jsonData[0] as any);
    const entityType = detectEntityType(headers);

    switch (entityType) {
      case 'clients':
        return { clients: parseClients(jsonData) };
      case 'workers':
        return { workers: parseWorkers(jsonData) };
      case 'tasks':
        return { tasks: parseTasks(jsonData) };
      default:
        return { error: 'Could not determine data type from file headers' };
    }
  } catch (error) {
    return { error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

function detectEntityType(headers: string[]): 'clients' | 'workers' | 'tasks' | null {
  const headerLower = headers.map(h => h.toLowerCase());
  
  // Enhanced AI-powered header mapping
  const clientPatterns = ['clientid', 'client_id', 'client id', 'clientname', 'client_name', 'requestedtaskids', 'requested_task_ids', 'grouptag', 'group_tag'];
  const workerPatterns = ['workerid', 'worker_id', 'worker id', 'workername', 'worker_name', 'availableslots', 'available_slots', 'maxloadperphase', 'workergroup', 'worker_group', 'qualificationlevel'];
  const taskPatterns = ['taskid', 'task_id', 'task id', 'taskname', 'task_name', 'category', 'duration', 'requiredskills', 'required_skills', 'preferredphases', 'preferred_phases', 'maxconcurrent', 'max_concurrent'];

  if (clientPatterns.some(pattern => headerLower.some(h => h.includes(pattern)))) {
    return 'clients';
  }
  if (workerPatterns.some(pattern => headerLower.some(h => h.includes(pattern)))) {
    return 'workers';
  }
  if (taskPatterns.some(pattern => headerLower.some(h => h.includes(pattern)))) {
    return 'tasks';
  }

  return null;
}

function parseClients(data: any[]): Client[] {
  return data.map((row, index) => {
    const client: Client = {
      ClientID: findValue(row, ['ClientID', 'client_id', 'Client ID', 'ID']) || `client_${index + 1}`,
      ClientName: findValue(row, ['ClientName', 'Client Name', 'Name', 'client_name']) || '',
      PriorityLevel: parseInt(findValue(row, ['PriorityLevel', 'Priority Level', 'Priority', 'priority_level'])) || 1,
      RequestedTaskIDs: parseArray(findValue(row, ['RequestedTaskIDs', 'Requested Task IDs', 'TaskIDs', 'requested_task_ids'])),
      GroupTag: findValue(row, ['GroupTag', 'Group Tag', 'Group', 'group_tag']) || '',
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON', 'attributes_json'])) || {},
    };
    return client;
  });
}

function parseWorkers(data: any[]): Worker[] {
  return data.map((row, index) => {
    const worker: Worker = {
      WorkerID: findValue(row, ['WorkerID', 'worker_id', 'Worker ID', 'ID']) || `worker_${index + 1}`,
      WorkerName: findValue(row, ['WorkerName', 'Worker Name', 'Name', 'worker_name']) || '',
      Skills: parseArray(findValue(row, ['Skills', 'Skill', 'Abilities', 'skills'])),
      AvailableSlots: parseNumberArray(findValue(row, ['AvailableSlots', 'Available Slots', 'Slots', 'available_slots'])),
      MaxLoadPerPhase: parseInt(findValue(row, ['MaxLoadPerPhase', 'Max Load Per Phase', 'MaxLoad', 'max_load_per_phase'])) || 1,
      WorkerGroup: findValue(row, ['WorkerGroup', 'Worker Group', 'Group', 'worker_group']) || '',
      QualificationLevel: parseInt(findValue(row, ['QualificationLevel', 'Qualification Level', 'Level', 'qualification_level'])) || 1,
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON', 'attributes_json'])) || {},
    };
    return worker;
  });
}

function parseTasks(data: any[]): Task[] {
  return data.map((row, index) => {
    const task: Task = {
      TaskID: findValue(row, ['TaskID', 'task_id', 'Task ID', 'ID']) || `task_${index + 1}`,
      TaskName: findValue(row, ['TaskName', 'Task Name', 'Name', 'Title', 'task_name']) || '',
      Category: findValue(row, ['Category', 'Type', 'category']) || '',
      Duration: parseInt(findValue(row, ['Duration', 'Time', 'Hours', 'duration'])) || 1,
      RequiredSkills: parseArray(findValue(row, ['RequiredSkills', 'Required Skills', 'Skills', 'required_skills'])),
      PreferredPhases: parsePhases(findValue(row, ['PreferredPhases', 'Preferred Phases', 'Phases', 'preferred_phases'])),
      MaxConcurrent: parseInt(findValue(row, ['MaxConcurrent', 'Max Concurrent', 'Concurrent', 'max_concurrent'])) || 1,
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON', 'attributes_json'])) || {},
    };
    return task;
  });
}

function findValue(row: any, keys: string[]): any {
  for (const key of keys) {
    const exactMatch = row[key];
    if (exactMatch !== undefined) return exactMatch;
    
    // Case-insensitive search
    const caseInsensitiveKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
    if (caseInsensitiveKey && row[caseInsensitiveKey] !== undefined) {
      return row[caseInsensitiveKey];
    }
  }
  return undefined;
}

function parseArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // Try comma-separated values
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [String(value)];
}

function parseNumberArray(value: any): number[] {
  const stringArray = parseArray(value);
  return stringArray.map(s => parseInt(s, 10)).filter(n => !isNaN(n));
}

function parsePhases(value: any): number[] {
  if (!value) return [];
  
  // Handle range syntax like "1-3" or "2-5"
  if (typeof value === 'string' && value.includes('-')) {
    const [start, end] = value.split('-').map(s => parseInt(s.trim(), 10));
    if (!isNaN(start) && !isNaN(end)) {
      const phases = [];
      for (let i = start; i <= end; i++) {
        phases.push(i);
      }
      return phases;
    }
  }
  
  // Handle array or comma-separated values
  return parseNumberArray(value);
}

function parseJSON(value: any): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}