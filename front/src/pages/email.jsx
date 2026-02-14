import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import { Editor } from '@tinymce/tinymce-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Emailtemp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('desktop');
  const [darkMode, setDarkMode] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [previewScale, setPreviewScale] = useState(100);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/templates/${id}`);
        setTemplate(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
      if (e.key === 'e' && !editorMode && !e.ctrlKey && !e.metaKey) {
        setEditorMode(true);
      }
      if (e.key === 'p' && editorMode && !e.ctrlKey && !e.metaKey) {
        setEditorMode(false);
      }
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        setDarkMode(!darkMode);
      }
      if (e.key === '?') {
        setShowShortcuts(!showShortcuts);
      }
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        setViewMode('mobile');
      }
      if (e.key === 'w' && !e.ctrlKey && !e.metaKey) {
        setViewMode('desktop');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, editorMode, darkMode, showShortcuts]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const downloadHtml = () => {
    const htmlContent = editorRef.current?.getContent() || template.body_html;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.subject || 'template'}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToastMessage('HTML file downloaded!');
  };

  const copyHtmlToClipboard = () => {
    const htmlContent = editorRef.current?.getContent() || template.body_html;
    navigator.clipboard.writeText(htmlContent).then(() => {
      showToastMessage('HTML copied to clipboard!');
    }).catch(() => {
      showToastMessage('Failed to copy HTML');
    });
  };

  const downloadAsText = () => {
    const textContent = template.text_body || '';
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.subject || 'template'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToastMessage('Text file downloaded!');
  };

  const exportAsJson = () => {
    const jsonContent = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.subject || 'template'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToastMessage('JSON exported!');
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-6 max-w-md">
          <div className="space-y-4 w-full">
            <div className="h-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-xl animate-pulse"></div>
            <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"></div>
            <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse w-3/4"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="h-24 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl animate-pulse"></div>
              <div className="h-24 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm font-semibold text-foreground mb-2">Loading template</p>
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );

  if (!template)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 ring-1 ring-destructive/20">
            <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Template Not Found</h3>
          <p className="text-sm text-muted-foreground mb-6">The template you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/10 text-foreground transition-colors duration-300">
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-5 fade-in">
          <div className="rounded-xl bg-gradient-to-r from-success to-success/90 px-6 py-3 shadow-2xl shadow-success/20 ring-1 ring-success/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-success-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-success-foreground">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <ShortcutRow shortcut="ESC" description="Go back" />
              <ShortcutRow shortcut="E" description="Enter edit mode" />
              <ShortcutRow shortcut="P" description="Preview mode" />
              <ShortcutRow shortcut="D" description="Toggle dark mode" />
              <ShortcutRow shortcut="M" description="Mobile view" />
              <ShortcutRow shortcut="W" description="Desktop view" />
              <ShortcutRow shortcut="?" description="Show shortcuts" />
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
        <div className="border-b border-border/30 bg-muted/20 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <button onClick={() => navigate('/templates')} className="text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </button>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="font-medium text-foreground truncate max-w-xs">{template.subject || 'Email Template'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
            >
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 ring-1 ring-border/50">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-sm font-medium text-foreground">Email Template</span>
            </div>

            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Press <kbd className="ml-1 rounded bg-background px-1.5 py-0.5 text-xs font-semibold ring-1 ring-border">?</kbd> for shortcuts
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl border border-border/50 bg-muted/30 p-1 shadow-sm backdrop-blur-sm">
              <button
                onClick={() => setViewMode('desktop')}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200",
                  viewMode === 'desktop'
                    ? "bg-card text-foreground shadow-md ring-1 ring-border/50 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200",
                  viewMode === 'mobile'
                    ? "bg-card text-foreground shadow-md ring-1 ring-border/50 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                Mobile
              </button>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="group inline-flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-card hover:shadow-md hover:scale-105 active:scale-95"
            >
              {darkMode ? (
                <>
                  <svg className="h-4 w-4 text-amber-500 transition-transform group-hover:rotate-45" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-indigo-500 transition-transform group-hover:-rotate-12" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => setEditorMode(!editorMode)}
              className={clsx(
                "group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95",
                editorMode
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-primary/20"
                  : "bg-gradient-to-r from-success to-success/90 text-success-foreground shadow-success/20"
              )}
            >
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                {editorMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                )}
              </svg>
              <span className="hidden sm:inline">{editorMode ? 'Preview' : 'Edit'}</span>
            </button>

            {!editorMode && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 shadow-sm backdrop-blur-sm">
                <button
                  onClick={() => setPreviewScale(Math.max(50, previewScale - 10))}
                  className="rounded-lg p-1 hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={previewScale <= 50}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                  </svg>
                </button>
                <span className="text-xs font-semibold text-foreground min-w-[2.5rem] text-center">{previewScale}%</span>
                <button
                  onClick={() => setPreviewScale(Math.min(150, previewScale + 10))}
                  className="rounded-lg p-1 hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={previewScale >= 150}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={copyHtmlToClipboard}
              className="group inline-flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-card hover:shadow-md hover:scale-105 active:scale-95"
            >
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              <span className="hidden md:inline">Copy</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-warning to-warning/90 px-4 py-2 text-xs font-semibold text-warning-foreground shadow-lg shadow-warning/20 transition-all hover:shadow-xl hover:shadow-warning/30 hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="hidden sm:inline">Export</span>
                <svg className={clsx("h-3 w-3 transition-transform", showExportMenu && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-2xl ring-1 ring-black/5 backdrop-blur-xl z-30">
                  <div className="p-2">
                    <button
                      onClick={() => { downloadHtml(); setShowExportMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                      Download HTML
                    </button>
                    <button
                      onClick={() => { downloadAsText(); setShowExportMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-uted transition-colors"
                    >
                      <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Download Text
                    </button>
                    <button
                      onClick={() => { exportAsJson(); setShowExportMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                      Export JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-border/50 bg-card/50 backdrop-blur-sm lg:w-96 lg:border-b-0 lg:border-r">
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 ring-1 ring-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                  </svg>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Views</span>
                </div>
                <p className="text-2xl font-bold text-foreground">--</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-success/10 to-success/5 p-4 ring-1 ring-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
                  </svg>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Opens</span>
                </div>
                <p className="text-2xl font-bold text-foreground">--</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50"></div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Details
                </h2>
              </div>
              <div className="space-y-4">
                <InfoRow 
                  label="Subject" 
                  value={template.subject}
                  icon={
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                  }
                />
                <InfoRow 
                  label="From" 
                  value={`${template.sender_name} <${template.sender_email}>`}
                  icon={
                    <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  }
                />
                <InfoRow 
                  label="To" 
                  value={template.recipient_email}
                  icon={
                    <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  }
                />
                <InfoRow 
                  label="Sent" 
                  value={new Date(template.sent_at).toLocaleString()}
                  icon={
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            </div>

            <div className="my-6 border-t border-border/50" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Metadata
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {template.brand && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-badge-brand to-badge-brand/90 px-3 py-1.5 text-xs font-semibold text-badge-brand-foreground shadow-sm ring-1 ring-black/5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                    {template.brand}
                  </span>
                )}
                {template.language && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-badge-lang to-badge-lang/90 px-3 py-1.5 text-xs font-semibold text-badge-lang-foreground shadow-sm ring-1 ring-black/5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                    {template.language}
                  </span>
                )}
                {template.country && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-badge-country to-badge-country/90 px-3 py-1.5 text-xs font-semibold text-badge-country-foreground shadow-sm ring-1 ring-black/5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    {template.country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col items-center gap-8 p-6 sm:p-8 lg:p-10">
          {editorMode ? (
            <div className="w-full max-w-5xl">
              <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-2xl backdrop-blur-sm ring-1 ring-black/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                    Rich Text Editor
                  </h3>
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    Editing Mode
                  </span>
                </div>
                <Editor
                  apiKey='o93x9wh20rmdy8wdhb8w7fdqg6zmkydirt4t2utzqf88gfha'
                  onInit={(_evt, editor) => (editorRef.current = editor)}
                  initialValue={template.body_html}
                  init={{
                    height: viewMode === 'mobile' ? 667 : 600,
                    menubar: false,
                    plugins: [
                      'anchor autolink charmap codesample emoticons link lists media searchreplace table visualblocks wordcount',
                      'checklist mediaembed casechange formatpainter pageembed a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode advtemplate ai uploadcare mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss markdown importword exportword exportpdf',
                    ],
                    toolbar:
                      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                    tinycomments_mode: 'embedded',
                    tinycomments_author: 'Author name',
                    mergetags_list: [
                      { value: 'First.Name', title: 'First Name' },
                      { value: 'Email', title: 'Email' },
                    ],
                    content_style: darkMode
                      ? 'body { background-color: #111827; color: #fff; }'
                      : 'body { background-color: #fff; color: #000; }',
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className={clsx(
                "relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-2xl backdrop-blur-sm ring-1 ring-black/5 transition-all duration-300",
                viewMode === 'mobile' ? "w-[380px] max-w-full" : "w-full max-w-5xl"
              )}
              style={{
                height: viewMode === 'mobile' ? '720px' : '75vh',
                transform: `scale(${previewScale / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {viewMode === 'mobile' && (
                <div className="absolute left-1/2 top-0 z-10 h-7 w-36 -translate-x-1/2 rounded-b-3xl bg-gradient-to-b from-device-notch to-device-notch/40 shadow-lg" />
              )}

              {viewMode === 'desktop' && (
                <div className="flex h-11 items-center gap-3 border-b border-border/50 bg-gradient-to-r from-muted/60 to-muted/40 px-5 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm" />
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-sm" />
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm" />
                  </div>
                  <div className="mx-auto flex-1 max-w-md">
                    <div className="h-6 rounded-lg bg-muted/60 border border-border/30 px-3 flex items-center">
                      <svg className="h-3.5 w-3.5 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span className="text-xs text-muted-foreground/60">email-preview.local</span>
                    </div>
                  </div>
                </div>
              )}

              <iframe
                title="email-preview"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body {
                          margin: 0;
                          padding: 20px;
                          background-color: ${darkMode ? '#1f2937' : '#ffffff'};
                          color: ${darkMode ? '#f3f4f6' : '#000000'};
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                      </style>
                    </head>
                    <body>
                      ${template.body_html}
                    </body>
                  </html>
                `}
                className="h-full w-full"
                sandbox=""
                style={{
                  border: 'none',
                  height: viewMode === 'desktop' ? 'calc(100% - 44px)' : '100%',
                }}
              />
            </div>
          )}

          {template.text_body && (
            <div className="w-full max-w-5xl rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm ring-1 ring-black/5">
              <div className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/20 px-6 py-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Plain Text Version
                  </h4>
                </div>
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-line font-mono text-sm leading-relaxed text-foreground/70">
                  {template.text_body}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-110 hover:shadow-3xl hover:shadow-primary/40 active:scale-95"
        >
          <svg className={clsx("h-6 w-6 transition-transform", showQuickActions && "rotate-45")} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        {showQuickActions && (
          <div className="absolute bottom-16 right-0 mb-2 w-56 rounded-2xl border border-border/50 bg-card shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
            <div className="p-3 space-y-1">
              <button
                onClick={() => { copyHtmlToClipboard(); setShowQuickActions(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-primary/10 transition-all hover:scale-105"
              >
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy HTML
              </button>
              <button
                onClick={() => { setEditorMode(!editorMode); setShowQuickActions(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-success/10 transition-all hover:scale-105"
              >
                <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                {editorMode ? 'Preview' : 'Edit'}
              </button>
              <button
                onClick={() => { setDarkMode(!darkMode); setShowQuickActions(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-warning/10 transition-all hover:scale-105"
              >
                <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  {darkMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  )}
                </svg>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => { setShowShortcuts(true); setShowQuickActions(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all hover:scale-105"
              >
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Shortcuts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="group rounded-xl border border-border/50 bg-muted/30 p-4 transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {label}
          </dt>
          <dd className="text-sm font-medium text-foreground break-all leading-relaxed">
            {value}
          </dd>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut, description }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
      <span className="text-sm text-foreground">{description}</span>
      <kbd className="rounded bg-background px-2 py-1 text-xs font-semibold text-foreground ring-1 ring-border">{shortcut}</kbd>
    </div>
  );
}