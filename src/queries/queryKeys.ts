export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    byId: (id: string) => [...queryKeys.companies.all, id] as const,
  },
  teams: {
    all: ['teams'] as const,
    byId: (id: string) => [...queryKeys.teams.all, id] as const,
    byCompany: (companyId: string) => [...queryKeys.teams.all, 'by-company', companyId] as const,
  },
  users: {
    all: ['users'] as const,
    byId: (id: string) => [...queryKeys.users.all, id] as const,
    byCompany: (companyId: string) => [...queryKeys.users.all, 'by-company', companyId] as const,
    byTeam: (teamId: string) => [...queryKeys.users.all, 'by-team', teamId] as const,
  },
  metrics: {
    all: ['metrics'] as const,
    byId: (id: string) => [...queryKeys.metrics.all, id] as const,
    byCompany: (companyId: string) => [...queryKeys.metrics.all, 'by-company', companyId] as const,
    byOwner: (userId: string) => [...queryKeys.metrics.all, 'by-owner', userId] as const,
    byObjective: (objectiveId: string) => [...queryKeys.metrics.all, 'by-objective', objectiveId] as const,
  },
  metricOwners: {
    all: ['metric-owners'] as const,
    byMetric: (metricId: string) => [...queryKeys.metricOwners.all, 'by-metric', metricId] as const,
    byUser: (userId: string) => [...queryKeys.metricOwners.all, 'by-user', userId] as const,
  },
  plans: {
    all: ['plans'] as const,
    byId: (id: string) => [...queryKeys.plans.all, id] as const,
    byMetric: (metricId: string) => [...queryKeys.plans.all, 'by-metric', metricId] as const,
    byUser: (userId: string) => [...queryKeys.plans.all, 'by-user', userId] as const,
  },
  dailyReports: {
    all: ['daily-reports'] as const,
    byId: (id: string) => [...queryKeys.dailyReports.all, id] as const,
    byUser: (userId: string) => [...queryKeys.dailyReports.all, 'by-user', userId] as const,
    byDate: (date: string) => [...queryKeys.dailyReports.all, 'by-date', date] as const,
    byUserAndDate: (userId: string, date: string) => [...queryKeys.dailyReports.all, 'by-user-date', userId, date] as const,
  },
  dailyNotes: {
    all: ['daily-notes'] as const,
    byId: (id: string) => [...queryKeys.dailyNotes.all, id] as const,
    byUser: (userId: string) => [...queryKeys.dailyNotes.all, 'by-user', userId] as const,
    byDate: (date: string) => [...queryKeys.dailyNotes.all, 'by-date', date] as const,
    byUserAndDate: (userId: string, date: string) => [...queryKeys.dailyNotes.all, 'by-user-date', userId, date] as const,
    latest: (userId: string) => [...queryKeys.dailyNotes.all, 'latest', userId] as const,
  },
  objectives: {
    all: ['objectives'] as const,
    byId: (id: string) => [...queryKeys.objectives.all, id] as const,
    byUser: (userId: string) => [...queryKeys.objectives.all, 'by-user', userId] as const,
  },
  userPreferences: {
    all: ['user-preferences'] as const,
    byUser: (userId: string) => [...queryKeys.userPreferences.all, 'by-user', userId] as const,
    byKey: (userId: string, key: string) => [...queryKeys.userPreferences.all, 'by-key', userId, key] as const,
  },
  resultReports: {
    all: ['result-reports'] as const,
    byId: (id: string) => [...queryKeys.resultReports.all, id] as const,
    byUser: (userId: string) => [...queryKeys.resultReports.all, 'by-user', userId] as const,
  },
}; 