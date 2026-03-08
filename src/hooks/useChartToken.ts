"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export interface AutochartistConfig {
  theme?: 'light' | 'dark';
  type?: 'technical' | 'sentiment' | 'market-news' | 'risk-calculator' | 
         'performance-stats' | 'calendar' | 'volatility' | 'favorites';
  language?: string;
  showAll?: boolean;
  nextDays?: number;
}

export const useAutochartist = (config: AutochartistConfig) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUrl = async () => {
      try {
        setLoading(true);
        
        // Add a timestamp to prevent caching
        const requestConfig = {
          ...config,
          _t: Date.now() // Add timestamp to force new request
        };
        
        const response = await axios.post("/api/token", requestConfig, {
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });

        const data = response.data;
        
        if (isMounted) {
          setUrl(data.url);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(config)]); // Use stringified config as dependency

  return { url, loading, error };
};