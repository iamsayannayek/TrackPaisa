import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const APP_VERSION = "1.0.0";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const c = useAppColors();
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          color: c.textSecondary,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.cardBorder,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  right,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const c = useAppColors();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: danger ? c.expense + "22" : c.primary + "22",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Feather
          name={icon as any}
          size={16}
          color={danger ? c.expense : c.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: danger ? c.expense : c.text,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
        {value ? (
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 1 }}>
            {value}
          </Text>
        ) : null}
      </View>
      {right ?? (
        onPress ? (
          <Feather name="chevron-right" size={16} color={c.mutedForeground} />
        ) : null
      )}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

function Divider() {
  const c = useAppColors();
  return (
    <View
      style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }}
    />
  );
}

export default function ProfileScreen() {
  const app = useApp();
  const c = useAppColors();
  const [editingProfile, setEditingProfile] = useState(false);
  const [localName, setLocalName] = useState(app.profile.name);
  const [localEmail, setLocalEmail] = useState(app.profile.email);
  const [localPhone, setLocalPhone] = useState(app.profile.phone);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");

  const initials = app.profile.name
    ? app.profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PW";

  const handleSaveProfile = () => {
    app.setProfile({ name: localName, email: localEmail, phone: localPhone });
    setEditingProfile(false);
  };

  const handleExport = async () => {
    try {
      const json = app.exportData();
      const today = new Date().toISOString().split("T")[0];
      await Share.share({
        message: json,
        title: `PaisaWeb_Backup_${today}.json`,
      });
    } catch {
      Alert.alert("Export failed", "Could not share the backup file.");
    }
  };

  const handleImport = () => {
    setShowImport(true);
    setImportJson("");
    setImportError("");
  };

  const handleImportConfirm = () => {
    if (!importJson.trim()) {
      setImportError("Please paste your backup JSON.");
      return;
    }
    const success = app.importData(importJson.trim());
    if (success) {
      setShowImport(false);
      setImportJson("");
      setImportError("");
      Alert.alert("Import successful", "Your data has been restored.");
    } else {
      setImportError("Invalid backup format. Please check and try again.");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all transactions, accounts, budgets, commitments, investments, and goals. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: app.resetApp,
        },
      ],
    );
  };

  const themeOptions = [
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "light", label: "Light", icon: "sun" },
  ] as const;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.background} />

      {/* Import Modal */}
      <Modal
        visible={showImport}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImport(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
            onPress={() => setShowImport(false)}
          />
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
              }}
            >
              Import Backup
            </Text>
            <Text
              style={{ color: c.textSecondary, fontSize: 13, marginBottom: 16 }}
            >
              Paste your PaisaWeb JSON backup below. This will replace all
              current data.
            </Text>
            <TextInput
              value={importJson}
              onChangeText={(v) => {
                setImportJson(v);
                setImportError("");
              }}
              placeholder='{"version":1,"accounts":[...],...}'
              placeholderTextColor={c.mutedForeground}
              multiline
              numberOfLines={6}
              style={{
                backgroundColor: c.inputBg,
                borderWidth: 1,
                borderColor: importError ? c.expense : c.inputBorder,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: c.text,
                fontSize: 13,
                minHeight: 120,
                textAlignVertical: "top",
                marginBottom: 8,
              }}
            />
            {importError ? (
              <Text
                style={{ color: c.expense, fontSize: 12, marginBottom: 12 }}
              >
                {importError}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowImport(false)}
                style={{
                  flex: 1,
                  backgroundColor: c.surfaceElevated,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: c.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleImportConfirm}
                style={{
                  flex: 1,
                  backgroundColor: c.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Import
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: c.primary + "33",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: c.primary,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: c.primary, fontSize: 28, fontWeight: "800" }}
            >
              {initials}
            </Text>
          </View>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "700" }}>
            {app.profile.name || "Your Name"}
          </Text>
          {app.profile.email ? (
            <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 2 }}>
              {app.profile.email}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              setLocalName(app.profile.name);
              setLocalEmail(app.profile.email);
              setLocalPhone(app.profile.phone);
              setEditingProfile(true);
            }}
            style={{
              marginTop: 10,
              backgroundColor: c.primary + "22",
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Inline */}
        {editingProfile && (
          <View
            style={{
              backgroundColor: c.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.cardBorder,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 14,
              }}
            >
              Edit Profile
            </Text>
            {[
              { label: "Full Name", value: localName, setter: setLocalName, placeholder: "Your name" },
              { label: "Email (optional)", value: localEmail, setter: setLocalEmail, placeholder: "you@example.com" },
              { label: "Phone (optional)", value: localPhone, setter: setLocalPhone, placeholder: "+91 9999..." },
            ].map(({ label, value, setter, placeholder }) => (
              <View key={label} style={{ marginBottom: 14 }}>
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  {label}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor={c.mutedForeground}
                  style={{
                    backgroundColor: c.inputBg,
                    borderWidth: 1,
                    borderColor: c.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: c.text,
                    fontSize: 14,
                  }}
                />
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingProfile(false)}
                style={{
                  flex: 1,
                  backgroundColor: c.surfaceElevated,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: c.textSecondary, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  flex: 1,
                  backgroundColor: c.primary,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preferences */}
        <Section title="Preferences">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: c.primary + "22",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Feather
                name={app.isDarkMode ? "moon" : "sun"}
                size={16}
                color={c.primary}
              />
            </View>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "500", flex: 1 }}>
              Dark Mode
            </Text>
            <Switch
              value={app.isDarkMode}
              onValueChange={app.toggleTheme}
              thumbColor="#fff"
              trackColor={{ false: c.border, true: c.primary }}
            />
          </View>
          <Divider />
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 12,
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              Theme: {app.isDarkMode ? "Dark" : "Light"}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    if (
                      (opt.value === "dark" && !app.isDarkMode) ||
                      (opt.value === "light" && app.isDarkMode)
                    ) {
                      app.toggleTheme();
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor:
                      (opt.value === "dark") === app.isDarkMode
                        ? c.primary
                        : c.surfaceElevated,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Feather
                    name={opt.icon}
                    size={14}
                    color={
                      (opt.value === "dark") === app.isDarkMode
                        ? "#fff"
                        : c.textSecondary
                    }
                  />
                  <Text
                    style={{
                      color:
                        (opt.value === "dark") === app.isDarkMode
                          ? "#fff"
                          : c.textSecondary,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <Row
            icon="download"
            label="Export Backup"
            value="Share all data as JSON"
            onPress={handleExport}
          />
          <Divider />
          <Row
            icon="upload"
            label="Import Backup"
            value="Restore from JSON backup"
            onPress={handleImport}
          />
        </Section>

        {/* Statistics */}
        <Section title="Your Data">
          {[
            { label: "Accounts", count: app.accounts.length, icon: "credit-card" },
            { label: "Transactions", count: app.transactions.length, icon: "activity" },
            { label: "Budgets", count: app.budgets.length, icon: "pie-chart" },
            { label: "Commitments", count: app.commitments.length, icon: "calendar" },
            { label: "Investments", count: app.investments.length, icon: "trending-up" },
            { label: "Goals", count: app.goals.length, icon: "target" },
          ].map(({ label, count, icon }, i, arr) => (
            <View key={label}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Feather
                  name={icon as any}
                  size={15}
                  color={c.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: c.text, fontSize: 14, flex: 1 }}>
                  {label}
                </Text>
                <View
                  style={{
                    backgroundColor: c.primary + "22",
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: c.primary,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {count}
                  </Text>
                </View>
              </View>
              {i < arr.length - 1 && <Divider />}
            </View>
          ))}
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <Row
            icon="trash-2"
            label="Reset All Data"
            value="Permanently delete everything"
            onPress={handleReset}
            danger
          />
        </Section>

        {/* About */}
        <Section title="About">
          <View
            style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>App Name</Text>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                PaisaWeb 💸
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>Version</Text>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                {APP_VERSION}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>Storage</Text>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                Local (Offline)
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: c.textSecondary, fontSize: 14 }}>Currency</Text>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
                ₹ Indian Rupee
              </Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
