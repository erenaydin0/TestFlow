'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Filter,
  Plus,
  MoreVertical,
  Tag,
  Clock
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

// Mock data
const TESTS = [
  {
    id: '1',
    name: 'Login Functionality Test',
    description: 'Kullanıcı giriş işlemlerini test eder',
    status: 'passed',
    duration: 2340,
    suite: 'Authentication',
    tags: ['login', 'auth', 'critical'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Product Search Test',
    description: 'Ürün arama fonksiyonalitesini kontrol eder',
    status: 'failed',
    duration: 5670,
    suite: 'E-commerce',
    tags: ['search', 'products'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '3',
    name: 'User Registration Test',
    description: 'Yeni kullanıcı kayıt sürecini test eder',
    status: 'running',
    duration: 0,
    suite: 'Authentication',
    tags: ['registration', 'auth'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Checkout Process Test',
    description: 'Satın alma sürecinin tamamını test eder',
    status: 'passed',
    duration: 8920,
    suite: 'E-commerce',
    tags: ['checkout', 'payment', 'critical'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Navigation Menu Test',
    description: 'Site navigasyon menüsünü test eder',
    status: 'pending',
    duration: 1200,
    suite: 'UI/UX',
    tags: ['navigation', 'ui'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '6',
    name: 'Form Validation Test',
    description: 'Form doğrulama kurallarını test eder',
    status: 'passed',
    duration: 3450,
    suite: 'UI/UX',
    tags: ['forms', 'validation'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export default function TestsPage() {
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
          {/* Filters and Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              }}>
                <Filter size={16} />
                <span>Filtrele</span>
              </button>
              
              <select style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}>
                <option value="">Tüm Durumlar</option>
                <option value="passed">Başarılı</option>
                <option value="failed">Başarısız</option>
                <option value="pending">Beklemede</option>
                <option value="running">Çalışıyor</option>
              </select>
              
              <select style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}>
                <option value="">Tüm Test Grupları</option>
                <option value="Authentication">Authentication</option>
                <option value="E-commerce">E-commerce</option>
                <option value="UI/UX">UI/UX</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn-secondary">
                Toplu Çalıştır
              </button>
              <button className="btn-primary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Plus size={16} />
                Yeni Test
              </button>
            </div>
          </div>

          {/* Tests Table */}
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      <input 
                        type="checkbox" 
                        style={{ 
                          borderRadius: '0.25rem', 
                          border: '1px solid var(--border-primary)' 
                        }} 
                      />
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Adı
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Grubu
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Durum
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Süre
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Son Çalıştırma
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Etiketler
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TESTS.map((test) => (
                    <tr 
                      key={test.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          style={{ 
                            borderRadius: '0.25rem', 
                            border: '1px solid var(--border-primary)' 
                          }} 
                        />
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <h3 style={{ 
                            fontWeight: 500, 
                            color: 'var(--text-primary)',
                            margin: 0,
                            fontSize: '0.875rem'
                          }}>
                            {test.name}
                          </h3>
                                                     <p style={{ 
                             fontSize: '0.75rem', 
                             color: 'var(--text-secondary)', 
                             margin: '0.25rem 0 0 0'
                           }}>
                            {test.description}
                          </p>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                          {test.suite}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <StatusBadge status={test.status} />
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                          <Clock size={16} />
                          <span>
                            {test.status === 'running' ? 'Çalışıyor...' : formatDuration(test.duration)}
                          </span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                          {formatRelativeTime(test.updatedAt)}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {test.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.125rem 0.5rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border-primary)'
                              }}
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {test.tags.length > 2 && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-tertiary)' 
                            }}>
                              +{test.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {test.status === 'running' ? (
                            <button style={{ 
                              padding: '0.25rem', 
                              color: '#dc2626', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                              <Pause size={16} />
                            </button>
                          ) : (
                            <button style={{ 
                              padding: '0.25rem', 
                              color: '#059669', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                              <Play size={16} />
                            </button>
                          )}
                          
                          <button style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}>
                            <Edit size={16} />
                          </button>
                          
                          <button style={{ 
                            padding: '0.25rem', 
                            color: '#dc2626', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}>
                            <Trash2 size={16} />
                          </button>
                          
                          <button style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}>
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'between', 
            marginTop: '1.5rem' 
          }}>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)' 
            }}>
              6 testten 1-6 arası gösteriliyor
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button style={{ 
                padding: '0.5rem 0.75rem', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }} disabled>
                Önceki
              </button>
              
              <button style={{ 
                padding: '0.5rem 0.75rem', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                backgroundColor: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                1
              </button>
              
              <button style={{ 
                padding: '0.5rem 0.75rem', 
                border: '1px solid var(--border-primary)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }} disabled>
                Sonraki
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 