import Card from "@/components/card";
import MenuDropdown from "@/components/menuDropdown";
import { uploadFile } from "@/components/UploadFile";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import React, { useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type DocumentItem = {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
};

const documentsData: DocumentItem[] = [
  {
    id: "1",
    name: "Document 1.pdf",
    uploadedBy: "Admin",
    uploadedAt: "1 min ago",
  },
  {
    id: "2",
    name: "Document 2.docx",
    uploadedBy: "HR",
    uploadedAt: "5 mins ago",
  },
  {
    id: "3",
    name: "Presentation.pptx",
    uploadedBy: "Manager",
    uploadedAt: "10 mins ago",
  },
  {
    id: "4",
    name: "Report.pdf",
    uploadedBy: "Finance",
    uploadedAt: "20 mins ago",
  },
  {
    id: "5",
    name: "Invoice.xlsx",
    uploadedBy: "Accounting",
    uploadedAt: "30 mins ago",
  },
];

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  let file: File = new File();
  const [fileName, setFileName] = useState("");
  const [fileBody, setFileBody] = useState<string>();

  const pickFile = async () => {
    //picks a file from the phone
    const a = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (!a.canceled) {
      //picks the uri of the file and saves it to a variable
      const { uri } = a.assets[0];
      setFileName(a.assets[0].name);
      file = new File(uri);
      //converts the contents of the file to base64
      setFileBody(file.base64Sync());
    }
  };

  //separate function for uploading the file
  const uploadButton = async () => {
    //sends the file name and the base64 contents for uploading
    uploadFile(fileName, fileBody);
  };

  const filteredDocs = documentsData.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <MenuDropdown />
      <TextInput
        style={styles.search}
        placeholder="Search documents..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Button title="test" onPress={pickFile} />
      <Text>{fileName}</Text>
      <Button title="upload here" onPress={uploadButton} />
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              Uploaded by {item.uploadedBy} • {item.uploadedAt}
            </Text>
          </Card>
        )}
        contentContainerStyle={{ gap: 8 }}
      />
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
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E0977", // brand color
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#666",
  },
});
