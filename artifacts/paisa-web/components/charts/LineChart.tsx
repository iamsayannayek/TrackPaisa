import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from "react-native-svg";

interface DataPoint {
  label: string;
  spent: number;
  saved: number;
}

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height?: number;
  spentColor?: string;
  savedColor?: string;
}

export function SavingsLineChart({ data, width, height = 120, spentColor = "#EF4444", savedColor = "#10B981" }: LineChartProps) {
  if (!data || data.length < 2) {
    return (
      <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#64748B", fontSize: 12 }}>No data yet</Text>
      </View>
    );
  }

  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 24;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allValues = data.flatMap((d) => [d.spent, d.saved]);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 1);
  const range = maxVal - minVal || 1;

  const xStep = chartW / (data.length - 1);

  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

  const buildPath = (getter: (d: DataPoint) => number) => {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(getter(d))}`)
      .join(" ");
  };

  const spentPath = buildPath((d) => d.spent);
  const savedPath = buildPath((d) => d.saved);

  return (
    <View>
      <Svg width={width} height={height}>
        <Path d={spentPath} stroke={spentColor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={savedPath} stroke={savedColor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={toX(i)} cy={toY(d.spent)} r={3} fill={spentColor} />
            <Circle cx={toX(i)} cy={toY(d.saved)} r={3} fill={savedColor} />
          </React.Fragment>
        ))}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: padL }}>
        {data.map((d, i) => (
          <Text key={i} style={{ fontSize: 9, color: "#94A3B8", width: chartW / (data.length - 1), textAlign: i === 0 ? "left" : i === data.length - 1 ? "right" : "center" }}>
            {d.label}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 4, paddingHorizontal: padL }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 2, backgroundColor: spentColor, borderRadius: 1 }} />
          <Text style={{ fontSize: 10, color: "#64748B" }}>Spent</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 2, backgroundColor: savedColor, borderRadius: 1 }} />
          <Text style={{ fontSize: 10, color: "#64748B" }}>Saved</Text>
        </View>
      </View>
    </View>
  );
}
