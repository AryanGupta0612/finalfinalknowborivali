import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVisitorTracking() {
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getClientIP = async (): Promise<string> => {
    try {
      // Try to get real IP, fallback to a unique identifier
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      // Fallback to browser fingerprint
      return `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
    }
  };

  const trackVisitor = async () => {
    try {
      const visitorIP = await getClientIP();
      const userAgent = navigator.userAgent;

      // Check if visitor exists - removed .single() to handle no results gracefully
      const { data: visitors } = await supabase
        .from('visitor_tracking')
        .select('*')
        .eq('visitor_ip', visitorIP);

      const existingVisitor = visitors && visitors.length > 0 ? visitors[0] : null;

      if (existingVisitor) {
        // Update existing visitor
        await supabase
          .from('visitor_tracking')
          .update({
            last_visit: new Date().toISOString(),
            visit_count: existingVisitor.visit_count + 1
          })
          .eq('visitor_ip', visitorIP);
      } else {
        // Insert new visitor
        await supabase
          .from('visitor_tracking')
          .insert({
            visitor_ip: visitorIP,
            user_agent: userAgent
          });
      }

      // Get total unique visitors
      const { data: totalCount } = await supabase
        .rpc('get_total_visitors');

      setVisitorCount(totalCount || 0);
    } catch (error) {
      console.error('Error tracking visitor:', error);
      // Fallback to localStorage count
      const localCount = localStorage.getItem('borivali-visitor-count');
      setVisitorCount(localCount ? parseInt(localCount, 10) : 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackVisitor();
  }, []);

  return { visitorCount, loading };
}