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
  
  // AI-powered header mapping
  const clientPatterns = ['clientid', 'client_id', 'client id', 'requestedtaskids', 'requested_task_ids'];
  const workerPatterns = ['workerid', 'worker_id', 'worker id', 'availableslots', 'available_slots', 'maxloadperphase'];
  const taskPatterns = ['taskid', 'task_id', 'task id', 'requiredskills', 'prioritylevel', 'maxconcurrent'];

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
      Name: findValue(row, ['Name', 'ClientName', 'Client Name']) || '',
      Location: findValue(row, ['Location', 'Address', 'City']) || '',
      ContactInfo: findValue(row, ['ContactInfo', 'Contact', 'Email', 'Phone']) || '',
      RequestedTaskIDs: parseArray(findValue(row, ['RequestedTaskIDs', 'Requested Task IDs', 'TaskIDs'])),
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON'])) || {},
    };
    return client;
  });
}

function parseWorkers(data: any[]): Worker[] {
  return data.map((row, index) => {
    const worker: Worker = {
      WorkerID: findValue(row, ['WorkerID', 'worker_id', 'Worker ID', 'ID']) || `worker_${index + 1}`,
      Name: findValue(row, ['Name', 'WorkerName', 'Worker Name']) || '',
      Location: findValue(row, ['Location', 'Address', 'City']) || '',
      Skills: parseArray(findValue(row, ['Skills', 'Skill', 'Abilities'])),
      AvailableSlots: parseNumberArray(findValue(row, ['AvailableSlots', 'Available Slots', 'Slots'])),
      MaxLoadPerPhase: parseInt(findValue(row, ['MaxLoadPerPhase', 'Max Load', 'MaxLoad'])) || 1,
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON'])) || {},
    };
    return worker;
  });
}

function parseTasks(data: any[]): Task[] {
  return data.map((row, index) => {
    const task: Task = {
      TaskID: findValue(row, ['TaskID', 'task_id', 'Task ID', 'ID']) || `task_${index + 1}`,
      Name: findValue(row, ['Name', 'TaskName', 'Task Name', 'Title']) || '',
      RequiredSkills: parseArray(findValue(row, ['RequiredSkills', 'Required Skills', 'Skills'])),
      Duration: parseInt(findValue(row, ['Duration', 'Time', 'Hours'])) || 1,
      PriorityLevel: parseInt(findValue(row, ['PriorityLevel', 'Priority', 'Level'])) || 1,
      PreferredPhases: parseNumberArray(findValue(row, ['PreferredPhases', 'Preferred Phases', 'Phases'])),
      MaxConcurrent: parseInt(findValue(row, ['MaxConcurrent', 'Max Concurrent', 'Concurrent'])) || 1,
      CoRunGroupID: findValue(row, ['CoRunGroupID', 'Co Run Group', 'GroupID']),
      AttributesJSON: parseJSON(findValue(row, ['AttributesJSON', 'Attributes', 'JSON'])) || {},
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