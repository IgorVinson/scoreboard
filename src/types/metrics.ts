export interface MetricFormData {
  name: string;
  description: string;
  type: 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN';
  measurement_unit: 'NUMBER' | 'PERCENTAGE' | 'TEXT';
} 