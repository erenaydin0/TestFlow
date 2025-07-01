'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from 'recharts';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

// Mock data
const dailyResults = [
  { date: '1 Oca', passed: 45, failed: 5, total: 50 },
  { date: '2 Oca', passed: 52, failed: 3, total: 55 },
  { date: '3 Oca', passed: 48, failed: 7, total: 55 },
  { date: '4 Oca', passed: 61, failed: 4, total: 65 },
  { date: '5 Oca', passed: 58, failed: 2, total: 60 },
  { date: '6 Oca', passed: 67, failed: 3, total: 70 },
  { date: '7 Oca', passed: 72, failed: 3, total: 75 },
];

const testSuiteData = [
  { name: 'E2E Tests', value: 45, color: '#2563eb' },
  { name: 'API Tests', value: 30, color: '#059669' },
  { name: 'Unit Tests', value: 65, color: '#dc2626' },
  { name: 'Integration', value: 25, color: '#d97706' },
];

const successRateData = [
  { week: 'Hafta 1', rate: 88 },
  { week: 'Hafta 2', rate: 92 },
  { week: 'Hafta 3', rate: 85 },
  { week: 'Hafta 4', rate: 91 },
  { week: 'Hafta 5', rate: 94 },
  { week: 'Hafta 6', rate: 89 },
];

const executionTimeData = [
  { suite: 'Login', time: 45 },
  { suite: 'Checkout', time: 120 },
  { suite: 'Search', time: 32 },
  { suite: 'Profile', time: 67 },
  { suite: 'Admin', time: 89 },
];

const recentTests = [
  {
    id: 1,
    name: 'Login Flow Test',
    status: 'passed',
    duration: 2340,
    lastRun: new Date(Date.now() - 1000 * 60 * 15),
    environment: 'production'
  },
  {
    id: 2,
    name: 'Checkout Process',
    status: 'failed',
    duration: 5670,
    lastRun: new Date(Date.now() - 1000 * 60 * 30),
    environment: 'staging'
  },
  {
    id: 3,
    name: 'Search Functionality',
    status: 'passed',
    duration: 1890,
    lastRun: new Date(Date.now() - 1000 * 60 * 45),
    environment: 'production'
  },
  {
    id: 4,
    name: 'User Registration',
    status: 'running',
    duration: 0,
    lastRun: new Date(),
    environment: 'development'
  },
];

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: '16rem',
        paddingTop: '4rem' // Header height
      }}>
        <Header />
        
        <main style={{ padding: '1.5rem' }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Toplam Test
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    156
                  </p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '0.5rem' 
                }}>
                  <TestTube size={20} color="#2563eb" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={12} color="#059669" />
                <span style={{ fontSize: '0.75rem', color: '#059669' }}>+12%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>son hafta</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Başarılı
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                    142
                  </p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '0.5rem' 
                }}>
                  <CheckCircle size={20} color="#059669" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={12} color="#059669" />
                <span style={{ fontSize: '0.75rem', color: '#059669' }}>+8%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>son hafta</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Başarısız
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                    8
                  </p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '0.5rem' 
                }}>
                  <XCircle size={20} color="#dc2626" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>↘ -3%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>son hafta</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Başarı Oranı
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    91%
                  </p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0.5rem' 
                }}>
                  <BarChart3 size={20} color="#d97706" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={12} color="#059669" />
                <span style={{ fontSize: '0.75rem', color: '#059669' }}>+2%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>son hafta</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            {/* Daily Test Results */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Günlük Test Sonuçları
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyResults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        color: 'var(--text-primary)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="passed" 
                      stackId="1" 
                      stroke="#059669" 
                      fill="#059669" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="failed" 
                      stackId="1" 
                      stroke="#dc2626" 
                      fill="#dc2626" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Test Suite Distribution */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Test Dağılımı
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={testSuiteData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {testSuiteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        color: 'var(--text-primary)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {testSuiteData.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '0.75rem', 
                      height: '0.75rem', 
                      backgroundColor: item.color, 
                      borderRadius: '50%' 
                    }}></div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '1.5rem' 
          }}>
            {/* Success Rate Trend */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Başarı Oranı Trendi
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={successRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="week" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        color: 'var(--text-primary)'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Execution Times */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Çalışma Süreleri
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis dataKey="suite" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        color: 'var(--text-primary)'
                      }} 
                    />
                    <Bar dataKey="time" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Tests */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Son Testler
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentTests.map((test) => (
                  <div key={test.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <StatusBadge status={test.status} />
                      <div>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 500, 
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {test.name}
                        </p>
                        <p style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          {test.status === 'running' ? 'Çalışıyor...' : formatRelativeTime(test.lastRun)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>
                        {test.status === 'running' ? 'Devam ediyor' : formatDuration(test.duration)}
                      </p>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-tertiary)',
                        margin: 0
                      }}>
                        {test.environment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 