import { AnnouncementsView } from "@/components/AnnouncementsView";
import Card from "@/components/card";
import MenuDropdown from "@/components/menuDropdown";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Announcement = {
  id: string;
  title: string;
  date: string;
  sender: string;
  description: string;
  isUnread?: boolean;
};

const announcementsData: Announcement[] = [
  {
    id: "1",
    title: "Office Closure on Thanksgiving",
    date: "2023-11-01",
    sender: "HR Department",
    description:
      "Please note that the office will be closed on Thanksgiving Day, November 23rd. Enjoy your holiday!",
    isUnread: true,
  },
  {
    id: "2",
    title: "Holiday Party Details",
    date: "2023-11-15",
    sender: "Events Team",
    description:
      "Join us for the annual holiday party on December 15th at 6 PM in the main conference room. Food and drinks will be provided!",
    isUnread: true,
  },
  {
    id: "3",
    title: "New Office Policies",
    date: "2023-11-20",
    sender: "Management",
    description:
      "Please review the updated office policies that will take effect starting January 1st, 2024. All employees are required to adhere to these policies.",
    isUnread: false,
  },
];

export default function Announcements() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const unreadCount = announcementsData.filter((a) => a.isUnread).length;

  return (
    <View style={styles.container}>
      <MenuDropdown />

      {/* Unread Announcements Badge */}
      {unreadCount > 0 && (
        <Card style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            You have {unreadCount} unread announcement{unreadCount !== 1 ? "s" : ""}
          </Text>
        </Card>
      )}

      <TextInput
        style={styles.search}
        placeholder="Search announcements by title..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterButtonText}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Text>
      </TouchableOpacity>

      <AnnouncementsView/>

      {/*showFilters && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g., 2023-11-01"
            value={filterDate}
            onChangeText={setFilterDate}
          />

          <Text style={styles.filterLabel}>Filter by Sender</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="e.g., HR Department"
            value={filterSender}
            onChangeText={setFilterSender}
          />

          <Button title="Apply Filters" onPress={handleApplyFilters} />
        </View>
      )*/}
{/*
      <ScrollView>
        {filteredAnnouncements.length === 0 ? (
          <Text style={styles.noResults}>No announcements found</Text>
        ) : (
          <FlatList
            data={filteredAnnouncements}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card
                style={[
                  styles.announcementCard,
                  item.isUnread && styles.unreadCard,
                ]}
              >
                <View style={styles.announcementHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.isUnread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.sender}>From: {item.sender}</Text>
                <Text style={styles.date}>Published on: {item.date}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </Card>
            )}
            contentContainerStyle={{ gap: 8 }}
          />
        )}
      </ScrollView>
*/}
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
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButton: {
    backgroundColor: "#1E0977",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filterContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  unreadBadge: {
    backgroundColor: "#E3F2FD",
    borderLeftWidth: 4,
    borderLeftColor: "#1E0977",
  },
  unreadText: {
    color: "#1E0977",
    fontSize: 14,
    fontWeight: "600",
  },
  announcementCard: {
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1E0977",
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  sender: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#333",
  },
  noResults: {
    textAlign: "center",
    fontSize: 14,
    color: "#999",
    marginTop: 20,
  },
});
