import Card from "@/components/card";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export function ViewNumberOfDocuments() {
  const { colors } = useTheme();
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
      <Card style={{ backgroundColor: colors.surface }}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Documents</Text>
        <Text style={[styles.infoContent, { color: colors.textSecondary }]}>
          {loading ? "Loading..." : `There are ${count ?? 0} document${(count ?? 0) === 1 ? "" : "s"} uploaded.`}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
    paddingBottom: 8,
  },
  infoContent: {
    paddingBottom: 16,
  },
});
