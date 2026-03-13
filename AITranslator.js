// E:\Pothosense\pothosense-expo\utils\AITranslator.js
// 
//   AI-POWERED UNIVERSAL TRANSLATOR                             
//   Uses Claude claude-haiku-4-5-20251001 to translate the      
//   ENTIRE app UI dynamically  no hardcoded strings needed     
// 
//
// Instead of a fixed key-value translation table (which misses words),
// this sends the current language + any text to Claude and gets back
// a proper translation. Results are cached in memory for performance.
//
// Usage in any component:
//   import { useAI } from '../utils/AITranslator';
//   const { t } = useAI();
//   <Text>{t('Report a Pothole')}</Text>  // auto-translated!
//
// The hook t() is synchronous (shows English instantly then swaps to
// translated version once the API call completes, ~300ms).

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGS = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
};

const TranslatorContext = createContext(null);

// In-memory + AsyncStorage cache
// key: `${lang}:${text}`  translated string
const CACHE = {};

// Batch translations pending for current tick
let batchQueue  = [];
let batchTimer  = null;

async function fetchTranslations(texts, targetLang) {
  if (targetLang === 'en') {
    const result = {};
    texts.forEach(t => { result[t] = t; });
    return result;
  }

  const langName = LANGS[targetLang] || targetLang;
  const prompt = `Translate the following UI strings from English to ${langName}.
Return ONLY a valid JSON object mapping each English string to its ${langName} translation.
Keep proper nouns (PothoSense, GPS, OTP, CSV, SLA) as-is.
Keep numbers, tokens, IDs as-is.
Be concise and natural  these are mobile app UI labels.

Strings to translate:
${JSON.stringify(texts)}

Return format: {"english string": "translated string", ...}
Return ONLY the JSON, no markdown, no explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const raw  = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('[AITranslator] Fetch error:', e?.message);
    const fallback = {};
    texts.forEach(t => { fallback[t] = t; });
    return fallback;
  }
}

export function TranslatorProvider({ children, language }) {
  const [translations, setTranslations] = useState({});
  const langRef = useRef(language);
  const pendingRef = useRef({});   // text  callbacks waiting

  useEffect(() => {
    langRef.current = language;
    // Load cached translations from AsyncStorage for this language
    AsyncStorage.getItem(`translations_${language}`).then(raw => {
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          setTranslations(prev => ({ ...prev, ...cached }));
          Object.assign(CACHE, cached);
        } catch {}
      }
    });
  }, [language]);

  const requestTranslation = useCallback((text) => {
    const cacheKey = `${language}:${text}`;
    if (CACHE[cacheKey] !== undefined) return CACHE[cacheKey];
    if (language === 'en') { CACHE[cacheKey] = text; return text; }

    // Add to batch queue
    if (!batchQueue.includes(text)) {
      batchQueue.push(text);
    }

    // Debounce: collect for 50ms then batch-fetch
    if (!batchTimer) {
      batchTimer = setTimeout(async () => {
        const toFetch = [...batchQueue].filter(t => CACHE[`${language}:${t}`] === undefined);
        batchQueue  = [];
        batchTimer  = null;

        if (!toFetch.length) return;

        // Split into chunks of 30 to avoid prompt overload
        for (let i = 0; i < toFetch.length; i += 30) {
          const chunk = toFetch.slice(i, i + 30);
          const result = await fetchTranslations(chunk, language);
          const newEntries = {};
          chunk.forEach(eng => {
            const key = `${language}:${eng}`;
            const translated = result[eng] || eng;
            CACHE[key]      = translated;
            newEntries[key] = translated;
          });
          // Persist to AsyncStorage
          const existing = JSON.parse(await AsyncStorage.getItem(`translations_${language}`) || '{}');
          await AsyncStorage.setItem(`translations_${language}`, JSON.stringify({ ...existing, ...newEntries }));
          setTranslations(prev => ({ ...prev, ...newEntries }));
        }
      }, 50);
    }

    return text; // return English immediately, will swap when translation arrives
  }, [language]);

  return (
    <TranslatorContext.Provider value={{ translations, requestTranslation, language }}>
      {children}
    </TranslatorContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(TranslatorContext);

  const t = useCallback((text) => {
    if (!ctx || !text) return text || '';
    const cacheKey = `${ctx.language}:${text}`;
    // Check in-memory cache first (fastest)
    if (CACHE[cacheKey] !== undefined) return CACHE[cacheKey];
    // Check context state (from AsyncStorage)
    if (ctx.translations[cacheKey] !== undefined) return ctx.translations[cacheKey];
    // Trigger async translation
    return ctx.requestTranslation(String(text));
  }, [ctx]);

  return { t, language: ctx?.language || 'en' };
}

// Standalone function for non-hook contexts (e.g., alert messages)
export async function translateText(text, language) {
  if (!text || language === 'en') return text;
  const cacheKey = `${language}:${text}`;
  if (CACHE[cacheKey]) return CACHE[cacheKey];
  const result = await fetchTranslations([text], language);
  const translated = result[text] || text;
  CACHE[cacheKey] = translated;
  return translated;
}
