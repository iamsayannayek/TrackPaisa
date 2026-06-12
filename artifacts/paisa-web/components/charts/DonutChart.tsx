import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface Slice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: Slice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, strokeWidth = 22, centerLabel, centerValue }: DonutChartProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          {centerValue && <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B" }}>{centerValue}</Text>}
          {centerLabel && <Text style={{ fontSize: 10, color: "#94A3B8" }}>{centerLabel}</Text>}
        </View>
      </View>
    );
  }

  let cumulativeAngle = -90;
  const slices = data.filter((d) => d.value > 0).map((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    const dashLength = (angle / 360) * circumference;
    return { ...d, path, dashLength, startAngle };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s, i) => (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.dashLength} ${circumference}`}
              strokeDashoffset={
                -(slices.slice(0, i).reduce((sum, prev) => sum + prev.dashLength, 0))
              }
              strokeLinecap="butt"
              rotation={-90}
              origin={`${cx}, ${cy}`}
            />
          ))}
        </G>
      </Svg>
      {(centerValue || centerLabel) && (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          {centerValue && (
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }} numberOfLines={1}>
              {centerValue}
            </Text>
          )}
          {centerLabel && (
            <Text style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>{centerLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}
