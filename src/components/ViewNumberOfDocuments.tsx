import Card from "@/components/card";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export function ViewNumberOfDocuments() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { count: docCount, error } = await supabase
          .from("document")
          .select("*", { count: "exact", head: false });

        if (error) throw error;
        setCount(docCount || 0);
      } catch (err) {
        console.error("[MobileAI] Document count error:", err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View>
      <Card style={{ backgroundColor: "#f9f9f9" }}>
        <Text style={styles.infoTitle}>Documents</Text>
        <Text style={styles.infoContent}>
          {loading ? "Loading..." : `There are ${count ?? 0} document${(count ?? 0) === 1 ? "" : "s"} uploaded.`}
        </Text>
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
