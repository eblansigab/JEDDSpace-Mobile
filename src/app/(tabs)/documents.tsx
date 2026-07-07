import { useTheme } from "@/context/ThemeContext";
import Card from "@/components/card";
import MenuDropdown from "@/components/menuDropdown";
import { supabase } from "@/lib/supabase";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {ethers} from "ethers"
import {storeHash} from "../../components/contract"

type DocumentItem = {
  document_id: string;
  title: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by?: string | null;
  created_at?: string | null;
};

export default function Documents() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
  const [fileType, setFileType] = useState("")
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: docs, error: docError } = await supabase
          .from("document")
          .select("document_id, title, file_name, file_size, file_type, uploaded_by, created_at")
          .order("created_at", { ascending: false });

        if (docError) throw docError;
        const docsList = (docs || []) as DocumentItem[];

        const uploaderIds = Array.from(
          new Set(docsList.map((d) => d.uploaded_by).filter((id): id is string => Boolean(id)))
        );

        let nameMap: Record<string, string> = {};
        if (uploaderIds.length > 0) {
          const { data: emps, error: empError } = await supabase
            .from("employee")
            .select("user_id, first_name, last_name")
            .in("user_id", uploaderIds);

          if (!empError && emps) {
            emps.forEach((e) => {
              if (e.user_id) {
                nameMap[e.user_id] = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "User";
              }
            });
          }
        }

        if (isMounted) {
          setDocuments(docsList);
          setEmployeeMap(nameMap);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[MobileAI] Documents load error:", err);
          Alert.alert("Error", "Failed to load documents.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFileName(asset.name);
      setSelectedUri(asset.uri);
      setFileType(asset.mimeType!)
    }
  };

  const uploadButton = async () => {
    if (!fileName || !selectedUri) return;
    setUploading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        Alert.alert("Error", "You must be logged in to upload documents.");
        return;
      }

      const resp = await fetch(selectedUri);
      const fileBody = await resp.arrayBuffer();
      const storagePath = `${Date.now()}-${fileName}`;
      const bytes = new Uint8Array(fileBody)
      const hash = ethers.keccak256(bytes)

      const { error: uploadError } = await supabase.storage
        .from("document")
        .upload(storagePath, fileBody, {
          contentType: fileType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("document").getPublicUrl(storagePath);
      const filePath = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from("document").insert({
        title: fileName,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: fileBody.byteLength,
        uploaded_by: session.user.id,
        hash: hash,
      });

      storeHash(fileName,hash)

      if (insertError) throw insertError;

      Alert.alert("Success", "Document uploaded successfully.");
      setFileName("");
      setSelectedUri(null);
    } catch (err) {
      console.error("[MobileAI] Upload error:", err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Upload Failed", message);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  };

  const filteredDocs = documents.filter((doc) =>
    doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E0977" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MenuDropdown />
      <TextInput
        style={[styles.search, { borderColor: colors.border, color: colors.text }]}
        placeholder="Search documents..."
        placeholderTextColor={colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <TouchableOpacity style={[styles.pickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickFile} activeOpacity={0.8}>
        <Text style={[styles.pickBtnText, { color: colors.text }]}>Choose File</Text>
      </TouchableOpacity>
      {fileName ? <Text style={[styles.fileName, { color: colors.textSecondary }]}>Selected: {fileName}</Text> : null}

      <TouchableOpacity
        style={[styles.uploadBtn, (!fileName || !selectedUri || uploading) && styles.uploadBtnDisabled]}
        onPress={uploadButton}
        disabled={!fileName || !selectedUri || uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.uploadBtnText}>Upload Document</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.document_id}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No documents found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={[styles.name, { color: colors.text }]}>{item.title || item.file_name || "Untitled"}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Uploaded by {employeeMap[item.uploaded_by || ""] || "Unknown"} • {formatDate(item.created_at)}
            </Text>
            {item.file_type ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Type: {item.file_type}</Text>
            ) : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  search: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  pickBtnText: { fontSize: 14, fontWeight: "600" },
  fileName: { fontSize: 13 },
  uploadBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  name: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  meta: { fontSize: 12 },
  emptyState: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 14 },
});
