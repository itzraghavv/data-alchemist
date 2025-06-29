'use client';

import React from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { NaturalLanguageSearch } from '@/components/NaturalLanguageSearch';
import { BusinessRulesEditor } from '@/components/BusinessRulesEditor';
import { PriorityControls } from '@/components/PriorityControls';
import { ExportControls } from '@/components/ExportControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Database, Search, Settings, Download } from 'lucide-react';

export default function Home() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Data Alchemist
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-2">
              Transform messy spreadsheets into clean, validated data with AI-powered intelligence
            </p>
            <p className="text-sm text-muted-foreground">
              Upload • Validate • Clean • Configure • Export
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Validation</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Rules</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <FileUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <DataGrid />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <NaturalLanguageSearch />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <ValidationPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <BusinessRulesEditor />
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <PriorityControls />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <ExportControls />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DataProvider>
  );
}