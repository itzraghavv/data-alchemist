export interface SearchResult {
  entity: 'clients' | 'workers' | 'tasks';
  id: string;
  match: string;
  score: number;
}

export function searchWithNaturalLanguage(
  query: string,
  clients: any[],
  workers: any[],
  tasks: any[]
): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Simple NLP-like processing
  const queryLower = query.toLowerCase();
  const tokens = queryLower.split(/\s+/);
  
  // Extract search criteria
  const criteria = extractSearchCriteria(queryLower, tokens);
  
  // Search tasks
  tasks.forEach(task => {
    const score = scoreTaskMatch(task, criteria, queryLower);
    if (score > 0) {
      results.push({
        entity: 'tasks',
        id: task.TaskID,
        match: generateMatchDescription(task, criteria),
        score
      });
    }
  });
  
  // Search workers
  workers.forEach(worker => {
    const score = scoreWorkerMatch(worker, criteria, queryLower);
    if (score > 0) {
      results.push({
        entity: 'workers',
        id: worker.WorkerID,
        match: generateMatchDescription(worker, criteria),
        score
      });
    }
  });
  
  // Search clients
  clients.forEach(client => {
    const score = scoreClientMatch(client, criteria, queryLower);
    if (score > 0) {
      results.push({
        entity: 'clients',
        id: client.ClientID,
        match: generateMatchDescription(client, criteria),
        score
      });
    }
  });
  
  return results.sort((a, b) => b.score - a.score);
}

interface SearchCriteria {
  duration?: { operator: string; value: number };
  priority?: { operator: string; value: number };
  phase?: number[];
  skills?: string[];
  location?: string;
  name?: string;
}

function extractSearchCriteria(query: string, tokens: string[]): SearchCriteria {
  const criteria: SearchCriteria = {};
  
  // Duration patterns
  const durationMatch = query.match(/duration\s*(>|<|>=|<=|=|more than|less than|equal to|equals)\s*(\d+)/);
  if (durationMatch) {
    let operator = durationMatch[1];
    if (operator === 'more than') operator = '>';
    if (operator === 'less than') operator = '<';
    if (operator === 'equal to' || operator === 'equals') operator = '=';
    
    criteria.duration = {
      operator,
      value: parseInt(durationMatch[2])
    };
  }
  
  // Priority patterns
  const priorityMatch = query.match(/priority\s*(>|<|>=|<=|=|level)\s*(\d+)/);
  if (priorityMatch) {
    criteria.priority = {
      operator: priorityMatch[1] === 'level' ? '=' : priorityMatch[1],
      value: parseInt(priorityMatch[2])
    };
  }
  
  // Phase patterns
  const phaseMatch = query.match(/phase\s*(\d+)|phases?\s*(\d+(?:,\s*\d+)*)/);
  if (phaseMatch) {
    const phaseNumbers = (phaseMatch[1] || phaseMatch[2])
      .split(',')
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p));
    criteria.phase = phaseNumbers;
  }
  
  // Skills patterns
  const skillsMatch = query.match(/skill[s]?\s+(?:include|having|with)\s+([a-zA-Z\s,]+)/);
  if (skillsMatch) {
    criteria.skills = skillsMatch[1].split(',').map(s => s.trim().toLowerCase());
  }
  
  // Location patterns
  const locationMatch = query.match(/(?:location|in|at)\s+([a-zA-Z\s]+)/);
  if (locationMatch) {
    criteria.location = locationMatch[1].trim().toLowerCase();
  }
  
  // Name patterns
  const nameMatch = query.match(/name[s]?\s+(?:include|containing|with)\s+([a-zA-Z\s]+)/);
  if (nameMatch) {
    criteria.name = nameMatch[1].trim().toLowerCase();
  }
  
  return criteria;
}

function scoreTaskMatch(task: any, criteria: SearchCriteria, query: string): number {
  let score = 0;
  
  // Duration matching
  if (criteria.duration) {
    const { operator, value } = criteria.duration;
    let matches = false;
    
    switch (operator) {
      case '>':
        matches = task.Duration > value;
        break;
      case '<':
        matches = task.Duration < value;
        break;
      case '>=':
        matches = task.Duration >= value;
        break;
      case '<=':
        matches = task.Duration <= value;
        break;
      case '=':
        matches = task.Duration === value;
        break;
    }
    
    if (matches) score += 10;
  }
  
  // Priority matching
  if (criteria.priority) {
    const { operator, value } = criteria.priority;
    let matches = false;
    
    switch (operator) {
      case '>':
        matches = task.PriorityLevel > value;
        break;
      case '<':
        matches = task.PriorityLevel < value;
        break;
      case '=':
        matches = task.PriorityLevel === value;
        break;
    }
    
    if (matches) score += 8;
  }
  
  // Phase matching
  if (criteria.phase) {
    const hasMatchingPhase = criteria.phase.some(p => 
      task.PreferredPhases && task.PreferredPhases.includes(p)
    );
    if (hasMatchingPhase) score += 6;
  }
  
  // Skills matching
  if (criteria.skills) {
    const matchingSkills = criteria.skills.filter(skill =>
      task.RequiredSkills && task.RequiredSkills.some((rs: string) => 
        rs.toLowerCase().includes(skill)
      )
    );
    score += matchingSkills.length * 4;
  }
  
  // Name matching
  if (criteria.name && task.Name) {
    if (task.Name.toLowerCase().includes(criteria.name)) {
      score += 5;
    }
  }
  
  // General text matching
  if (score === 0) {
    const searchableText = [
      task.Name,
      task.TaskID,
      ...(task.RequiredSkills || [])
    ].join(' ').toLowerCase();
    
    const queryWords = query.split(/\s+/);
    const matches = queryWords.filter(word => 
      searchableText.includes(word.toLowerCase())
    );
    score += matches.length * 2;
  }
  
  return score;
}

function scoreWorkerMatch(worker: any, criteria: SearchCriteria, query: string): number {
  let score = 0;
  
  // Skills matching
  if (criteria.skills) {
    const matchingSkills = criteria.skills.filter(skill =>
      worker.Skills && worker.Skills.some((ws: string) => 
        ws.toLowerCase().includes(skill)
      )
    );
    score += matchingSkills.length * 6;
  }
  
  // Location matching
  if (criteria.location && worker.Location) {
    if (worker.Location.toLowerCase().includes(criteria.location)) {
      score += 8;
    }
  }
  
  // Name matching
  if (criteria.name && worker.Name) {
    if (worker.Name.toLowerCase().includes(criteria.name)) {
      score += 5;
    }
  }
  
  // General text matching
  if (score === 0) {
    const searchableText = [
      worker.Name,
      worker.WorkerID,
      worker.Location,
      ...(worker.Skills || [])
    ].join(' ').toLowerCase();
    
    const queryWords = query.split(/\s+/);
    const matches = queryWords.filter(word => 
      searchableText.includes(word.toLowerCase())
    );
    score += matches.length * 2;
  }
  
  return score;
}

function scoreClientMatch(client: any, criteria: SearchCriteria, query: string): number {
  let score = 0;
  
  // Location matching
  if (criteria.location && client.Location) {
    if (client.Location.toLowerCase().includes(criteria.location)) {
      score += 8;
    }
  }
  
  // Name matching
  if (criteria.name && client.Name) {
    if (client.Name.toLowerCase().includes(criteria.name)) {
      score += 5;
    }
  }
  
  // General text matching
  if (score === 0) {
    const searchableText = [
      client.Name,
      client.ClientID,
      client.Location,
      client.ContactInfo
    ].join(' ').toLowerCase();
    
    const queryWords = query.split(/\s+/);
    const matches = queryWords.filter(word => 
      searchableText.includes(word.toLowerCase())
    );
    score += matches.length * 2;
  }
  
  return score;
}

function generateMatchDescription(item: any, criteria: SearchCriteria): string {
  const descriptions = [];
  
  if (criteria.duration && item.Duration) {
    descriptions.push(`Duration: ${item.Duration}`);
  }
  
  if (criteria.priority && item.PriorityLevel) {
    descriptions.push(`Priority: ${item.PriorityLevel}`);
  }
  
  if (criteria.phase && item.PreferredPhases) {
    descriptions.push(`Phases: ${item.PreferredPhases.join(', ')}`);
  }
  
  if (criteria.skills && item.Skills) {
    descriptions.push(`Skills: ${item.Skills.join(', ')}`);
  }
  
  if (item.Location) {
    descriptions.push(`Location: ${item.Location}`);
  }
  
  return descriptions.join(' | ');
}