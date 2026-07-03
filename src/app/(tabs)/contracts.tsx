import Card from "@/components/card";
import ExpandableEmployeeList from "@/components/ExpandableEmployeeList";
import MenuDropdown from "@/components/menuDropdown";
import StatusBadge from "@/components/StatusBadge";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
}

type Contract = {
  id: string;
  commissioner: string;
  status: "ongoing" | "cancelled" | "completed";
  destination: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  assignedEmployees: Employee[];
}

const employeeList: Employee[] = [
  { id: 'EMP-001', firstName: "John",    lastName: "Doe",     position: "Software Engineer", department: "Engineering" },
  { id: 'EMP-002', firstName: "Jane",    lastName: "Smith",   position: "Project Manager",   department: "Operations" },
  { id: 'EMP-003', firstName: "Michael", lastName: "Brown",   position: "Data Analyst",      department: "Analytics" },
  { id: 'EMP-004', firstName: "Sarah",   lastName: "Wilson",  position: "HR Specialist",     department: "Human Resources" },
  { id: 'EMP-005', firstName: "Emily",   lastName: "Johnson", position: "UX Designer",       department: "Design" },
];

const contractsList: Contract[] = [
  {
    id: '1',
    commissioner: "John Doe",
    status: "ongoing",
    destination: "Makati City, Metro Manila",
    location: "456 Elm St, BGC, Taguig",
    startDate: "Jun 1, 2025",
    endDate: "Jun 30, 2025",
    description: "Description of the commission.",
    assignedEmployees: [employeeList[1], employeeList[2]],
  },
  {
    id: '2',
    commissioner: "Emily Johnson",
    status: "ongoing",
    destination: "Quezon City, Metro Manila",
    location: "123 Main St, Diliman",
    startDate: "Jun 5, 2025",
    endDate: "Jun 20, 2025",
    description: "Description of the commission.",
    assignedEmployees: [employeeList[3]],
  },
  {
    id: '3',
    commissioner: "Michael Brown",
    status: "cancelled",
    destination: "Cebu City, Cebu",
    location: "789 Pine St, Lahug",
    startDate: "May 15, 2025",
    endDate: "May 25, 2025",
    description: "Description of the commission.",
    assignedEmployees: [employeeList[0]],
  },
  {
    id: '4',
    commissioner: "Sarah Wilson",
    status: "completed",
    destination: "Davao City, Davao del Sur",
    location: "101 Maple St, Poblacion",
    startDate: "Apr 10, 2025",
    endDate: "Apr 20, 2025",
    description: "Description of the commission.",
    assignedEmployees: [employeeList[4]],
  },
];

export default function Contracts() {
  return (
    <View style={styles.container}>
      <MenuDropdown />

      <ScrollView showsVerticalScrollIndicator={false}>
        <FlatList
          data={contractsList}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card>
              {/* Commissioner + status */}
              <View style={styles.cardHeader}>
                <Text style={styles.commissioner}>{item.commissioner}</Text>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.divider} />

              {/* Contract details */}
              <View style={styles.detailsGrid}>
                <DetailRow label="Destination" value={item.destination} />
                <DetailRow label="Location"    value={item.location} />
                <DetailRow label="Start Date"  value={item.startDate} />
                <DetailRow label="End Date"    value={item.endDate} />
              </View>

              <View style={styles.divider} />

              {/* Expanded employee list */}
              <ExpandableEmployeeList employees={item.assignedEmployees} />
            </Card>
          )}
          contentContainerStyle={{ gap: 8 }}
        />
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commissioner: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  detailsGrid: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    width: 90,
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
});
