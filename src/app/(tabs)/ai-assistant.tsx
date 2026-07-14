import { useTheme } from "@/context/ThemeContext";
import MenuDropdown from "@/components/menuDropdown";
import { aiService, ChatMessage, getRecommendations } from "@/services/aiService";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  const router = useRouter();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ first_name?: string } | null>(null);
  const [attachments, setAttachments] = useState<
    { uri: string; name: string; type: string; size: number }[]
  >([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

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
    if (!sessionId) return;

    let isMounted = true;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id && isMounted) {
        try {
          const history = await aiService.loadChatHistory(session.user.id, sessionId);
          if (isMounted && history && history.length > 0) {
            setMessages(history);
          }
        } catch {
          // ignore - use default welcome
        }
      }
    })();

    return () => {
      isMounted = false;
    };
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
      const historyMessages: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
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
        attachments,
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
        const updated: ChatMessage[] = [...allMessages, { role: "assistant", content: reply || "" }];
        aiService.saveChatHistory(session.user.id, updated, sessionId).catch((error) => {
          logAssistantError("Save chat history failed", error, { sessionId });
        });
      }
      setAttachments([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logAssistantError("AI request failed", error, { sessionId });
      if (message.toLowerCase().includes("authentication")) {
        router.replace("/login");
        return;
      }
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

        const historyMessages: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
        const reply = await aiService.chatWithContext([...historyMessages, { role: "user", content: dynamicPrompt }]);
        appendMessage("assistant", reply || "I could not generate a response.");
        setLoading(false);
        setLoadingStatus("");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const updated: ChatMessage[] = [...historyMessages, { role: "user", content: item.message }, { role: "assistant", content: reply || "" }];
          aiService.saveChatHistory(session.user.id, updated, sessionId).catch((error) => {
            logAssistantError("Save chat history failed after recommendations", error, { sessionId });
          });
        }
      } catch (error) {
        logAssistantError("Recommendation error", error, { sessionId });
        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes("authentication")) {
          router.replace("/login");
          return;
        }
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
    setShowSessionPicker(false);
  };

  const handleSwitchSession = async (nextSessionId: string) => {
    await AsyncStorage.setItem("jeddspace_ai_session_id", nextSessionId);
    setSessionId(nextSessionId);
    setMessages([welcomeMessage]);
    setPrompt("");
    setShowSessionPicker(false);

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

  const handlePickAttachment = async () => {
    if (loading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setLoading(true);
      setLoadingStatus("Uploading attachment...");
      const uploaded = await aiService.uploadAttachment({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
        size: asset.size || 0,
      });
      setAttachments((current) => [
        ...current,
        uploaded as { uri: string; name: string; type: string; size: number },
      ]);
    } catch (error) {
      logAssistantError("Attachment upload failed", error, { sessionId });
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }]]}>
          {!isUser && (
            <View style={styles.assistantHeader}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>AI</Text>
              </View>
              <Text style={[styles.assistantName, { color: colors.primary }]}>JEDDSpace AI</Text>
            </View>
          )}
          <Text style={[styles.messageText, isUser && styles.userMessageText, { color: isUser ? "#fff" : colors.text }]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const renderPrompt = ({ item }: { item: { label: string; message: string } }) => (
    <TouchableOpacity
      style={styles.promptChip}
      onPress={() => void handleSuggestedPrompt(item)}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Text style={[styles.promptChipText, { color: colors.primary }]}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderSessionOption = (s: string, idx: number) => {
    const isActive = s === sessionId;
    const label = idx === 0 && isActive ? "Current Chat" : `Chat ${idx + 1}`;
    return (
      <TouchableOpacity
        key={s}
        style={[styles.sessionModalOption, isActive && styles.sessionModalOptionActive]}
        onPress={() => void handleSwitchSession(s)}
      >
        <View style={styles.sessionModalLeft}>
          <Ionicons
            name={isActive ? "chatbubbles" : "chatbubble-outline"}
            size={18}
            color={isActive ? "#fff" : colors.textSecondary}
          />
          <Text style={[styles.sessionModalText, isActive && styles.sessionModalTextActive]}>{label}</Text>
        </View>
        <View style={styles.sessionModalActions}>
          {isActive ? (
            <Text style={styles.sessionModalActiveLabel}>Active</Text>
          ) : (
            <TouchableOpacity onPress={() => void handleSwitchSession(s)} hitSlop={8}>
              <Text style={[styles.sessionModalSwitch, { color: colors.primary }]}>Switch</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MenuDropdown />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.title, { color: colors.text }]}>AI Assistant</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {`JEDDSpace AI is ready${profile?.first_name ? `, ${profile.first_name}` : ""}.`}
            </Text>
          </View>
          <TouchableOpacity style={styles.sessionBtn} onPress={() => setShowSessionPicker(true)} activeOpacity={0.7}>
            <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
            <Text style={[styles.sessionBtnText, { color: colors.primary }]}>Chats</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleClearChat} disabled={loading} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleNewChat} disabled={loading} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.iconBtnText, { color: colors.text }]}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_item, idx) => `msg-${idx}`}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="sparkles-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ask about jobs, employees, leave, contracts, notifications, or documents.
            </Text>
          </View>
        }
      />

      {loading && (
        <View style={[styles.statusPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{loadingStatus || "Thinking..."}</Text>
        </View>
      )}

      {attachments.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentScroll}>
          <View style={styles.attachmentRow}>
            {attachments.map((att, idx) => (
              <View key={idx} style={styles.attachmentChip}>
                <Ionicons name="document-attach-outline" size={14} color={colors.primary} />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {att.name}
                </Text>
                <TouchableOpacity onPress={() => setAttachments((c) => c.filter((_, i) => i !== idx))} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.suggestedPrompts}>
        <Text style={[styles.promptsTitle, { color: colors.textSecondary }]}>Suggested</Text>
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
        keyboardVerticalOffset={90}
      >
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.attachBtn, loading && styles.sendBtnDisabled]}
            onPress={() => void handlePickAttachment()}
            disabled={loading}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="attach-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Ask about employees, jobs, leave..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={() => void runPrompt(prompt, true)}
            editable={!loading}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!prompt.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => void runPrompt(prompt, true)}
            disabled={!prompt.trim() || loading}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: '#fff' }]}>
          <Text style={{color:'#6B7280'}}>Disclaimer: Once you send a message to the JEDDSpace AI Assistant, you agree that your conversations with it will be logged for administrative and archival purposes within JEDD Technologies Corp. Please keep in mind to only send queries related to your work.</Text>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showSessionPicker} animationType="slide" transparent onRequestClose={() => setShowSessionPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSessionPicker(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowSessionPicker(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalList}>
              <TouchableOpacity style={styles.newChatRow} onPress={handleNewChat} activeOpacity={0.7}>
                <View style={styles.newChatIcon}>
                  <Ionicons name="add" size={20} color="#fff" />
                </View>
                <Text style={styles.newChatText}>New Chat</Text>
              </TouchableOpacity>
              {sessions.map((s, idx) => renderSessionOption(s, idx))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const Pressable = ({ children, ...rest }: { children: React.ReactNode } & React.ComponentProps<typeof TouchableOpacity>) => (
  <TouchableOpacity activeOpacity={1} {...rest}>
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  sessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sessionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  messagesList: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
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
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  userBubble: {
    backgroundColor: "#1E0977",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  aiAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1E0977",
  },
  assistantName: {
    fontSize: 11,
    fontWeight: "700",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  attachmentScroll: {
    maxHeight: 44,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  attachmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  suggestedPrompts: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  promptsTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  promptsList: {
    gap: 8,
    paddingBottom: 4,
  },
  promptChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E0977",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalList: {
    padding: 16,
    gap: 8,
  },
  newChatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  newChatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E0977",
    alignItems: "center",
    justifyContent: "center",
  },
  newChatText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sessionModalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionModalOptionActive: {
    backgroundColor: "#1E0977",
    borderColor: "#1E0977",
  },
  sessionModalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sessionModalText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionModalTextActive: {
    color: "#fff",
  },
  sessionModalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionModalActiveLabel: {
    fontSize: 12,
    color: "#C7D2FE",
    fontWeight: "600",
  },
  sessionModalSwitch: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EEF2FF",
  },
});
