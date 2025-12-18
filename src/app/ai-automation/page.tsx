'use client';

import { useState, useEffect } from 'react';
import { Sidebar, Header } from '@/components/layout';
import { useSidebar, useI18n } from '@/hooks';
import { Bot, Play, Trash2, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

export default function AIAutomationPage() {
  const { isCollapsed } = useSidebar();
  const { t } = useI18n();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceApiKeys, setWorkspaceApiKeys] = useState<{
    googleApiKey: string | null;
    openaiApiKey: string | null;
  } | null>(null);
  
  // Form state
  const [provider, setProvider] = useState<'google' | 'openai'>('google');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [testInstructions, setTestInstructions] = useState('');
  const [headless, setHeadless] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Results state
  const [logs, setLogs] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [showApiKey, setShowApiKey] = useState<{ google: boolean; openai: boolean }>({
    google: false,
    openai: false
  });

  // Load workspace and API keys
  useEffect(() => {
    const wsId = localStorage.getItem('selectedWorkspaceId');
    if (wsId) {
      setWorkspaceId(wsId);
      fetchWorkspaceApiKeys(wsId);
    }
  }, []);

  const fetchWorkspaceApiKeys = async (wsId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${wsId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaceApiKeys({
          googleApiKey: data.googleApiKey,
          openaiApiKey: data.openaiApiKey
        });
      }
    } catch (error) {
      console.error('Error fetching workspace API keys:', error);
    }
  };

  const handleRunTest = async () => {
    if (!workspaceId) {
      alert('Lütfen bir workspace seçin');
      return;
    }

    const apiKey = provider === 'google' 
      ? workspaceApiKeys?.googleApiKey 
      : workspaceApiKeys?.openaiApiKey;

    if (!apiKey || apiKey.startsWith('****')) {
      alert(`Lütfen ${provider === 'google' ? 'Google' : 'OpenAI'} API key'ini workspace ayarlarından yapılandırın`);
      return;
    }

    if (!testInstructions.trim()) {
      alert('Lütfen test talimatlarını girin');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setExecutionResult(null);
    setScreenshots([]);

    try {
      const res = await fetch('/api/ai-automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          task: testInstructions,
          provider,
          model,
          apiKey: apiKey.replace('****', ''), // Remove mask if present
          headless
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setExecutionResult(data);
        if (data.logs) {
          setLogs(data.logs);
        }
        if (data.screenshots) {
          setScreenshots(data.screenshots);
        }
      } else {
        setExecutionResult({ success: false, error: data.message || 'Test çalıştırılamadı' });
      }
    } catch (error: any) {
      setExecutionResult({ success: false, error: error.message || 'Bir hata oluştu' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setExecutionResult(null);
    setScreenshots([]);
  };

  const modelOptions = provider === 'google'
    ? [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
      ]
    : [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4.5rem' : '15rem',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header />
        <PageLayout title="AI Test Otomasyonu">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '300px 1fr',
            gap: '1.5rem',
            height: 'calc(100vh - 8rem)'
          }}>
            {/* Sidebar */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid var(--border-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              overflowY: 'auto'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  🤖 LLM Provider
                </h3>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as 'google' | 'openai');
                    setModel(modelOptions[0].value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="google">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Model
                </h3>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {modelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  🔑 API Key Durumu
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Google
                      </span>
                      {workspaceApiKeys?.googleApiKey && (
                        <button
                          onClick={() => setShowApiKey({ ...showApiKey, google: !showApiKey.google })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem'
                          }}
                        >
                          {showApiKey.google ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      backgroundColor: workspaceApiKeys?.googleApiKey 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: workspaceApiKeys?.googleApiKey 
                        ? '#22c55e' 
                        : '#ef4444',
                      wordBreak: 'break-all'
                    }}>
                      {workspaceApiKeys?.googleApiKey 
                        ? (showApiKey.google 
                            ? workspaceApiKeys.googleApiKey 
                            : workspaceApiKeys.googleApiKey.replace(/./g, '•'))
                        : 'Yapılandırılmamış'}
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        OpenAI
                      </span>
                      {workspaceApiKeys?.openaiApiKey && (
                        <button
                          onClick={() => setShowApiKey({ ...showApiKey, openai: !showApiKey.openai })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0.25rem'
                          }}
                        >
                          {showApiKey.openai ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      backgroundColor: workspaceApiKeys?.openaiApiKey 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: workspaceApiKeys?.openaiApiKey 
                        ? '#22c55e' 
                        : '#ef4444',
                      wordBreak: 'break-all'
                    }}>
                      {workspaceApiKeys?.openaiApiKey 
                        ? (showApiKey.openai 
                            ? workspaceApiKeys.openaiApiKey 
                            : workspaceApiKeys.openaiApiKey.replace(/./g, '•'))
                        : 'Yapılandırılmamış'}
                    </div>
                  </div>
                </div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-tertiary)', 
                  marginTop: '0.75rem'
                }}>
                  API key'leri workspace ayarlarından yönetebilirsiniz.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  🌐 Browser Settings
                </h3>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="checkbox"
                    checked={headless}
                    onChange={(e) => setHeadless(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Headless Mode
                </label>
              </div>
            </div>

            {/* Main Content */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              overflowY: 'auto'
            }}>
              {/* Test Input */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid var(--border-primary)'
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  📝 Test Talimatları
                </h3>
                <textarea
                  value={testInstructions}
                  onChange={(e) => setTestInstructions(e.target.value)}
                  placeholder="Doğal dilde test adımlarınızı yazın, örneğin:

1. google.com'a git
2. 'Streamlit Python' ara
3. İlk sonuca tıkla
4. Sayfanın ekran görüntüsünü al"
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  marginTop: '1rem' 
                }}>
                  <button
                    onClick={handleRunTest}
                    disabled={isRunning || !workspaceId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.5rem',
                      backgroundColor: isRunning ? 'var(--text-tertiary)' : 'var(--cosmic-orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning ? 0.7 : 1
                    }}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Çalışıyor...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Testi Çalıştır
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearLogs}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.5rem',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                    Temizle
                  </button>
                </div>
              </div>

              {/* Logs */}
              {logs.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    📋 Loglar
                  </h3>
                  <div style={{
                    backgroundColor: '#1e1e1e',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#d4d4d4',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {logs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {executionResult && (
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    📊 Sonuç
                  </h3>
                  {executionResult.success ? (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#22c55e'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={20} />
                        <strong>Test başarıyla tamamlandı!</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ef4444'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <XCircle size={20} />
                        <strong>Test başarısız oldu</strong>
                      </div>
                      {executionResult.error && (
                        <p style={{ marginTop: '0.5rem', margin: 0 }}>
                          {executionResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Screenshots */}
              {screenshots.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    📸 Ekran Görüntüleri
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    {screenshots.map((screenshot, idx) => (
                      <div key={idx} style={{
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${idx + 1}`}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </PageLayout>
      </div>
    </div>
  );
}

