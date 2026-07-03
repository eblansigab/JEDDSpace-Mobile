import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

const getAuthHeaders = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session?.access_token) {
      throw new Error('Authentication is required');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshed.session.access_token}`
    };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`
  };
};

const parseStreamEvents = (buffer: string) => {
  const events: { event: string; data: Record<string, unknown> }[] = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() || '';

  for (const part of parts) {
    const event = { event: 'message', data: {} };
    part.split('\n').forEach((line) => {
      if (line.startsWith('event:')) {
        event.event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        try {
          event.data = JSON.parse(line.slice(5).trim());
        } catch {
          event.data = {};
        }
      }
    });
    events.push(event);
  }

  return { events, remainder };
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatLog {
  chat_id: string;
  user_id: string;
  prompt: string;
  response: string;
  intent: string;
  created_at: string;
  employee?: {
    first_name?: string;
    last_name?: string;
    position?: string;
    department?: string;
  };
}

export interface AnalyticsData {
  topics: { name: string; percentage: number; count: number }[];
  topUsers: { userId: string; name: string; count: number }[];
  usage: { today: number; thisWeek: number; thisMonth: number };
  performance: {
    totalMeasuredRequests: number;
    averageResponseTimeMs: number;
    averageGroqLatencyMs: number;
    averageConfidence: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number;
    documentsProcessed: number;
    extractionSuccesses: number;
    entityResolutionSuccesses: number;
    entityResolutionSuccessRate: number;
    timeoutCount: number;
    clarificationRequests: number;
  };
}

export interface Recommendation {
  employee_id: string;
  full_name: string;
  position: string;
  score: number;
  reasons: string[];
}

const logAssistantError = (label: string, error: unknown, meta: Record<string, unknown> = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    label,
    message: error instanceof Error ? error.message : String(error),
    ...meta,
  };
  console.error('[MobileAI]', JSON.stringify(entry));
};

export const aiService = {
  async chat(message: string, messages: ChatMessage[] = []): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        action: 'chat',
        payload: { message, messages }
      })
    });

    if (!response.ok) {
      let errorMessage = `AI service request failed with status ${response.status}`;
      try {
        const payload = await response.json();
        if (payload?.error) errorMessage = payload.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return String(data?.response || '').trim();
  },

  async chatWithContext(messages: ChatMessage[], attachments: unknown[] = []): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        action: 'chat',
        payload: {
          message: messages[messages.length - 1]?.content || '',
          messages,
          attachments
        }
      })
    });

    if (!response.ok) {
      let errorMessage = `AI service request failed with status ${response.status}`;
      try {
        const payload = await response.json();
        if (payload?.error) errorMessage = payload.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return String(data?.response || '').trim();
  },

  async chatWithContextStream(
    messages: ChatMessage[],
    attachments: unknown[] = [],
    sessionId: string,
    callbacks: { onToken?: (token: string, fullText: string) => void; onProgress?: (message: string) => void; onDone?: (data: Record<string, unknown>) => void } = {}
  ): Promise<{ response: string; [key: string]: unknown }> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        action: 'chat',
        payload: {
          message: messages[messages.length - 1]?.content || '',
          messages,
          attachments,
          sessionId,
          stream: true
        }
      })
    });

    if (!response.ok || !response.body) {
      let errorMessage = `AI service request failed with status ${response.status}`;
      try {
        const payload = await response.json();
        if (payload?.error) errorMessage = payload.error;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let donePayload: Record<string, unknown> | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseStreamEvents(buffer);
        buffer = parsed.remainder;

        for (const item of parsed.events) {
          if (item.event === 'progress') {
            callbacks.onProgress?.(String(item.data?.message || 'Working...'));
          } else if (item.event === 'token') {
            const token = String(item.data?.token || '');
            fullText += token;
            callbacks.onToken?.(token, fullText);
          } else if (item.event === 'done') {
            donePayload = item.data || {};
            callbacks.onDone?.(donePayload);
          } else if (item.event === 'error') {
            throw new Error(String(item.data?.error || 'AI streaming failed.'));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      response: fullText || String(donePayload?.response || ''),
      ...(donePayload || {})
    };
  },

  async uploadAttachment(file: { uri: string; name: string; type: string; size: number }): Promise<Record<string, unknown>> {
    const fileName = `${Date.now()}-${file.name}`;
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const response = await fetch(file.uri);
    const fileBody = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('document')
      .upload(fileName, fileBody, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('document')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('document')
      .insert({
        uploaded_by: session?.user?.id || null,
        title: file.name,
        file_name: file.name,
        file_path: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async loadAllChatLogs(): Promise<ChatLog[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action: 'logs' })
    });
    if (!response.ok) return [];
    const { logs } = await response.json();
    return logs || [];
  },

  async loadAnalytics(): Promise<AnalyticsData | null> {
    const response = await fetch(`${API_BASE_URL}/api/admin`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action: 'analytics' })
    });
    if (!response.ok) return null;
    const { analytics } = await response.json();
    return analytics || null;
  },

  async saveChatHistory(userId: string, messages: ChatMessage[], sessionId = 'default'): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        action: 'history',
        payload: { userId, messages, sessionId, mode: 'save' }
      })
    });

    if (!response.ok) throw new Error('Failed to save chat history');
    return true;
  },

  async loadChatHistory(userId: string, sessionId = 'default'): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        action: 'history',
        payload: { userId, sessionId, mode: 'load' }
      })
    });
    if (!response.ok) return [];
    const { messages } = await response.json();
    return messages || [];
  }
};

export const getRecommendations = async ({ startDate, endDate }: { startDate?: string; endDate?: string }): Promise<Recommendation[]> => {
  if (!startDate || !endDate) return [];

  const hasDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return new Date(start1) <= new Date(end2) && new Date(end1) >= new Date(start2);
  };

  try {
    const [{ data: employees, error: employeeError }, { data: leaveRecords, error: leaveError }, { data: allJobs, error: jobsError }] = await Promise.all([
      supabase
        .from('employee')
        .select('employee_id,first_name,last_name,position,department,employee_type,employment_status,is_archived')
        .eq('employee_type', 'field_worker')
        .eq('employment_status', 'active')
        .eq('is_archived', false),
      supabase
        .from('leaveform')
        .select('employee_id,start_date,end_date')
        .eq('status', 'approved'),
      supabase
        .from('job')
        .select('employee_id,start_date,end_date,status')
    ]);

    if (employeeError) throw employeeError;
    if (leaveError) throw leaveError;
    if (jobsError) throw jobsError;

    const leaveByEmployee: Record<string, { start_date: string; end_date: string }[]> = {};
    leaveRecords?.forEach((lr) => {
      if (!leaveByEmployee[lr.employee_id]) leaveByEmployee[lr.employee_id] = [];
      leaveByEmployee[lr.employee_id].push(lr);
    });

    const jobsByEmployee: Record<string, { start_date: string; end_date: string; status: string }[]> = {};
    allJobs?.forEach((job) => {
      if (!jobsByEmployee[job.employee_id]) jobsByEmployee[job.employee_id] = [];
      jobsByEmployee[job.employee_id].push(job);
    });

    const recommendations = employees.map((employee) => {
      let score = 0;
      const reasons: string[] = [];

      const empLeaves = leaveByEmployee[employee.employee_id] || [];
      const onLeave = empLeaves.some((leave) =>
        hasDateOverlap(startDate, endDate, leave.start_date, leave.end_date)
      );

      if (!onLeave) {
        score += 50;
        reasons.push('Available');
      }

      const empJobs = jobsByEmployee[employee.employee_id] || [];
      const overlappingJobs = empJobs.filter(
        (job) => hasDateOverlap(startDate, endDate, job.start_date, job.end_date)
      );

      if (overlappingJobs.length === 0) {
        score += 30;
        reasons.push('Low Workload');
      } else if (overlappingJobs.length <= 2) {
        score += 15;
        reasons.push('Light Workload');
      }

      const completedJobs = empJobs.filter((job) => job.status === 'closed').length;
      if (completedJobs >= 5) {
        score += 20;
        reasons.push('Excellent Service History');
      } else if (completedJobs > 0) {
        score += 10;
        reasons.push('Good Service History');
      }

      return {
        employee_id: employee.employee_id,
        full_name: `${employee.first_name} ${employee.last_name}`,
        position: employee.position,
        score,
        reasons
      };
    });

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  } catch (err) {
    logAssistantError('getRecommendations failed', err);
    throw err;
  }
};
