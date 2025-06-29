'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, TrendingUp, Clock, Shield, Users, DollarSign, Target, Zap, RotateCcw } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const prioritySettings = [
  {
    key: 'priorityLevel' as const,
    label: 'Priority Level Weight',
    description: 'How much client priority levels matter',
    icon: Target,
    color: 'text-red-600'
  },
  {
    key: 'taskFulfillment' as const,
    label: 'Task Fulfillment',
    description: 'Importance of completing requested tasks',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    key: 'fairnessConstraints' as const,
    label: 'Fairness Constraints',
    description: 'Ensure equitable resource distribution',
    icon: Shield,
    color: 'text-green-600'
  },
  {
    key: 'skillMatching' as const,
    label: 'Skill Matching',
    description: 'Optimize worker-task skill alignment',
    icon: Zap,
    color: 'text-purple-600'
  },
  {
    key: 'phaseOptimization' as const,
    label: 'Phase Optimization',
    description: 'Efficient phase scheduling',
    icon: Clock,
    color: 'text-orange-600'
  },
  {
    key: 'workloadBalance' as const,
    label: 'Workload Balance',
    description: 'Distribute work evenly across workers',
    icon: TrendingUp,
    color: 'text-indigo-600'
  },
  {
    key: 'clientSatisfaction' as const,
    label: 'Client Satisfaction',
    description: 'Focus on client preferences and needs',
    icon: Users,
    color: 'text-pink-600'
  },
  {
    key: 'resourceUtilization' as const,
    label: 'Resource Utilization',
    description: 'Maximize overall resource efficiency',
    icon: DollarSign,
    color: 'text-emerald-600'
  }
];

const priorityProfiles = {
  balanced: {
    name: 'Balanced Approach',
    description: 'Equal weight to all factors',
    settings: {
      priorityLevel: 25,
      taskFulfillment: 20,
      fairnessConstraints: 15,
      skillMatching: 15,
      phaseOptimization: 10,
      workloadBalance: 10,
      clientSatisfaction: 3,
      resourceUtilization: 2
    }
  },
  clientFirst: {
    name: 'Client-First',
    description: 'Prioritize client satisfaction and requests',
    settings: {
      priorityLevel: 35,
      taskFulfillment: 30,
      fairnessConstraints: 5,
      skillMatching: 10,
      phaseOptimization: 5,
      workloadBalance: 5,
      clientSatisfaction: 8,
      resourceUtilization: 2
    }
  },
  efficiency: {
    name: 'Maximum Efficiency',
    description: 'Focus on resource utilization and optimization',
    settings: {
      priorityLevel: 10,
      taskFulfillment: 15,
      fairnessConstraints: 10,
      skillMatching: 25,
      phaseOptimization: 20,
      workloadBalance: 5,
      clientSatisfaction: 5,
      resourceUtilization: 10
    }
  },
  fairness: {
    name: 'Fair Distribution',
    description: 'Emphasize equitable treatment',
    settings: {
      priorityLevel: 15,
      taskFulfillment: 20,
      fairnessConstraints: 30,
      skillMatching: 10,
      phaseOptimization: 10,
      workloadBalance: 10,
      clientSatisfaction: 3,
      resourceUtilization: 2
    }
  }
};

export function PriorityControls() {
  const { state, setPrioritySettings, setPriorityProfile } = useData();
  const [isDragging, setIsDragging] = useState(false);

  const handlePriorityChange = (key: keyof typeof state.prioritySettings, value: number[]) => {
    setPrioritySettings({
      ...state.prioritySettings,
      [key]: value[0]
    });
    setPriorityProfile('custom');
  };

  const handleProfileChange = (profileKey: string) => {
    if (profileKey in priorityProfiles) {
      const profile = priorityProfiles[profileKey as keyof typeof priorityProfiles];
      setPrioritySettings(profile.settings);
      setPriorityProfile(profileKey);
    }
  };

  const resetToDefaults = () => {
    handleProfileChange('balanced');
  };

  const getImpactLevel = (value: number) => {
    if (value >= 25) return { label: 'Very High', color: 'bg-red-500' };
    if (value >= 20) return { label: 'High', color: 'bg-orange-500' };
    if (value >= 15) return { label: 'Medium', color: 'bg-yellow-500' };
    if (value >= 10) return { label: 'Low', color: 'bg-blue-500' };
    return { label: 'Very Low', color: 'bg-gray-500' };
  };

  const totalWeight = Object.values(state.prioritySettings).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              Priority & Weight Configuration
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Total: {totalWeight}%
              </Badge>
              <Button size="sm" variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Priority Profile</label>
            <Select value={state.priorityProfile} onValueChange={handleProfileChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityProfiles).map(([key, profile]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.description}</div>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div>
                    <div className="font-medium">Custom Configuration</div>
                    <div className="text-xs text-muted-foreground">Manually adjusted settings</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Sliders */}
          <div className="space-y-6">
            {prioritySettings.map((setting) => {
              const value = state.prioritySettings[setting.key];
              const impact = getImpactLevel(value);
              const Icon = setting.icon;
              const percentage = totalWeight > 0 ? (value / totalWeight) * 100 : 0;

              return (
                <div key={setting.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${setting.color}`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{setting.label}</h3>
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${impact.color} text-white`}>
                        {impact.label}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium text-sm">{value}%</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(percentage)}% of total
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-3">
                    <Slider
                      value={[value]}
                      onValueChange={(newValue) => handlePriorityChange(setting.key, newValue)}
                      max={50}
                      min={0}
                      step={1}
                      className="w-full"
                      onValueCommit={() => setIsDragging(false)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weight Distribution Visualization */}
          <div className="pt-4 border-t">
            <h3 className="font-medium text-sm mb-3">Weight Distribution</h3>
            <div className="space-y-2">
              {prioritySettings.map((setting) => {
                const value = state.prioritySettings[setting.key];
                const percentage = totalWeight > 0 ? (value / totalWeight) * 100 : 0;
                
                return (
                  <div key={setting.key} className="flex items-center gap-3">
                    <div className="w-24 text-xs truncate">{setting.label}</div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${setting.color.replace('text-', 'bg-')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-12 text-xs text-right font-medium">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Warning */}
          {totalWeight !== 100 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Total weight is {totalWeight}%. 
                {totalWeight > 100 ? ' Consider reducing some values.' : ' Consider increasing some values for optimal allocation.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}