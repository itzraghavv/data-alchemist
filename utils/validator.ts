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
  
  // Advanced validations
  errors.push(...validateAdvancedConstraints(clients, workers, tasks));
  
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

    if (!client.ClientName) {
      errors.push({
        id: `client_${index}_no_name`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'ClientName',
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

    // Priority level validation
    if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
      errors.push({
        id: `client_${index}_invalid_priority`,
        type: 'error',
        entity: 'clients',
        rowId,
        field: 'PriorityLevel',
        message: 'PriorityLevel must be between 1 and 5',
        suggestion: 'Set priority between 1 (low) and 5 (high)'
      });
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

    if (!worker.WorkerName) {
      errors.push({
        id: `worker_${index}_no_name`,
        type: 'error',
        entity: 'workers',
        rowId,
        field: 'WorkerName',
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
    } else {
      // Check for non-numeric slots
      const invalidSlots = worker.AvailableSlots.filter(slot => typeof slot !== 'number' || isNaN(slot));
      if (invalidSlots.length > 0) {
        errors.push({
          id: `worker_${index}_invalid_slots`,
          type: 'error',
          entity: 'workers',
          rowId,
          field: 'AvailableSlots',
          message: 'AvailableSlots contains non-numeric values',
          suggestion: 'Ensure all slots are valid numbers'
        });
      }
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

    if (!task.TaskName) {
      errors.push({
        id: `task_${index}_no_name`,
        type: 'error',
        entity: 'tasks',
        rowId,
        field: 'TaskName',
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

    // Validate Duration
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

function validateAdvancedConstraints(
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Phase-slot saturation check
  const phaseSlotMap = new Map<number, number>();
  workers.forEach(worker => {
    worker.AvailableSlots.forEach(slot => {
      phaseSlotMap.set(slot, (phaseSlotMap.get(slot) || 0) + worker.MaxLoadPerPhase);
    });
  });

  const phaseDemandMap = new Map<number, number>();
  tasks.forEach(task => {
    task.PreferredPhases.forEach(phase => {
      phaseDemandMap.set(phase, (phaseDemandMap.get(phase) || 0) + task.Duration);
    });
  });

  phaseDemandMap.forEach((demand, phase) => {
    const supply = phaseSlotMap.get(phase) || 0;
    if (demand > supply) {
      errors.push({
        id: `phase_${phase}_oversaturated`,
        type: 'warning',
        entity: 'tasks',
        rowId: 'system',
        message: `Phase ${phase} is oversaturated: demand (${demand}) exceeds supply (${supply})`,
        suggestion: 'Redistribute tasks across phases or add more worker capacity'
      });
    }
  });

  return errors;
}