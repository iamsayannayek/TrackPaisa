import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalModals from "@/components/GlobalModals";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="accounts">
          <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
          <Label>Accounts</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="budget">
          <Icon sf={{ default: "chart.pie", selected: "chart.pie.fill" }} />
          <Label>Budget</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="wealth">
          <Icon sf={{ default: "chart.line.uptrend.xyaxis", selected: "chart.line.uptrend.xyaxis" }} />
          <Label>Wealth</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="monthend">
          <Icon sf={{ default: "checkmark.square", selected: "checkmark.square.fill" }} />
          <Label>Month End</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <GlobalModals />
    </>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
              />
            ) : null,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Accounts",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="creditcard" tintColor={color} size={22} />
              ) : (
                <Feather name="credit-card" size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: "Budget",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="chart.pie" tintColor={color} size={22} />
              ) : (
                <Feather name="pie-chart" size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="wealth"
          options={{
            title: "Wealth",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={22} />
              ) : (
                <Feather name="trending-up" size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="monthend"
          options={{
            title: "Month End",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="checkmark.square" tintColor={color} size={22} />
              ) : (
                <Feather name="check-square" size={21} color={color} />
              ),
          }}
        />
      </Tabs>
      <GlobalModals />
    </>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
