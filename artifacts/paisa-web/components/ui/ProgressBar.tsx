import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
}

export function ProgressBar({ progress, color = "#10B981", backgroundColor = "#E2E8F0", height = 6, borderRadius = 4 }: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={{ height, backgroundColor, borderRadius, overflow: "hidden" }}>
      <Animated.View style={{ height, width, backgroundColor: color, borderRadius }} />
    </View>
  );
}
