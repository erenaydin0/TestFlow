export const dailyResults = [
  { date: '1 Oca', passed: 45, failed: 5, total: 50 },
  { date: '2 Oca', passed: 52, failed: 3, total: 55 },
  { date: '3 Oca', passed: 48, failed: 7, total: 55 },
  { date: '4 Oca', passed: 61, failed: 4, total: 65 },
  { date: '5 Oca', passed: 58, failed: 2, total: 60 },
  { date: '6 Oca', passed: 67, failed: 3, total: 70 },
  { date: '7 Oca', passed: 72, failed: 3, total: 75 },
];

import { getChartColors } from '@/lib/chartUtils';

export const getTestSuiteData = () => {
  const colors = getChartColors();
  return [
    { name: 'E2E Tests', value: 45, color: colors.primary },
    { name: 'API Tests', value: 30, color: colors.success },
    { name: 'Unit Tests', value: 65, color: colors.error },
    { name: 'Integration', value: 25, color: colors.warning },
  ];
};

export const successRateData = [
  { week: 'Hafta 1', rate: 88 },
  { week: 'Hafta 2', rate: 92 },
  { week: 'Hafta 3', rate: 85 },
  { week: 'Hafta 4', rate: 91 },
  { week: 'Hafta 5', rate: 94 },
  { week: 'Hafta 6', rate: 89 },
];

export const executionTimeData = [
  { suite: 'Login', time: 45 },
  { suite: 'Checkout', time: 120 },
  { suite: 'Search', time: 32 },
  { suite: 'Profile', time: 67 },
  { suite: 'Admin', time: 89 },
];

export const recentTests = [
  {
    id: 1,
    name: 'Login Flow Test',
    status: 'passed' as const,
    duration: 2340,
    lastRun: new Date(Date.now() - 1000 * 60 * 15),
    environment: 'production'
  },
  {
    id: 2,
    name: 'Checkout Process',
    status: 'failed' as const,
    duration: 5670,
    lastRun: new Date(Date.now() - 1000 * 60 * 30),
    environment: 'staging'
  },
  {
    id: 3,
    name: 'Search Functionality',
    status: 'passed' as const,
    duration: 1890,
    lastRun: new Date(Date.now() - 1000 * 60 * 45),
    environment: 'production'
  },
  {
    id: 4,
    name: 'User Registration',
    status: 'running' as const,
    duration: 0,
    lastRun: new Date(),
    environment: 'development'
  },
]; 