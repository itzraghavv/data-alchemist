'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, TrendingUp, Clock, Shield, Users, DollarSign } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const prioritySettings = [
  {
    key: 'costOptimization' as const,
    label: 'Cost Optimization',
    description: 'Minimize resource costs and overhead',
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    key: 'timeEfficiency' as const,
    label: 'Time Efficiency',
    description: 'Prioritize faster completion times',
    icon: Clock,
    color: 'text-blue-600'
  },
  {
    key: 'qualityAssurance' as const,
    label: 'Quality Assurance',
    description: 'Ensure high-quality outcomes',
    icon: Shield,
    color: 'text-purple-600'
  },
  {
    key: 'resourceUtilization' as const,
    label: 'Resource Utilization',
    description: 'Maximize worker productivity',
    icon: TrendingUp,
    color: 'text-orange-600'
  },
  {
    key: 'clientSatisfaction' as const,
    label: 'Client Satisfaction',
    description: 'Focus on client preferences',
    icon: Users,
    color: 'text-pink-600'
  }
];

export function PriorityControls() {
  const { state, setPrioritySettings } = useData();

  const handlePriorityChange = (key: keyof typeof state.prioritySettings, value: number[]) => {
    setPrioritySettings({
      ...state.prioritySettings,
      [key]: value[0]
    });
  };

  const getImpactLevel = (value: number) => {
    if (value >= 80) return { label: 'Very High', color: 'bg-red-500' };
    if (value >= 60) return { label: 'High', color: 'bg-orange-500' };
    if (value >= 40) return { label: 'Medium', color: 'bg-yellow-500' };
    if (value >= 20) return { label: 'Low', color: 'bg-blue-500' };
    return { label: 'Very Low', color: 'bg-gray-500' };
  };

  const totalWeight = Object.values(state.prioritySettings).reduce((sum, value) => sum + value, 0);
  const avgWeight = totalWeight / Object.keys(state.prioritySettings).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-500" />
            Priority Controls
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Avg: {Math.round(avgWeight)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Adjust these sliders to define how the system should balance different priorities when processing your data.
        </div>

        {prioritySettings.map((setting) => {
          const value = state.prioritySettings[setting.key];
          const impact = getImpactLevel(value);
          const Icon = setting.icon;

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
                  </div>
                </div>
              </div>
              
              <div className="px-3">
                <Slider
                  value={[value]}
                  onValueChange={(newValue) => handlePriorityChange(setting.key, newValue)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Current Balance:</span>
            <div className="flex items-center gap-4">
              {prioritySettings.map((setting) => {
                const value = state.prioritySettings[setting.key];
                const percentage = (value / totalWeight) * 100;
                return (
                  <div key={setting.key} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${setting.color.replace('text-', 'bg-')}`} />
                    <span className="text-xs">{Math.round(percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}