import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
};

type Props = {
  employees: Employee[];
};

export default function ExpandableEmployeeList({ employees }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={[styles.headerText, { color: colors.text }]}>
          Assigned Employees ({employees.length})
        </Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {employees.map((emp) => (
            <View key={emp.id} style={[styles.employeeCard, { backgroundColor: colors.background }]}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {emp.firstName[0]}{emp.lastName[0]}
                  </Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {emp.firstName} {emp.lastName}
                  </Text>
                  <Text style={[styles.empId, { color: colors.textMuted }]}>{emp.id}</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                <Tag label={emp.position} colors={colors} />
                <Tag label={emp.department} muted colors={colors} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Tag({ label, muted = false, colors }: { label: string; muted?: boolean; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.tag, muted && [styles.tagMuted, { backgroundColor: colors.border }]]}>
      <Text style={[styles.tagText, { color: colors.primary }, muted && [styles.tagTextMuted, { color: colors.textSecondary }]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontWeight: "600",
    fontSize: 13,
  },
  chevron: {
    fontSize: 10,
  },
  list: {
    marginTop: 10,
    gap: 10,
  },
  employeeCard: {
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
  },
  empId: {
    fontSize: 11,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#EEF2FF",
  },
  tagMuted: {
    backgroundColor: "#F3F4F6",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#4F46E5",
  },
  tagTextMuted: {
    color: "#6B7280",
  },
});
