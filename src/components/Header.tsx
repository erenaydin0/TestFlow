'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, Sun, Moon, Monitor, LogOut, UserCircle, TestTube, ChevronDown, FileText, BarChart3, Tag, X } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useSettingsModal } from '@/lib/settings-modal-context';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { performGlobalSearch, SearchResult } from '@/lib/globalSearch';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import StatusBadge, { getStatusText } from '@/components/StatusBadge';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tests: SearchResult[];
    reports: SearchResult[];
    total: number;
    totalTests: number;
    totalReports: number;
  }>({ tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { theme, setTheme } = useTheme();
  const { openModal } = useSettingsModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userPanelRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  
  // Real-time notifications hook
  const { isConnected, isConnecting, reconnect } = useRealtimeNotifications();

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userPanelRef.current && !userPanelRef.current.contains(event.target as Node)) {
        setIsUserPanelOpen(false);
      }
      if (searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }

    if (isUserPanelOpen || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserPanelOpen, showSearchResults]);

  const themeOptions = [
    { id: 'light', label: 'Açık', icon: Sun },
    { id: 'dark', label: 'Koyu', icon: Moon },
    { id: 'system', label: 'Sistem', icon: Monitor },
  ];

  // Handle search input changes
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      
      try {
        const results = await performGlobalSearch(query.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 });
      } finally {
        setIsSearching(false);
      }
      } else {
        setShowSearchResults(false);
        setSearchResults({ tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 });
      }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults({ tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 });
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    router.push(result.url);
  };

  // Handle Enter key press for search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchResults(false);
      // Navigate to reports page with search
      router.push(`/reports?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'var(--bg-primary)', 
      borderBottom: '1px solid var(--border-primary)', 
      padding: '1rem 1.5rem',
      transition: 'all 0.3s ease',
      height: '4rem',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 1fr 200px',
        alignItems: 'center', 
        width: '100%',
        maxWidth: '100%',
        gap: '1rem'
      }}>
        {/* Logo and App Name Section */}
        <div style={{ justifySelf: 'start' }}>
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}>
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#eff6ff', 
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TestTube size={24} color="#2563eb" />
            </div>
            <div>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1
              }}>
                CosmicQA
              </h1>
            </div>
          </Link>
        </div>

        {/* Centered Search Section */}
        <div style={{ 
          justifySelf: 'center',
          width: '100%',
          maxWidth: '500px'
        }}>
          <div style={{ position: 'relative' }} ref={searchPanelRef}>
            <Search style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-tertiary)', 
              width: '1rem', 
              height: '1rem' 
            }} />
            <input
              type="text"
              placeholder="Testler ve raporlarda ara..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowSearchResults(true);
                }
              }}
              style={{
                paddingLeft: '2.5rem',
                paddingRight: searchQuery ? '2.5rem' : '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                outline: 'none',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onFocusCapture={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlurCapture={(e) => {
                setTimeout(() => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.boxShadow = 'none';
                }, 200);
              }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={14} color="var(--text-tertiary)" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 100,
                maxHeight: '28rem',
                overflowY: 'auto'
              }}>
                {isSearching ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    Aranıyor...
                  </div>
                ) : searchResults.total === 0 ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    "{searchQuery}" için sonuç bulunamadı
                  </div>
                ) : (
                  <>
                    {/* Tests Section */}
                    {searchResults.tests.length > 0 && (
                      <div>
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-primary)',
                          backgroundColor: 'var(--bg-tertiary)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FileText size={16} />
                          Testler ({searchResults.tests.length})
                        </div>
                        {searchResults.tests.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid var(--border-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              marginBottom: '0.25rem',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>{result.title}</span>
                              <span 
                                title={`Test ID: ${result.id}`}
                                style={{
                                  fontSize: '0.625rem',
                                  color: 'var(--text-tertiary)',
                                  padding: '0.125rem 0.25rem',
                                  borderRadius: '0.25rem',
                                  fontFamily: 'monospace',
                                  cursor: 'help'
                                }}>
                                {result.id.length > 15 ? `${result.id.slice(0, 12)}...` : result.id}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginBottom: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {result.status && <StatusBadge status={result.status} size="sm" />}
                              <span>{result.description}</span>
                            </div>
                            {result.matchedIn && result.matchedIn.length > 0 && (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-tertiary)'
                              }}>
                                Eşleşen: {result.matchedIn.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                        {searchResults.totalTests > searchResults.tests.length && (
                          <div 
                            onClick={() => {
                              setShowSearchResults(false);
                              router.push(`/tests?search=${encodeURIComponent(searchQuery.trim())}`);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              textAlign: 'center',
                              color: '#2563eb',
                              fontSize: '0.75rem',
                              borderTop: '1px solid var(--border-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                              e.currentTarget.style.color = '#1d4ed8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                          >
                            +{searchResults.totalTests - searchResults.tests.length} test daha → Testler sayfasında gör
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reports Section */}
                    {searchResults.reports.length > 0 && (
                      <div>
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-primary)',
                          backgroundColor: 'var(--bg-tertiary)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <BarChart3 size={16} />
                          Raporlar ({searchResults.reports.length})
                        </div>
                        {searchResults.reports.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid var(--border-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              marginBottom: '0.25rem',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>{result.title}</span>
                              <span 
                                title={`Test ID: ${result.id}`}
                                style={{
                                  fontSize: '0.625rem',
                                  color: 'var(--text-tertiary)',
                                  padding: '0.125rem 0.25rem',
                                  borderRadius: '0.25rem',
                                  fontFamily: 'monospace',
                                  cursor: 'help'
                                }}>
                                {result.id.length > 15 ? `${result.id.slice(0, 12)}...` : result.id}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginBottom: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {result.status && <StatusBadge status={result.status} size="sm" />}
                              <span>{result.description}</span>
                            </div>
                            {result.matchedIn && result.matchedIn.length > 0 && (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-tertiary)'
                              }}>
                                Eşleşen: {result.matchedIn.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                        {searchResults.totalReports > searchResults.reports.length && (
                          <div 
                            onClick={() => {
                              setShowSearchResults(false);
                              router.push(`/reports?search=${encodeURIComponent(searchQuery.trim())}`);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              textAlign: 'center',
                              color: '#2563eb',
                              fontSize: '0.75rem',
                              borderTop: '1px solid var(--border-primary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                              e.currentTarget.style.color = '#1d4ed8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#2563eb';
                            }}
                          >
                            +{searchResults.totalReports - searchResults.reports.length} rapor daha → Raporlar sayfasında gör
                          </div>
                        )}
                      </div>
                    )}

                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions Section */}
        <div style={{ 
          justifySelf: 'end',
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          {/* Notifications */}
          <NotificationPanel />

          {/* User Profile */}
          <div style={{ position: 'relative' }} ref={userPanelRef}>
            <button 
              onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.5rem 1rem',
                paddingLeft: '1rem',
                borderLeft: '1px solid var(--border-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                backgroundColor: '#eff6ff', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--border-primary)'
              }}>
                <User size={16} color="#2563eb" />
              </div>
            </button>

            {/* User Panel */}
            <div className={`user-panel ${isUserPanelOpen ? 'open' : ''}`}>
              {/* User Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '1rem',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid var(--border-primary)'
                }}>
                  <UserCircle size={20} color="#2563eb" />
                </div>
                <div>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    Test Kullanıcısı
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    test@example.com
                  </p>
                </div>
              </div>

              {/* Appearance Settings */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    color: 'var(--text-primary)'
                  }}>
                    Görünüm
                  </span>
                  
                  {/* Compact Theme Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                      style={{
                        padding: '0.25rem 1.5rem 0.25rem 0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '0.25rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        appearance: 'none',
                        transition: 'all 0.2s ease',
                        minWidth: '5rem',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLSelectElement).style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLSelectElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {themeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div style={{
                      position: 'absolute',
                      right: '0.375rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'var(--text-tertiary)'
                    }}>
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: '0.5rem' }}>
                <button 
                  onClick={() => {
                    openModal();
                    setIsUserPanelOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}>
                  <Settings size={14} />
                  <span>Ayarlar</span>
                </button>
                
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <LogOut size={14} />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .user-panel {
          position: absolute;
          right: 0;
          width: 16rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-0.5rem);
          transition: all 0.2s ease;
          z-index: 50;
        }

        .user-panel.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

      `}</style>
    </header>
  );
} 