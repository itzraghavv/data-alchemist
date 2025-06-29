import { Client, Worker, Task, ValidationError } from '@/types/data';

export function validateData(
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate clients
  errors.push(...validateClients(clients));
  
  // Validate workers
  errors.push(...validateWorkers(workers));
  
  // Validate tasks
  errors.push(...validateTasks(tasks));
  
  // Cross-entity validations
  errors.push(...validateCrossEntityReferences(clients, workers, tasks));
  
  return errors;
}

function validateClients(clients: Client[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  clients.forEach((client, index) => {
    const rowId = client.ClientID || `row_${index}`;

    // Missing required fields
    if (!client.ClientID) {
      errors.push({
        id: `client_${index}_no_id`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'ClientID',
        message: 'ClientID is required',
        suggestion: 'Add a unique identifier for this client'
      });
    }

    if (!client.Name) {
      errors.push({
        id: `client_${index}_no_name`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'Name',
        message: 'Client name is required',
        suggestion: 'Add a name for this client'
      });
    }

    // Duplicate IDs
    if (client.ClientID && seenIds.has(client.ClientID)) {
      errors.push({
        id: `client_${index}_duplicate_id`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'ClientID',
        message: `Duplicate ClientID: ${client.ClientID}`,
        suggestion: 'Change to a unique identifier'
      });
    } else if (client.ClientID) {
      seenIds.add(client.ClientID);
    }

    // Validate JSON
    if (client.AttributesJSON && typeof client.AttributesJSON !== 'object') {
      errors.push({
        id: `client_${index}_invalid_json`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'AttributesJSON',
        message: 'Invalid JSON format in AttributesJSON',
        suggestion: 'Fix JSON syntax or leave empty'
      });
    }
  });

  return errors;
}

function validateWorkers(workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  workers.forEach((worker, index) => {
    const rowId = worker.WorkerID || `row_${index}`;

    // Missing required fields
    if (!worker.WorkerID) {
      errors.push({
        id: `worker_${index}_no_id`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'WorkerID',
        message: 'WorkerID is required',
        suggestion: 'Add a unique identifier for this worker'
      });
    }

    if (!worker.Name) {
      errors.push({
        id: `worker_${index}_no_name`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'Name',
        message: 'Worker name is required',
        suggestion: 'Add a name for this worker'
      });
    }

    // Duplicate IDs
    if (worker.WorkerID && seenIds.has(worker.WorkerID)) {
      errors.push({
        id: `worker_${index}_duplicate_id`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'WorkerID',
        message: `Duplicate WorkerID: ${worker.WorkerID}`,
        suggestion: 'Change to a unique identifier'
      });
    } else if (worker.WorkerID) {
      seenIds.add(worker.WorkerID);
    }

    // Validate AvailableSlots
    if (!Array.isArray(worker.AvailableSlots) || worker.AvailableSlots.length === 0) {
      errors.push({
        id: `worker_${index}_no_slots`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'AvailableSlots',
        message: 'AvailableSlots must be a non-empty array of numbers',
        suggestion: 'Add available time slots as numbers'
      });
    }

    // Validate MaxLoadPerPhase
    if (worker.MaxLoadPerPhase < 1) {
      errors.push({
        id: `worker_${index}_invalid_load`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase must be at least 1',
        suggestion: 'Set to a positive number'
      });
    }

    // Check for overloaded workers
    if (worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
      errors.push({
        id: `worker_${index}_overloaded`,
        type: 'warning',
        entity: 'workers',
        rowId,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase exceeds available slots',
        suggestion: 'Reduce MaxLoadPerPhase or add more available slots'
      });
    }

    // Validate JSON
    if (worker.AttributesJSON && typeof worker.AttributesJSON !== 'object') {
      errors.push({
        id: `worker_${index}_invalid_json`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'AttributesJSON',
        message: 'Invalid JSON format in AttributesJSON',
        suggestion: 'Fix JSON syntax or leave empty'
      });
    }
  });

  return errors;
}

function validateTasks(tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();
  const coRunGroups = new Map<string, string[]>();

  tasks.forEach((task, index) => {
    const rowId = task.TaskID || `row_${index}`;

    // Missing required fields
    if (!task.TaskID) {
      errors.push({
        id: `task_${index}_no_id`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'TaskID',
        message: 'TaskID is required',
        suggestion: 'Add a unique identifier for this task'
      });
    }

    if (!task.Name) {
      errors.push({
        id: `task_${index}_no_name`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'Name',
        message: 'Task name is required',
        suggestion: 'Add a name for this task'
      });
    }

    // Duplicate IDs
    if (task.TaskID && seenIds.has(task.TaskID)) {
      errors.push({
        id: `task_${index}_duplicate_id`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'TaskID',
        message: `Duplicate TaskID: ${task.TaskID}`,
        suggestion: 'Change to a unique identifier'
      });
    } else if (task.TaskID) {
      seenIds.add(task.TaskID);
    }

    // Validate ranges
    if (task.PriorityLevel < 1 || task.PriorityLevel > 5) {
      errors.push({
        id: `task_${index}_invalid_priority`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'PriorityLevel',
        message: 'PriorityLevel must be between 1 and 5',
        suggestion: 'Set priority between 1 (low) and 5 (high)'
      });
    }

    if (task.Duration < 1) {
      errors.push({
        id: `task_${index}_invalid_duration`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'Duration',
        message: 'Duration must be at least 1',
        suggestion: 'Set to a positive number of time units'
      });
    }

    if (task.MaxConcurrent < 1) {
      errors.push({
        id: `task_${index}_invalid_concurrent`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'MaxConcurrent',
        message: 'MaxConcurrent must be at least 1',
        suggestion: 'Set to a positive number'
      });
    }

    // Track co-run groups for circular dependency check
    if (task.CoRunGroupID && task.TaskID) {
      if (!coRunGroups.has(task.CoRunGroupID)) {
        coRunGroups.set(task.CoRunGroupID, []);
      }
      coRunGroups.get(task.CoRunGroupID)!.push(task.TaskID);
    }

    // Validate JSON
    if (task.AttributesJSON && typeof task.AttributesJSON !== 'object') {
      errors.push({
        id: `task_${index}_invalid_json`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'AttributesJSON',
        message: 'Invalid JSON format in AttributesJSON',
        suggestion: 'Fix JSON syntax or leave empty'
      });
    }
  });

  // Check for circular co-run groups
  coRunGroups.forEach((taskIds, groupId) => {
    if (taskIds.length > 1) {
      // For simplicity, we'll flag groups with more than one task as potential circular dependencies
      errors.push({
        id: `corun_group_${groupId}_circular`,
        type: 'warning',
        entity: 'tasks',
        rowId: taskIds[0],
        field: 'CoRunGroupID',
        message: `Potential circular dependency in co-run group ${groupId}`,
        suggestion: 'Review co-run group dependencies'
      });
    }
  });

  return errors;
}

function validateCrossEntityReferences(
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const taskIds = new Set(tasks.map(t => t.TaskID).filter(Boolean));
  const allSkills = new Set(workers.flatMap(w => w.Skills));

  // Validate client task references
  clients.forEach((client, index) => {
    const rowId = client.ClientID || `row_${index}`;
    
    client.RequestedTaskIDs.forEach(taskId => {
      if (!taskIds.has(taskId)) {
        errors.push({
          id: `client_${index}_unknown_task_${taskId}`,
          type: 'error',
          entity: 'clients',
          rowId,
          field: 'RequestedTaskIDs',
          message: `Unknown task reference: ${taskId}`,
          suggestion: 'Remove reference or add the missing task'
        });
      }
    });
  });

  // Validate task skill coverage
  tasks.forEach((task, index) => {
    const rowId = task.TaskID || `row_${index}`;
    
    task.RequiredSkills.forEach(skill => {
      if (!allSkills.has(skill)) {
        errors.push({
          id: `task_${index}_missing_skill_${skill}`,
          type: 'warning',
          entity: 'tasks',
          rowId,
          field: 'RequiredSkills',
          message: `No workers have required skill: ${skill}`,
          suggestion: 'Add workers with this skill or remove the requirement'
        });
      }
    });

    // Check max concurrency feasibility
    const qualifiedWorkers = workers.filter(w => 
      task.RequiredSkills.every(skill => w.Skills.includes(skill))
    );
    
    if (qualifiedWorkers.length < task.MaxConcurrent) {
      errors.push({
        id: `task_${index}_insufficient_workers`,
        type: 'warning',
        entity: 'tasks',
        rowId,
        field: 'MaxConcurrent',
        message: `MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
        suggestion: 'Reduce MaxConcurrent or add more qualified workers'
      });
    }
  });

  return errors;
}