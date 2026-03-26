/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Loader2,
  Settings2,
  AlignLeft,
  AlignCenter,
  AlignJustify
} from "lucide-react";
import Markdown from 'react-markdown';

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type SummaryLength = 'short' | 'medium' | 'long';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [length, setLength] = useState<SummaryLength>('medium');

  const summarizeText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setSummary('');

    try {
      const model = "gemini-3-flash-preview";
      const lengthPrompt = {
        short: "Provide a very brief, 1-2 sentence summary.",
        medium: "Provide a concise summary in a few bullet points.",
        long: "Provide a detailed summary covering all key points and nuances."
      }[length];

      const prompt = `
        Summarize the following text. 
        ${lengthPrompt}
        
        Text to summarize:
        ${inputText}
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text;
      if (text) {
        setSummary(text);
      } else {
        throw new Error("No summary generated.");
      }
    } catch (err) {
      console.error("Summarization error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setInputText('');
    setSummary('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Gemini Summarizer</h1>
              <p className="text-sm text-gray-500">AI-powered text distillation</p>
            </div>
          </div>
          <button 
            onClick={reset}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <section className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
              <div className="px-4 py-3 border-bottom border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <FileText size={16} />
                  <span>Source Text</span>
                </div>
                <span className="text-xs text-gray-400">{inputText.length} characters</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your long text here..."
                className="flex-1 p-4 resize-none focus:outline-none text-sm leading-relaxed"
              />
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                  {(['short', 'medium', 'long'] as SummaryLength[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLength(l)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        length === l 
                          ? 'bg-black text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={summarizeText}
                  disabled={isLoading || !inputText.trim()}
                  className="bg-black text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  Summarize
                </button>
              </div>
            </div>
          </section>

          {/* Output Section */}
          <section className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
              <div className="px-4 py-3 border-bottom border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <AlignCenter size={16} />
                  <span>AI Summary</span>
                </div>
                {summary && (
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500 flex items-center gap-1.5 text-xs"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-gray-400 gap-4"
                    >
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-sm animate-pulse">Distilling key insights...</p>
                    </motion.div>
                  ) : error ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-red-500 gap-2 text-center p-4"
                    >
                      <p className="font-medium">Something went wrong</p>
                      <p className="text-xs opacity-80">{error}</p>
                    </motion.div>
                  ) : summary ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-li:my-1"
                    >
                      <Markdown>{summary}</Markdown>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Sparkles size={32} />
                      </div>
                      <p className="text-sm max-w-[200px]">Your summary will appear here once generated</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <footer className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 Gemini Summarizer Agent. Powered by Google AI Studio.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Gemini 3 Flash
            </span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
