import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

export default function MonthEndScreen() {
  const app = useApp();
  const c = useAppColors();

  const tasks = app.monthEndTasks || [];
  const completed = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={c.background}
        translucent={false}
      />

      <View
        style={{
          padding: 16,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>
          Month End
        </Text>
        <TouchableOpacity
          onPress={() => app.openTaskModal()}
          style={{
            backgroundColor: c.primary,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            Task
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Circular Ring Card */}
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: c.radius + 4,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: c.cardBorder,
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              borderWidth: 6,
              borderColor: c.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 6,
                borderColor: progress === 100 ? c.income : c.primary,
                borderTopColor:
                  progress >= 25
                    ? progress === 100
                      ? c.income
                      : c.primary
                    : "transparent",
                borderRightColor:
                  progress >= 50
                    ? progress === 100
                      ? c.income
                      : c.primary
                    : "transparent",
                borderBottomColor:
                  progress >= 75
                    ? progress === 100
                      ? c.income
                      : c.primary
                    : "transparent",
                borderLeftColor: progress >= 100 ? c.income : "transparent",
                transform: [{ rotate: "-135deg" }],
              }}
            />
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Checklist Progress
            </Text>
            <Text
              style={{
                color: c.text,
                fontSize: 20,
                fontWeight: "800",
                marginTop: 4,
              }}
            >
              {completed} of {total} Tasks
            </Text>
            {progress === 100 && total > 0 && (
              <Text
                style={{
                  color: c.income,
                  fontSize: 13,
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                All done for this month! 🎉
              </Text>
            )}
          </View>
        </View>

        {/* Tasks List */}
        {total === 0 ? (
          <View
            style={{
              alignItems: "center",
              padding: 40,
              backgroundColor: c.card,
              borderRadius: c.radius,
              borderWidth: 1,
              borderColor: c.cardBorder,
            }}
          >
            <MaterialCommunityIcons
              name="checkbox-marked-circle-outline"
              size={48}
              color={c.mutedForeground}
            />
            <Text
              style={{ color: c.mutedForeground, marginTop: 12, fontSize: 15 }}
            >
              No tasks created yet
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => app.toggleMonthEndTask(task.id)}
              onLongPress={() => app.openTaskModal(task)}
              activeOpacity={0.7}
              style={{
                backgroundColor: c.card,
                borderRadius: c.radius,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: task.isCompleted ? c.income + "44" : c.cardBorder,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name={
                  task.isCompleted
                    ? "checkbox-marked-circle"
                    : "checkbox-blank-circle-outline"
                }
                size={28}
                color={task.isCompleted ? c.income : c.mutedForeground}
                style={{ marginRight: 16 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: task.isCompleted ? c.textSecondary : c.text,
                  fontSize: 16,
                  fontWeight: "600",
                  textDecorationLine: task.isCompleted
                    ? "line-through"
                    : "none",
                }}
              >
                {task.text}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
