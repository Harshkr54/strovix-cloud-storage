import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  FileText,
  Send,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Target,
  ListFilter,
  Users,
  Calendar,
  Building,
  MapPin,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '../../services/ai.api.js';

const SUPPORTED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'doc',
  'txt',
  'md',
  'csv',
  'json',
  'js',
  'jsx',
  'ts',
  'tsx',
  'html',
  'css',
  'py',
  'java',
]);

function isSupported(file) {
  if (!file) return false;
  const mime = file.mimeType || '';
  const ext = (file.extension || file.name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  if (mime === 'application/pdf' || mime.includes('word') || mime.startsWith('text/') || mime.includes('json')) {
    return true;
  }
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function AIFileAssistantDrawer({ open, onClose, file }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'summary' | 'keypoints' | 'extract' | 'short'
  const [loadingAction, setLoadingAction] = useState(null); // name of current running action
  const [summaryData, setSummaryData] = useState(null);
  const [shortSummaryData, setShortSummaryData] = useState(null);
  const [keyPointsData, setKeyPointsData] = useState([]);
  const [extractedData, setExtractedData] = useState(null);

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);

  const fileId = file?._id || file?.id;
  const fileSupported = isSupported(file);

  // Lock body scroll & fetch chat history when opened
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      if (fileSupported && fileId) {
        fetchConversation();
      }

      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open, fileId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const fetchConversation = async () => {
    try {
      const res = await aiApi.getConversation(fileId);
      const msgs = res?.messages || res.data?.messages || [];
      setMessages(msgs);
    } catch {
      // Ignore initial history error if none exists
    }
  };

  const handleSummarize = async () => {
    setActiveTab('summary');
    if (summaryData) return;
    setLoadingAction('Summarizing document...');
    try {
      const res = await aiApi.summarize(fileId);
      const summaryText = res?.summary || res?.data?.summary || res?.data;
      setSummaryData(summaryText);
      if (res?.cached || res?.data?.cached) toast.success('Loaded from cache');
    } catch (err) {
      toast.error(err.message || 'Failed to generate summary');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShortSummary = async () => {
    setActiveTab('short');
    if (shortSummaryData) return;
    setLoadingAction('Generating short summary...');
    try {
      const res = await aiApi.shortSummary(fileId);
      const shortText = res?.shortSummary || res?.data?.shortSummary;
      setShortSummaryData(shortText);
      if (res?.cached || res?.data?.cached) toast.success('Loaded from cache');
    } catch (err) {
      toast.error(err.message || 'Failed to generate short summary');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleKeyPoints = async () => {
    setActiveTab('keypoints');
    if (keyPointsData.length) return;
    setLoadingAction('Extracting key points...');
    try {
      const res = await aiApi.keyPoints(fileId);
      const pointsList = res?.points || res?.data?.points || [];
      setKeyPointsData(pointsList);
      if (res?.cached || res?.data?.cached) toast.success('Loaded from cache');
    } catch (err) {
      toast.error(err.message || 'Failed to extract key points');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExtractInformation = async () => {
    setActiveTab('extract');
    if (extractedData) return;
    setLoadingAction('Extracting structured info...');
    try {
      const res = await aiApi.extractInformation(fileId);
      setExtractedData(res?.data || res);
      if (res?.cached || res?.data?.cached) toast.success('Loaded from cache');
    } catch (err) {
      toast.error(err.message || 'Failed to extract information');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!question.trim() || isAsking) return;

    const userQ = question.trim();
    setQuestion('');
    setIsAsking(true);

    // Optimistic UI user message
    const tempUserMsg = { role: 'user', content: userQ, createdAt: new Date() };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await aiApi.ask(fileId, userQ);
      const msgs = res?.messages || res?.data?.messages;
      if (msgs) {
        setMessages(msgs);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to answer question');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I couldn't process your question: ${err.message}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      await aiApi.clearConversation(fileId);
      setMessages([]);
      toast.success('Conversation history cleared');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!open || !file) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-800 animate-slide-in">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                AI File Assistant
              </h2>
              <p className="truncate text-xs font-semibold text-teal-600 dark:text-teal-400">
                {file.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        {!fileSupported ? (
          /* Unsupported File Banner */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-800 dark:text-slate-100">
              AI Assistant Not Available
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              AI File Assistant is not available for this file type. Supported document formats include: <span className="font-bold text-slate-700 dark:text-slate-300">PDF, DOCX, TXT, MD, CSV, JSON</span>.
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Quick Actions Bar */}
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Actions
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <HelpCircle size={13} />
                  Ask AI
                </button>
                <button
                  type="button"
                  onClick={handleSummarize}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'summary'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FileText size={13} />
                  Summarize
                </button>
                <button
                  type="button"
                  onClick={handleShortSummary}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'short'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Zap size={13} />
                  Short Summary
                </button>
                <button
                  type="button"
                  onClick={handleKeyPoints}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'keypoints'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Target size={13} />
                  Key Points
                </button>
                <button
                  type="button"
                  onClick={handleExtractInformation}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'extract'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ListFilter size={13} />
                  Extract Info
                </button>
              </div>
            </div>

            {/* Main Tab Area */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 space-y-4">
              {loadingAction ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
                    {loadingAction}
                  </p>
                </div>
              ) : activeTab === 'summary' ? (
                /* Full Summary View */
                <div className="space-y-3 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FileText size={15} className="text-teal-600 dark:text-teal-400" />
                      Document Summary
                    </h3>
                    {summaryData && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(summaryData, 'summary')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'summary' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {summaryData || 'Click Summarize above to generate document summary.'}
                  </div>
                </div>
              ) : activeTab === 'short' ? (
                /* Short Summary View */
                <div className="space-y-3 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Zap size={15} className="text-amber-500" />
                      Executive Summary
                    </h3>
                    {shortSummaryData && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shortSummaryData, 'short')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'short' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/60 to-emerald-50/60 dark:from-teal-950/40 dark:to-emerald-950/40 p-4 text-xs sm:text-sm font-semibold leading-relaxed text-teal-900 dark:text-teal-200">
                    "{shortSummaryData || 'Click Short Summary above to generate executive overview.'}"
                  </div>
                </div>
              ) : activeTab === 'keypoints' ? (
                /* Key Points View */
                <div className="space-y-3 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Target size={15} className="text-teal-600 dark:text-teal-400" />
                      Key Takeaways
                    </h3>
                    {keyPointsData.length > 0 && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(keyPointsData.map((p) => `• ${p}`).join('\n'), 'keypoints')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {copiedId === 'keypoints' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  {keyPointsData.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-xs text-slate-500 dark:text-slate-400">
                      Click Key Points above to extract bullet points.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {keyPointsData.map((pt, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : activeTab === 'extract' ? (
                /* Structured Information Extraction View */
                <div className="space-y-4 animate-fade-up">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <ListFilter size={15} className="text-teal-600 dark:text-teal-400" />
                    Extracted Information
                  </h3>

                  {!extractedData ? (
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 text-xs text-slate-500 dark:text-slate-400">
                      Click Extract Info above to scan people, dates, organizations, and key facts.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* People */}
                      {extractedData.people?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            <Users size={14} /> People ({extractedData.people.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.people.map((p, i) => (
                              <span key={i} className="rounded-lg bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dates */}
                      {extractedData.dates?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Calendar size={14} /> Dates ({extractedData.dates.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.dates.map((d, i) => (
                              <span key={i} className="rounded-lg bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Organizations */}
                      {extractedData.organizations?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <Building size={14} /> Organizations ({extractedData.organizations.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.organizations.map((o, i) => (
                              <span key={i} className="rounded-lg bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                {o}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Locations */}
                      {extractedData.locations?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                            <MapPin size={14} /> Locations ({extractedData.locations.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.locations.map((l, i) => (
                              <span key={i} className="rounded-lg bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Important Facts */}
                      {extractedData.importantFacts?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400">
                            <Sparkles size={14} /> Key Facts
                          </div>
                          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                            {extractedData.importantFacts.map((f, i) => (
                              <li key={i}>• {f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Chat Conversation View */
                <div className="flex min-h-0 flex-1 flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ask about this document
                    </span>
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearConversation}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        <Trash2 size={12} /> Clear history
                      </button>
                    )}
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messages.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-6 text-center">
                        <Sparkles size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Have questions about this document?
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Type your question below (e.g. "What is the main topic?" or "What are the key deadlines?")
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Sources citation badges */}
                          {msg.role === 'assistant' && msg.sources?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {msg.sources.map((src, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                                >
                                  Ref: {src.section || `Chunk ${src.chunkIndex + 1}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {isAsking && (
                      <div className="flex items-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                          <Loader2 size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
                          <span>AI is analyzing document context...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar (Always visible at bottom when in Chat tab) */}
            {activeTab === 'chat' && (
              <form
                onSubmit={handleAskQuestion}
                className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about this document..."
                    disabled={isAsking}
                    className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || isAsking}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

export default AIFileAssistantDrawer;
