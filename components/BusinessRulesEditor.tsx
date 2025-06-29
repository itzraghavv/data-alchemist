'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Wand2, Save, Download, Lightbulb, X, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { BusinessRule, RuleSuggestion } from '@/types/data';

const ruleTypes = [
  { value: 'coRun', label: 'Co-Run Tasks', description: 'Tasks that must run together' },
  { value: 'slotRestriction', label: 'Slot Restriction', description: 'Limit common slots for groups' },
  { value: 'loadLimit', label: 'Load Limit', description: 'Maximum load per worker group' },
  { value: 'phaseWindow', label: 'Phase Window', description: 'Restrict tasks to specific phases' },
  { value: 'patternMatch', label: 'Pattern Match', description: 'Regex-based rule matching' },
  { value: 'precedenceOverride', label: 'Precedence Override', description: 'Priority-based rule ordering' },
  { value: 'custom', label: 'Custom Rule', description: 'Natural language rule' }
];

export function BusinessRulesEditor() {
  const { 
    state, 
    addBusinessRule, 
    updateBusinessRule, 
    deleteBusinessRule,
    acceptRuleSuggestion,
    dismissRuleSuggestion,
    setRuleSuggestions
  } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'coRun' as BusinessRule['type'],
    parameters: {} as Record<string, any>,
    priority: 50,
    active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'coRun',
      parameters: {},
      priority: 50,
      active: true
    });
    setEditingRule(null);
    setNaturalLanguageInput('');
  };

  const handleSave = () => {
    const rule: BusinessRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      parameters: formData.parameters,
      priority: formData.priority,
      active: formData.active,
      createdAt: editingRule?.createdAt || new Date().toISOString()
    };

    if (editingRule) {
      updateBusinessRule(editingRule.id, rule);
    } else {
      addBusinessRule(rule);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      parameters: rule.parameters,
      priority: rule.priority,
      active: rule.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBusinessRule(id);
  };

  const convertNaturalLanguageToRule = async () => {
    if (!naturalLanguageInput.trim()) return;

    // Simulate AI processing
    const suggestions = await generateRuleSuggestions(naturalLanguageInput, state);
    setRuleSuggestions(suggestions);
  };

  const generateRulesConfig = () => {
    const config = {
      rules: state.businessRules.filter(rule => rule.active),
      priorities: state.prioritySettings,
      metadata: {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        totalRules: state.businessRules.filter(rule => rule.active).length
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rules-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderRuleParameters = () => {
    switch (formData.type) {
      case 'coRun':
        return (
          <div className="space-y-3">
            <label className="text-sm font-medium">Task IDs (comma-separated)</label>
            <Input
              value={formData.parameters.tasks?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                parameters: { ...prev.parameters, tasks: e.target.value.split(',').map(s => s.trim()) }
              }))}
              placeholder="T001, T002, T003"
            />
          </div>
        );
      
      case 'slotRestriction':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Group Type</label>
              <Select
                value={formData.parameters.groupType || 'client'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, groupType: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Group</SelectItem>
                  <SelectItem value="worker">Worker Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Group ID</label>
              <Input
                value={formData.parameters.groupId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, groupId: e.target.value }
                }))}
                placeholder="GROUP_001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Min Common Slots</label>
              <Input
                type="number"
                value={formData.parameters.minCommonSlots || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, minCommonSlots: parseInt(e.target.value) }
                }))}
                placeholder="2"
              />
            </div>
          </div>
        );
      
      case 'loadLimit':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Worker Group</label>
              <Input
                value={formData.parameters.workerGroup || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, workerGroup: e.target.value }
                }))}
                placeholder="SALES_TEAM"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Slots Per Phase</label>
              <Input
                type="number"
                value={formData.parameters.maxSlotsPerPhase || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, maxSlotsPerPhase: parseInt(e.target.value) }
                }))}
                placeholder="5"
              />
            </div>
          </div>
        );
      
      case 'phaseWindow':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Task ID</label>
              <Input
                value={formData.parameters.taskId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, taskId: e.target.value }
                }))}
                placeholder="T001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Allowed Phases (comma-separated)</label>
              <Input
                value={formData.parameters.allowedPhases?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, allowedPhases: e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) }
                }))}
                placeholder="1, 2, 3"
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <label className="text-sm font-medium">Parameters (JSON)</label>
            <Textarea
              value={JSON.stringify(formData.parameters, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, parameters: parsed }));
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder="{}"
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-500" />
              Business Rules Engine
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={generateRulesConfig}>
                <Download className="h-4 w-4 mr-2" />
                Generate Config
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? 'Edit Business Rule' : 'Create Business Rule'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="structured" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="structured">Structured Rule</TabsTrigger>
                      <TabsTrigger value="natural">Natural Language</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="structured" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Rule Name</label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter a descriptive name"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Rule Type</label>
                          <Select
                            value={formData.type}
                            onValueChange={(value: BusinessRule['type']) => setFormData(prev => ({ ...prev, type: value, parameters: {} }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ruleTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this rule does"
                          rows={2}
                        />
                      </div>

                      {renderRuleParameters()}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Priority (1-100)</label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.active}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                          />
                          <label className="text-sm font-medium">Active</label>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="natural" className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Describe your rule in plain English</label>
                        <Textarea
                          value={naturalLanguageInput}
                          onChange={(e) => setNaturalLanguageInput(e.target.value)}
                          placeholder="e.g., Tasks T12 and T14 should always run together, or Sales workers should not work more than 3 slots per phase"
                          rows={4}
                        />
                      </div>
                      
                      <Button onClick={convertNaturalLanguageToRule} disabled={!naturalLanguageInput.trim()}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Convert to Rule
                      </Button>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!formData.name}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingRule ? 'Update' : 'Create'} Rule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rule Suggestions */}
          {state.ruleSuggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                AI Rule Suggestions
              </h3>
              <div className="space-y-3">
                {state.ruleSuggestions.map((suggestion) => (
                  <Alert key={suggestion.id} className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-blue-800">{suggestion.title}</p>
                          <p className="text-sm text-blue-700 mt-1">{suggestion.description}</p>
                          <p className="text-xs text-blue-600 mt-1">{suggestion.reasoning}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {Math.round(suggestion.confidence)}% confidence
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => acceptRuleSuggestion(suggestion.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissRuleSuggestion(suggestion.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Existing Rules */}
          {state.businessRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wand2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No business rules defined yet</p>
              <p className="text-xs mt-1">Create rules to define how your data should be processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.businessRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ruleTypes.find(t => t.value === rule.type)?.label || rule.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority: {rule.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      <div className="text-xs font-mono bg-muted p-2 rounded">
                        {JSON.stringify(rule.parameters, null, 2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// AI Rule Suggestion Generator
async function generateRuleSuggestions(input: string, state: any): Promise<RuleSuggestion[]> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const suggestions: RuleSuggestion[] = [];
  const inputLower = input.toLowerCase();
  
  // Pattern matching for common rule types
  if (inputLower.includes('together') || inputLower.includes('co-run') || inputLower.includes('same time')) {
    const taskMatches = input.match(/t\d+/gi);
    if (taskMatches && taskMatches.length >= 2) {
      suggestions.push({
        id: `suggestion_${Date.now()}_1`,
        type: 'coRun',
        title: 'Co-Run Tasks Rule',
        description: `Tasks ${taskMatches.join(', ')} should run together`,
        confidence: 85,
        parameters: { tasks: taskMatches },
        reasoning: 'Detected task IDs and co-execution keywords in input'
      });
    }
  }
  
  if (inputLower.includes('load') || inputLower.includes('limit') || inputLower.includes('maximum')) {
    const numberMatch = input.match(/(\d+)/);
    const groupMatch = input.match(/(\w+)\s+(?:workers|group|team)/i);
    
    if (numberMatch && groupMatch) {
      suggestions.push({
        id: `suggestion_${Date.now()}_2`,
        type: 'loadLimit',
        title: 'Load Limit Rule',
        description: `Limit ${groupMatch[1]} group to ${numberMatch[1]} slots per phase`,
        confidence: 78,
        parameters: { 
          workerGroup: groupMatch[1].toUpperCase(),
          maxSlotsPerPhase: parseInt(numberMatch[1])
        },
        reasoning: 'Detected load limiting pattern with specific group and number'
      });
    }
  }
  
  if (inputLower.includes('phase') && (inputLower.includes('only') || inputLower.includes('restrict'))) {
    const taskMatch = input.match(/t\d+/i);
    const phaseMatches = input.match(/phase\s*(\d+(?:[-,]\s*\d+)*)/i);
    
    if (taskMatch && phaseMatches) {
      const phases = phaseMatches[1].split(/[-,]/).map(p => parseInt(p.trim())).filter(n => !isNaN(n));
      suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        type: 'phaseWindow',
        title: 'Phase Window Rule',
        description: `Restrict ${taskMatch[0]} to phases ${phases.join(', ')}`,
        confidence: 82,
        parameters: { 
          taskId: taskMatch[0].toUpperCase(),
          allowedPhases: phases
        },
        reasoning: 'Detected phase restriction pattern with specific task and phases'
      });
    }
  }
  
  return suggestions;
}