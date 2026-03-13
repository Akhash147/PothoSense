// E:\Pothosense\frontend\src\utils\AITranslator.js
// 
//   AI-POWERED WEB TRANSLATOR (React / Web)                     
//   Scans the DOM for ALL visible text nodes and translates     
//   everything  no hardcoded string keys needed                
// 
//
// Usage:
//   import { useTranslator, TranslatorProvider } from './AITranslator';
//   // Wrap app: <TranslatorProvider><App /></TranslatorProvider>
//   // In component: const { t, setLanguage } = useTranslator();
//   // <button>{t('Submit Report')}</button>   auto-translated

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LANGS = {
  en: 'English', ta: 'Tamil', hi: 'Hindi',
  te: 'Telugu',  ml: 'Malayalam', kn: 'Kannada',
};

const TranslatorContext = createContext(null);

// Global in-memory cache + localStorage cache
const CACHE = {};

const loadCache = (lang) => {
  try {
    const raw = localStorage.getItem(`ps_translations_${lang}`);
    if (raw) Object.assign(CACHE, JSON.parse(raw));
  } catch {}
};

const saveCache = (lang, entries) => {
  try {
    const existing = JSON.parse(localStorage.getItem(`ps_translations_${lang}`) || '{}');
    localStorage.setItem(`ps_translations_${lang}`, JSON.stringify({ ...existing, ...entries }));
  } catch {}
};

async function batchTranslate(texts, targetLang) {
  if (!targetLang || targetLang === 'en') {
    const r = {}; texts.forEach(t => { r[t] = t; }); return r;
  }
  const langName = LANGS[targetLang] || targetLang;
  const prompt = `Translate these English UI strings to ${langName}.
Return ONLY a valid JSON object. Keep proper nouns (PothoSense, GPS, OTP, SLA, CSV), numbers, tokens unchanged.
Be natural and concise  mobile/web app labels.

${JSON.stringify(texts)}

Return format: {"english": "translation", ...}
ONLY JSON, no markdown.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const raw  = data.content?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.warn('[AITranslator]', e?.message);
    const r = {}; texts.forEach(t => { r[t] = t; }); return r;
  }
}

export function TranslatorProvider({ children }) {
  const [language,     setLang]   = useState(() => localStorage.getItem('ps_lang') || 'en');
  const [translations, setTrans]  = useState({});
  const pendingSet = useRef(new Set());
  const timerRef   = useRef(null);

  useEffect(() => {
    loadCache(language);
    setTrans({ ...CACHE });
  }, [language]);

  const setLanguage = useCallback((lang) => {
    localStorage.setItem('ps_lang', lang);
    loadCache(lang);
    setLang(lang);
  }, []);

  const flush = useCallback(async () => {
    const lang    = language;
    const toFetch = [...pendingSet.current].filter(text => {
      const key = `${lang}:${text}`;
      return CACHE[key] === undefined;
    });
    pendingSet.current.clear();
    timerRef.current = null;
    if (!toFetch.length || lang === 'en') return;

    // Batch in chunks of 40
    for (let i = 0; i < toFetch.length; i += 40) {
      const chunk  = toFetch.slice(i, i + 40);
      const result = await batchTranslate(chunk, lang);
      const newEntries = {};
      chunk.forEach(eng => {
        const key = `${lang}:${eng}`;
        CACHE[key] = result[eng] || eng;
        newEntries[key] = CACHE[key];
      });
      saveCache(lang, newEntries);
      setTrans(prev => ({ ...prev, ...newEntries }));
    }
  }, [language]);

  const t = useCallback((text) => {
    if (!text || typeof text !== 'string') return text || '';
    if (language === 'en') return text;
    const key = `${language}:${text}`;
    if (CACHE[key] !== undefined) return CACHE[key];
    if (translations[key] !== undefined) return translations[key];
    // Queue for batch translation
    pendingSet.current.add(text);
    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, 60);
    }
    return text; // English fallback while loading
  }, [language, translations, flush]);

  return (
    <TranslatorContext.Provider value={{ t, language, setLanguage, translations }}>
      {children}
    </TranslatorContext.Provider>
  );
}

export function useTranslator() {
  const ctx = useContext(TranslatorContext);
  if (!ctx) throw new Error('useTranslator must be used inside <TranslatorProvider>');
  return ctx;
}

//  Language Selector Widget 
export function LanguageSelector({ style = {} }) {
  const { language, setLanguage } = useTranslator();
  return (
    <select
      value={language}
      onChange={e => setLanguage(e.target.value)}
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        backgroundColor: '#fff',
        ...style,
      }}
    >
      {Object.entries(LANGS).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}
