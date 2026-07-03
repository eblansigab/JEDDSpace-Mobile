import MenuDropdown from "@/components/menuDropdown";
import { aiService, ChatMessage, getRecommendations } from "@/services/aiService";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "I can answer questions about employees, jobs, leave requests, contracts, notifications, documents, and recommendations. You can also upload PDF, TXT, CSV, DOCX, XLSX, PNG, JPG, WEBP, MP3, WAV, or M4A files for analysis.",
};

const quickPrompts = [
  { label: "Today's Jobs", message: "Summarize today's jobs." },
  { label: "Operations Summary", message: "How are operations today?" },
  { label: "Available Workers", message: "Who is available tomorrow and why?" },
  { label: "Employees on Leave", message: "Show the employees on approved leave and summarize the leave details." },
  { label: "Contract Summary", message: "Summarize the current contracts." },
  { label: "Unread Notifications", message: "Summarize unread notifications." },
  { label: "Recommendation Explanation", message: "Explain why the recommended worker was selected for this assignment window." },
  { label: "Previous Summaries", message: "Show previous AI summaries." },
  { label: "Document Summary", message: "List the uploaded documents." },
  { label: "Summarize Document", message: "Can you summarize the uploaded employee handbook?" },
  { label: "Compare Contract", message: "Check for conflicts between an uploaded contract and our existing contracts." },
];

const logAssistantError = (label: string, error: unknown, meta: Record<string, unknown> = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    label,
    message: error instanceof Error ? error.message : String(error),
    ...meta,
  };
  console.error("[MobileAI]", JSON.stringify(entry));
};

const createSessionId = () => `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function AiAssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ first_name?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let storedSessionId = "";
      try {
        storedSessionId = (await AsyncStorage.getItem("jeddspace_ai_session_id")) || "";
      } catch {
        // ignore storage errors
      }

      if (!storedSessionId) {
        storedSessionId = createSessionId();
        await AsyncStorage.setItem("jeddspace_ai_session_id", storedSessionId);
      }
      setSessionId(storedSessionId);

      try {
        const storedSessions = JSON.parse((await AsyncStorage.getItem("jeddspace_ai_sessions")) || "[]");
        setSessions(Array.isArray(storedSessions) && storedSessions.length ? storedSessions : [storedSessionId]);
      } catch {
        setSessions([storedSessionId]);
      }

      if (session?.user?.id) {
        supabase
          .from("employee")
          .select("first_name,last_name,role")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      }
    })();
  }, []);

  useEffect(() => {
    if (sessionId && profile?.first_name !== undefined) {
      void (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          try {
            const history = await aiService.loadChatHistory(session.user.id, sessionId);
            if (history && history.length > 0) {
              setMessages(history);
            }
          } catch {
            // ignore - use default welcome
          }
        }
      })();
    }
  }, [sessionId]);

  const appendMessage = (role: "user" | "assistant", content: string) => {
    setMessages((current) => [...current, { role, content }]);
  };

  const runPrompt = async (rawPrompt: string, attachContext = false) => {
    const trimmed = String(rawPrompt || "").trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setLoadingStatus(
      attachContext || /document|file|upload|pdf|image|handbook/i.test(trimmed)
        ? "Retrieving document..."
        : "Thinking..."
    );
    setPrompt("");

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    let statusTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const historyMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const allMessages = [...historyMessages, userMessage];
      setMessages((current) => [...current, userMessage]);

      statusTimer = setTimeout(
        () => setLoadingStatus(attachContext || /document|file|upload|pdf|image|handbook/i.test(trimmed) ? "Reading document..." : "Generating response..."),
        900
      );

      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages((current) => [...current, assistantMessage]);

      const { response } = await aiService.chatWithContextStream(
        allMessages,
        [],
        sessionId,
        {
          onProgress: (message) => setLoadingStatus(message),
          onToken: (_token, fullText) => {
            setMessages((current) => {
              const updated = [...current];
              updated[updated.length - 1] = { role: "assistant", content: fullText };
              return updated;
            });
          },
        }
      );

      const reply = response || "I could not generate a response.";
      setMessages((current) => {
        const updated = [...current];
        updated[updated.length - 1] = { role: "assistant", content: reply };
        return updated;
        });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const updated = [...allMessages, { role: "assistant", content: reply || "" }];
        aiService.saveChatHistory(session.user.id, updated, sessionId).catch((error) => {
          logAssistantError("Save chat history failed", error, { sessionId });
        });
      }
    } catch (error) {
      logAssistantError("AI request failed", error, { sessionId });
      setMessages((current) => [...current, { role: "assistant", content: "AI service is currently unavailable." }]);
    } finally {
      if (statusTimer) clearTimeout(statusTimer);
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleSuggestedPrompt = async (item: { label: string; message: string }) => {
    if (item.label === "Recommendation Explanation") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      try {
        const recommendations = await getRecommendations({ startDate: tomorrowStr, endDate: tomorrowStr });
        const snapshot =
          recommendations.length > 0
            ? recommendations.map((r) => `${r.full_name} | Score: ${r.score} | Reasons: ${r.reasons?.join(", ") || "None"}`).join("\n")
            : "No recommendations available for tomorrow.";

        const dynamicPrompt = [
          "You are the AI assistant for JEDDSpace.",
          "Explain why each recommended worker was selected based on the recommendation scores and reasons.",
          "",
          "Recommendations for tomorrow:",
          snapshot,
          "",
          "Question: Provide a concise explanation for why these workers were recommended.",
        ].join("\n");

        setLoading(true);
        setLoadingStatus("Generating response...");
        setPrompt("");
        appendMessage("user", item.message);

        const historyMessages = messages.map((m) => ({ role: m.role, content: m.content }));
        const reply = await aiService.chatWithContext([...historyMessages, { role: "user", content: dynamicPrompt }]);
        appendMessage("assistant", reply || "I could not generate a response.");
        setLoading(false);
        setLoadingStatus("");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const updated = [...historyMessages, { role: "user", content: item.message }, { role: "assistant", content: reply || "" }];
          aiService.saveChatHistory(session.user.id, updated, sessionId).catch((error) => {
            logAssistantError("Save chat history failed after recommendations", error, { sessionId });
          });
        }
      } catch (error) {
        logAssistantError("Recommendation error", error, { sessionId });
        appendMessage("assistant", "Unable to fetch recommendations at this time.");
        setLoading(false);
        setLoadingStatus("");
      }
      return;
    }
    await runPrompt(item.message);
  };

  const handleClearChat = () => {
    const cleared = [welcomeMessage];
    setMessages(cleared);
    setPrompt("");
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        aiService.saveChatHistory(session.user.id, cleared, sessionId).catch((error) => {
          logAssistantError("Clear chat save failed", error, { sessionId });
        });
      }
    })();
  };

  const handleNewChat = async () => {
    const nextSessionId = createSessionId();
    await AsyncStorage.setItem("jeddspace_ai_session_id", nextSessionId);
    const nextSessions = [nextSessionId, ...sessions.filter((s) => s !== nextSessionId)].slice(0, 8);
    await AsyncStorage.setItem("jeddspace_ai_sessions", JSON.stringify(nextSessions));
    setSessions(nextSessions);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setPrompt("");
  };

  const handleSwitchSession = async (nextSessionId: string) => {
    await AsyncStorage.setItem("jeddspace_ai_session_id", nextSessionId);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setPrompt("");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      try {
        const history = await aiService.loadChatHistory(session.user.id, nextSessionId);
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch {
        // ignore
      }
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, item.role === "user" && styles.userMessageText]}>{item.content}</Text>
      </View>
    </View>
  );

  const renderPrompt = ({ item }: { item: { label: string; message: string } }) => (
    <TouchableOpacity
      style={styles.promptChip}
      onPress={() => void handleSuggestedPrompt(item)}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Text style={styles.promptChipText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MenuDropdown />

      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>
          {`JEDDSpace AI is ready${profile?.first_name ? `, ${profile.first_name}` : ""}. Ask about jobs, employees, leave, contracts, notifications, documents, or upload files for analysis.`}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearChat} disabled={loading}>
            <Text style={styles.clearBtnText}>Clear Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={handleNewChat} disabled={loading}>
            <Text style={styles.newBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sessionSelector}>
        <Text style={styles.sessionLabel}>Session:</Text>
        <View style={styles.sessionOptions}>
          {sessions.map((s, idx) => (
            <TouchableOpacity
              key={s}
              style={[styles.sessionOption, s === sessionId && styles.sessionOptionActive]}
              onPress={() => void handleSwitchSession(s)}
              disabled={loading}
            >
              <Text style={[styles.sessionOptionText, s === sessionId && styles.sessionOptionTextActive]}>
                {idx === 0 && s === sessionId ? "Current Chat" : `Chat ${idx + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_item, idx) => `msg-${idx}`}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet. Start by asking a question!</Text>
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#1E0977" />
          <Text style={styles.loadingText}>{loadingStatus || "Thinking..."}</Text>
        </View>
      )}

      <View style={styles.suggestedPrompts}>
        <FlatList
          horizontal
          data={quickPrompts}
          keyExtractor={(item) => item.label}
          renderItem={renderPrompt}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsList}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about employees, jobs, leave, contracts..."
            placeholderTextColor="#9CA3AF"
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={() => void runPrompt(prompt, true)}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!prompt.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => void runPrompt(prompt, true)}
            disabled={!prompt.trim() || loading}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  newBtn: {
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  sessionSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  sessionOptions: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  sessionOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  sessionOptionActive: {
    backgroundColor: "#1E0977",
  },
  sessionOptionText: {
    fontSize: 12,
    color: "#374151",
  },
  sessionOptionTextActive: {
    color: "#fff",
  },
  messagesList: {
    gap: 12,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBubble: {
    backgroundColor: "#1E0977",
  },
  assistantBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 14,
    color: "#111827",
  },
  userMessageText: {
    color: "#fff",
  },
  loadingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 40,
  },
  suggestedPrompts: {
    marginTop: 8,
  },
  promptsList: {
    gap: 8,
  },
  promptChip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptChipText: {
    fontSize: 12,
    color: "#1E0977",
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
  },
  sendBtn: {
    backgroundColor: "#1E0977",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});