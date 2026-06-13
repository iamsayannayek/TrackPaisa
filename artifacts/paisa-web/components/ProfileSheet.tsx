import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

export default function ProfileSheet() {
  const app = useApp();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);

  // Temporary edit state safely falls back to empty strings if undefined
  const [editName, setEditName] = useState(app.profile?.name || "");
  const [editEmail, setEditEmail] = useState(app.profile?.email || "");

  if (!app.isProfileSheetOpen) return null;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      app.setProfile((prev) => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const handleSaveProfile = () => {
    app.setProfile((p) => ({ ...p, name: editName, email: editEmail }));
    setIsEditing(false);
  };

  const handleExport = async () => {
    try {
      const json = app.exportData();
      const fileUri = `${FileSystem.Paths.document.uri}/PaisaBackup.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing not available on this device");
      }
    } catch (e) {
      Alert.alert("Export Failed", "Could not export data.");
    }
  };

  const handleImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      if (res.canceled) return;
      if (res.assets && res.assets.length > 0) {
        const fileUri = res.assets[0].uri;
        const json = await FileSystem.readAsStringAsync(fileUri);
        const success = app.importData(json);
        if (success) {
          Alert.alert("Success", "Data imported successfully");
        } else {
          Alert.alert("Error", "Invalid backup file");
        }
      }
    } catch (e) {
      Alert.alert("Import Failed", "Could not read file.");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "Are you sure you want to delete ALL data? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: app.resetApp },
      ],
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={app.closeProfileSheet}
    >
      <View
        style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}
      >
        {/* Semi-transparent background overlay */}
        <TouchableOpacity
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          activeOpacity={1}
          onPress={app.closeProfileSheet}
        />

        {/* The Slide-over Drawer */}
        <View
          style={{
            width: "85%",
            maxWidth: 400,
            backgroundColor: c.background,
            height: "100%",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: c.text }}>
              Settings
            </Text>
            <TouchableOpacity
              onPress={app.closeProfileSheet}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Profile Section */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={{ position: "relative", marginBottom: 16 }}
              >
                {app.profile?.avatar ? (
                  <Image
                    source={{ uri: app.profile.avatar }}
                    style={{ width: 90, height: 90, borderRadius: 45 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      backgroundColor: c.surfaceElevated,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Feather name="user" size={40} color={c.mutedForeground} />
                  </View>
                )}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: c.primary,
                    padding: 6,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: c.background,
                  }}
                >
                  <Feather name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              {isEditing ? (
                <View style={{ width: "100%", gap: 12 }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    placeholderTextColor={c.mutedForeground}
                    style={{
                      backgroundColor: c.inputBg,
                      color: c.text,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.inputBorder,
                    }}
                  />
                  <TextInput
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Email"
                    placeholderTextColor={c.mutedForeground}
                    style={{
                      backgroundColor: c.inputBg,
                      color: c.text,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: c.inputBorder,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    style={{
                      backgroundColor: c.primary,
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Save Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: c.text,
                      marginBottom: 4,
                    }}
                  >
                    {app.profile?.name || "Guest User"}
                  </Text>
                  {app.profile?.email ? (
                    <Text style={{ color: c.textSecondary, marginBottom: 12 }}>
                      {app.profile.email}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Feather name="edit-2" size={14} color={c.primary} />
                    <Text style={{ color: c.primary, fontWeight: "500" }}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Preferences */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Preferences
            </Text>
            <View
              style={{
                backgroundColor: c.surfaceElevated,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Feather name="moon" size={20} color={c.text} />
                  <Text
                    style={{ fontSize: 16, color: c.text, fontWeight: "500" }}
                  >
                    Dark Mode
                  </Text>
                </View>
                <Switch
                  value={app.isDarkMode}
                  onValueChange={app.toggleTheme}
                  thumbColor="#fff"
                  trackColor={{ false: c.border, true: c.primary }}
                />
              </View>
            </View>

            {/* Data Management */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Data Management
            </Text>
            <View
              style={{
                backgroundColor: c.surfaceElevated,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <TouchableOpacity
                onPress={handleExport}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Feather
                  name="upload-cloud"
                  size={20}
                  color={c.text}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontSize: 16, color: c.text }}>
                  Export Backup
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleImport}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                }}
              >
                <Feather
                  name="download-cloud"
                  size={20}
                  color={c.text}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontSize: 16, color: c.text }}>
                  Import Backup
                </Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <TouchableOpacity
              onPress={handleReset}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                backgroundColor: c.destructive + "15",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.destructive + "30",
              }}
            >
              <Feather
                name="trash-2"
                size={18}
                color={c.destructive}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: c.destructive,
                  fontWeight: "600",
                }}
              >
                Reset All Data
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                textAlign: "center",
                color: c.mutedForeground,
                fontSize: 12,
                marginTop: 32,
              }}
            >
              App Version 1.0.0
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
