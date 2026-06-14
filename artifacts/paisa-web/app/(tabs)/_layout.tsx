import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import GlobalModals from "@/components/GlobalModals";
import { useAppColors } from "@/hooks/useAppColors";

export default function TabLayout() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <React.Fragment>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.OS === "ios" ? "transparent" : c.tabBg,
            borderTopWidth: 1,
            borderTopColor: c.tabBorder,
            elevation: 0,
            paddingBottom: insets.bottom + 10,
            height: 60 + insets.bottom,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: c.tabBg }]}
              />
            ),
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Feather name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Accounts",
            tabBarIcon: ({ color }) => (
              <Feather name="credit-card" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: "Budget",
            tabBarIcon: ({ color }) => (
              <Feather name="pie-chart" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wealth"
          options={{
            title: "Wealth",
            tabBarIcon: ({ color }) => (
              <Feather name="trending-up" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="monthend"
          options={{
            title: "Month End",
            tabBarIcon: ({ color }) => (
              <Feather name="check-square" size={22} color={color} />
            ),
          }}
        />

        {/* FORCE-HIDE THE PROFILE TAB FROM THE BOTTOM BAR */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <GlobalModals />
    </React.Fragment>
  );
}
