import React from "react";
import { useWindowDimensions, View, Text } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

// ---- Types ----
export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

interface DataPoint {
  name: string;
  spent: number;
  saved: number;
}

// ---- DonutChart ----
export function DonutChart({ data }: { data: PieSlice[] }) {
  const size = 160;
  const strokeWidth = 24;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <View style={{ alignItems: "center" }}>
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke="#334155"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <Text style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
          No spending data
        </Text>
      </View>
    );
  }

  let cumulativeAngle = -90;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * 360;
      const dashLength = (angle / 360) * circumference;
      const offset = cumulativeAngle;
      cumulativeAngle += angle;
      return { ...d, dashLength, offset };
    });

  let runningOffset = 0;
  const rendered = slices.map((s, i) => {
    const dashOffset = -(runningOffset);
    runningOffset += s.dashLength;
    return (
      <Circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${s.dashLength} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="butt"
        rotation={-90}
        origin={`${cx}, ${cy}`}
      />
    );
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <G>{rendered}</G>
      </Svg>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
          marginTop: 10,
          maxWidth: 260,
        }}
      >
        {slices.slice(0, 6).map((s, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: s.color,
              }}
            />
            <Text style={{ color: "#94a3b8", fontSize: 10 }}>{s.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- SavingsLineChart ----
export function SavingsLineChart({
  data,
  filter,
}: {
  data: DataPoint[];
  filter: "both" | "spent" | "saved";
}) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.min(screenWidth - 60, 340);
  const chartHeight = 110;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 20;
  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;

  const spentColor = "#f43f5e";
  const savedColor = "#10b981";

  if (!data || data.length < 2) {
    return (
      <View style={{ height: chartHeight, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#64748b", fontSize: 12 }}>No data yet</Text>
      </View>
    );
  }

  const allValues: number[] = [];
  if (filter === "both" || filter === "spent")
    data.forEach((d) => allValues.push(d.spent));
  if (filter === "both" || filter === "saved")
    data.forEach((d) => allValues.push(d.saved));

  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 1);
  const range = maxVal - minVal || 1;

  const xStep = innerW / (data.length - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + innerH - ((v - minVal) / range) * innerH;

  const buildPath = (getter: (d: DataPoint) => number) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(getter(d))}`).join(" ");

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        {(filter === "both" || filter === "spent") && (
          <Path
            d={buildPath((d) => d.spent)}
            stroke={spentColor}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {(filter === "both" || filter === "saved") && (
          <Path
            d={buildPath((d) => d.saved)}
            stroke={savedColor}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {data.map((d, i) => (
          <G key={i}>
            {(filter === "both" || filter === "spent") && (
              <Circle cx={toX(i)} cy={toY(d.spent)} r={3} fill={spentColor} />
            )}
            {(filter === "both" || filter === "saved") && (
              <Circle cx={toX(i)} cy={toY(d.saved)} r={3} fill={savedColor} />
            )}
          </G>
        ))}
      </Svg>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: padL,
        }}
      >
        {data.map((d, i) => (
          <Text
            key={i}
            style={{
              fontSize: 9,
              color: "#94a3b8",
              textAlign:
                i === 0 ? "left" : i === data.length - 1 ? "right" : "center",
            }}
          >
            {d.name}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---- ProgressBar ----
export function ProgressBar({
  progress,
  color = "#818cf8",
  backgroundColor = "#334155",
  height = 6,
  borderRadius = 4,
}: {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View
      style={{
        height,
        backgroundColor,
        borderRadius,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height,
          width: `${clamped * 100}%`,
          backgroundColor: color,
          borderRadius,
        }}
      />
    </View>
  );
}
