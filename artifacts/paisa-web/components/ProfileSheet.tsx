import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

export default function ProfileSheet() {
  const app = useApp();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  // ==========================================
  // BULLETPROOF STATE EXTRACTION
  // ==========================================
  const profile = app?.profile || {};
  const avatarUrl = profile.avatar;
  const profileName = profile.name || "";
  const profileEmail = profile.email || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);

  // --- Right-to-Left Animation Engine ---
  const { width } = Dimensions.get("window");
  const DRAWER_WIDTH = Math.min(width * 0.85, 400);

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [modalVisible, setModalVisible] = useState(app.isProfileSheetOpen);

  useEffect(() => {
    if (app.isProfileSheetOpen) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [app.isProfileSheetOpen]);

  // --- Financial Calculations ---
  const monthTxs = useMemo(
    () =>
      (app.transactions || []).filter((t) =>
        t.date.startsWith(app.currentMonth),
      ),
    [app.transactions, app.currentMonth],
  );

  const income = useMemo(
    () =>
      monthTxs
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + (t.amount || 0), 0),
    [monthTxs],
  );

  const expenses = useMemo(
    () =>
      monthTxs
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + (t.amount || 0), 0),
    [monthTxs],
  );

  const netWorth = useMemo(() => {
    const accountTotal = (app.accounts || []).reduce(
      (s, a) => s + (a.balance || 0),
      0,
    );
    const investmentTotal = (app.investments || []).reduce(
      (s, i) => s + (i.currentValue || 0),
      0,
    );
    return accountTotal + investmentTotal;
  }, [app.accounts, app.investments]);

  // GATEKEEPER: Synchronized with Dashboard
  const hasSufficientData = monthTxs.length > 0;

  // SYNCHRONIZED PROFESSIONAL ADVISOR SCORING ENGINE
  const healthScore = useMemo(() => {
    if (!hasSufficientData) return 0;

    let score = 0;

    // Factor 1: Savings Rate (Max 35 points)
    if (income > 0) {
      const savingsRate = Math.max(0, income - expenses) / income;
      score += Math.min(35, Math.round(savingsRate * 175));
    }

    // Factor 2: Budget Discipline (Max 25 points)
    const monthBudgets = (app.budgets || []).filter(
      (b) => b.month === app.currentMonth,
    );
    if (monthBudgets.length > 0) {
      const disciplineScore =
        monthBudgets.reduce((sum, b) => {
          const spent = monthTxs
            .filter((t) => t.type === "EXPENSE" && t.category === b.category)
            .reduce((s, t) => s + (t.amount || 0), 0);
          const ratio = b.limit > 0 ? spent / b.limit : 0;
          return sum + Math.max(0, 1 - ratio);
        }, 0) / monthBudgets.length;
      score += Math.round(disciplineScore * 25);
    } else {
      score += 10;
    }

    // Factor 3: Commitment Reliability (Max 20 points)
    const monthCommits = (app.commitments || []).filter((c2) =>
      c2.date.startsWith(app.currentMonth),
    );
    if (monthCommits.length > 0) {
      const paidCount = monthCommits.filter((c2) => c2.isPaid).length;
      const skippedCount = monthCommits.filter((c2) => c2.isSkipped).length;
      score += Math.round((paidCount / monthCommits.length) * 20);
      score -= Math.round((skippedCount / monthCommits.length) * 10);
    } else {
      score += 10;
    }

    // Factor 4: Investment Consistency (Max 10 points)
    const activeInvestments = (app.investments || []).filter(
      (i) => i.autoSchedule,
    );
    if (activeInvestments.length > 0) {
      score += Math.min(10, activeInvestments.length * 5);
    }

    // Factor 5: Emergency Buffer Ratio (Max 10 points)
    if (expenses > 0) {
      const bufferRatio = netWorth / expenses;
      score += Math.min(10, Math.round(bufferRatio * 3.33));
    } else if (netWorth > 0) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }, [
    hasSufficientData,
    income,
    expenses,
    monthTxs,
    app.budgets,
    app.commitments,
    app.investments,
    netWorth,
    app.currentMonth,
  ]);

  // Synchronized Display States
  const hColor = !hasSufficientData
    ? c.mutedForeground
    : healthScore >= 75
      ? c.income
      : healthScore >= 60
        ? c.primary
        : healthScore >= 40
          ? c.warning
          : c.expense;
  const hDisplay = !hasSufficientData ? "N/A" : `${healthScore}/100`;

  const fmt = (n: number) =>
    `₹${Math.abs(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      app.setProfile((prev) => ({
        ...(prev || {}),
        avatar: result.assets[0].uri,
      }));
    }
  };

  const handleSaveProfile = () => {
    app.setProfile((p) => ({ ...(p || {}), name: editName, email: editEmail }));
    setIsEditing(false);
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
      Alert.alert("Export failed", "Could not share the backup data.");
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

  const StatItem = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: keyof typeof Feather.glyphMap;
    color: string;
  }) => (
    <View
      style={{
        width: "48%",
        backgroundColor: c.surfaceElevated,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <Feather
          name={icon}
          size={14}
          color={color}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            fontSize: 10,
            color: c.textSecondary,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "800", color: c.text }}>
        {value}
      </Text>
    </View>
  );

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={app.closeProfileSheet}
    >
      <View
        style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}
      >
        {/* Animated Dark Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={app.closeProfileSheet}
          />
        </Animated.View>

        {/* Animated Slide-over Drawer */}
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: c.background,
            height: "100%",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOffset: { width: -5, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 10,
            transform: [{ translateX: slideAnim }],
          }}
        >
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
              Profile
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
            {/* User Details */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={{ position: "relative", marginBottom: 16 }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
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
                      fontWeight: "700",
                      color: c.text,
                      marginBottom: 4,
                    }}
                  >
                    {profileName || "Guest User"}
                  </Text>
                  {profileEmail ? (
                    <Text style={{ color: c.textSecondary, marginBottom: 12 }}>
                      {profileEmail}
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
                    <Text style={{ color: c.primary, fontWeight: "600" }}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Financial Overview */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Financial Overview
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <StatItem
                title="Net Worth"
                value={fmt(netWorth)}
                icon="briefcase"
                color={c.primary}
              />
              <StatItem
                title="Health Score"
                value={hDisplay}
                icon="activity"
                color={hColor}
              />
              <StatItem
                title="Income"
                value={fmt(income)}
                icon="arrow-down-left"
                color={c.income}
              />
              <StatItem
                title="Budget Month"
                value={app.currentMonth}
                icon="calendar"
                color={c.transfer}
              />
            </View>

            {/* Application Data Stats */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: c.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Your Data
            </Text>
            <View
              style={{
                backgroundColor: c.surfaceElevated,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              {[
                { label: "Accounts", count: (app.accounts || []).length },
                {
                  label: "Transactions",
                  count: (app.transactions || []).length,
                },
                { label: "Budgets", count: (app.budgets || []).length },
                { label: "Commitments", count: (app.commitments || []).length },
                { label: "Investments", count: (app.investments || []).length },
                { label: "Goals", count: (app.goals || []).length },
              ].map(({ label, count }, i, arr) => (
                <View
                  key={label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <Text style={{ color: c.textSecondary, fontSize: 14 }}>
                    {label}
                  </Text>
                  <Text
                    style={{ color: c.text, fontSize: 14, fontWeight: "700" }}
                  >
                    {count}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
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
                    style={{ fontSize: 16, color: c.text, fontWeight: "600" }}
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

            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
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
                <Text
                  style={{ fontSize: 16, color: c.text, fontWeight: "500" }}
                >
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
                <Text
                  style={{ fontSize: 16, color: c.text, fontWeight: "500" }}
                >
                  Import Backup
                </Text>
              </TouchableOpacity>
            </View>

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
                  fontWeight: "700",
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
              PaisaWeb App Version 1.0.0
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
