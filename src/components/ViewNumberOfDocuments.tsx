import Card from "@/components/card";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export function ViewNumberOfDocuments() {
  const router = useRouter();
  async function viewDocuments() {
    const { data } = await supabase.storage.from("test").list("test");
    setCount(data);
  }

  const [count, setCount] = useState<{ name: string; id?: string }[] | null>();
  useEffect(() => {
    void viewDocuments();
  }, []);

  return (
    <View>
      <Card style={{ backgroundColor: "#f9f9f9" }}>
        <Text style={styles.infoTitle}>File Uploads</Text>
        <Text style={styles.infoContent}>
          There are{" "}
          {count?.length === 1 ? count.length + " file" : (count?.length || 0) + " files"}{" "}
          uploaded.
        </Text>
        <Button
          title="Check Documents"
          onPress={() => router.push("/documents")}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
    backgroundColor: "#fff",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
    color: "#1E0977",
    paddingBottom: 8,
  },
  infoContent: {
    paddingBottom: 16,
  },
});
