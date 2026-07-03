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
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>
          Assigned Employees ({employees.length})
        </Text>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {employees.map((emp) => (
            <View key={emp.id} style={styles.employeeCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {emp.firstName[0]}{emp.lastName[0]}
                  </Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={styles.name}>
                    {emp.firstName} {emp.lastName}
                  </Text>
                  <Text style={styles.empId}>{emp.id}</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                <Tag label={emp.position} />
                <Tag label={emp.department} muted />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Tag({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <View style={[styles.tag, muted && styles.tagMuted]}>
      <Text style={[styles.tagText, muted && styles.tagTextMuted]}>{label}</Text>
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
    color: "#374151",
  },
  chevron: {
    fontSize: 10,
    color: "#6B7280",
  },
  list: {
    marginTop: 10,
    gap: 10,
  },
  employeeCard: {
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  empId: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagMuted: {
    backgroundColor: "#F3F4F6",
  },
  tagText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "500",
  },
  tagTextMuted: {
    color: "#6B7280",
  },
});
