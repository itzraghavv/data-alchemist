'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Wand2, Save } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { BusinessRule } from '@/types/data';

export function BusinessRulesEditor() {
  const { state, addBusinessRule, updateBusinessRule, deleteBusinessRule } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition: '',
    action: '',
    priority: 50,
    active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      condition: '',
      action: '',
      priority: 50,
      active: true
    });
    setEditingRule(null);
  };

  const handleSave = () => {
    const rule: BusinessRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      condition: formData.condition,
      action: formData.action,
      priority: formData.priority,
      active: formData.active
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
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority,
      active: rule.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBusinessRule(id);
  };

  const convertNaturalLanguageToRule = () => {
    // Simulate AI conversion of natural language to structured rule
    const examples = [
      {
        condition: 'task.PriorityLevel >= 4',
        action: 'allocate_immediately',
        description: 'High priority tasks should be allocated immediately'
      },
      {
        condition: 'worker.Skills.includes("JavaScript") && client.Location === worker.Location',
        action: 'preferred_match',
        description: 'Match JavaScript workers with local clients'
      },
      {
        condition: 'task.Duration > 5 && task.MaxConcurrent > 2',
        action: 'split_task',
        description: 'Split large tasks with high concurrency requirements'
      }
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setFormData(prev => ({
      ...prev,
      condition: randomExample.condition,
      action: randomExample.action,
      description: randomExample.description
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-500" />
            Business Rules
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Business Rule' : 'Create Business Rule'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive name for this rule"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this rule does in plain English"
                    rows={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Condition (JavaScript)</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={convertNaturalLanguageToRule}
                      className="text-xs"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      AI Assist
                    </Button>
                  </div>
                  <Textarea
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                    placeholder="e.g., task.PriorityLevel >= 4 && worker.Skills.includes('JavaScript')"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Action</label>
                  <Input
                    value={formData.action}
                    onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="e.g., allocate_immediately, preferred_match, split_task"
                  />
                </div>

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

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.name || !formData.condition}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingRule ? 'Update' : 'Create'} Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority: {rule.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-mono bg-muted p-2 rounded">
                        <span className="text-blue-600">if</span> {rule.condition}
                      </p>
                      <p className="text-xs font-mono bg-muted p-2 rounded">
                        <span className="text-green-600">then</span> {rule.action}
                      </p>
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
  );
}