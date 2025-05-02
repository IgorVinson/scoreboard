// Query keys export
export * from './queryKeys';

// Company queries
export * from './useCompanies';

// Team queries
export * from './useTeams';

// User queries
export * from './useUsers';

// Metric queries
export * from './useMetrics';

// Plan queries
export * from './usePlans';

// Daily reports queries
export * from './useDailyReports';

// Daily notes queries
export * from './useDailyNotes';

// Objectives queries
export * from './useObjectives';

// User preferences queries
export * from './useUserPreferences';

// Export all query hooks
export * from './useResultReports';

// Define custom hooks needed by ResultReportDialog
export const useGenerateResultReportMetrics = () => {
  return {
    mutateAsync: async (_params: { userId: string, startDate: string, endDate: string }) => {
      // Mock implementation that returns empty metrics
      return {}; 
    }
  };
};

export const useCreateResultReport = () => {
  return {
    mutateAsync: async (reportData: any) => {
      // Mock implementation
      return reportData;
    }
  };
};

export const useUpdateResultReport = () => {
  return {
    mutateAsync: async (reportData: any) => {
      // Mock implementation
      return reportData;
    }
  };
};

