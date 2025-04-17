import { useState } from 'react';
import { DataView } from './data-view';
import { AddCompanyForm } from './add-company-form';

export function DatabaseExplorer() {
  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Database Explorer</h2>
      <p className="text-muted-foreground">
        This example demonstrates using TanStack Query to interact with your database.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <AddCompanyForm />
          
          {/* You can add more forms here, e.g.: */}
          {/* <AddTeamForm /> */}
          {/* <AddMetricForm /> */}
        </div>
        
        <DataView />
      </div>
    </div>
  );
} 