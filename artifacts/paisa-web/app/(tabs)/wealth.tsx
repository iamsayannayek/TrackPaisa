import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useAppColors } from "@/hooks/useAppColors";

const fmt = (n: number) => `₹${Math.abs(n || 0).toLocaleString("en-IN")}`;
const fmtCompact = (n: number) => {
  const abs = Math.abs(n || 0);
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

// 🔥 SMART CONTRAST ENGINE
const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return "#ffffff";
  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
};

export default function WealthScreen() {
  const app = useApp();
  const c = useAppColors();

  const totalInvested = useMemo(
    () => app.investments.reduce((s, i) => s + (i.totalInvested || 0), 0),
    [app.investments],
  );
  const currentValue = useMemo(
    () => app.investments.reduce((s, i) => s + (i.currentValue || 0), 0),
    [app.investments],
  );
  const totalReturns = currentValue - totalInvested;
  const returnPct =
    totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const groupedInvestments = useMemo(() => {
    const groups: Record<string, any[]> = {};
    app.investments.forEach((inv) => {
      if (!groups[inv.type]) groups[inv.type] = [];
      groups[inv.type].push(inv);
    });
    return Object.entries(groups).map(([type, data]) => ({ type, data }));
  }, [app.investments]);

  const getAccName = (id?: string) =>
    app.accounts.find((a) => a.id === id)?.name ?? "Account";

  const getInvIcon = (
    inv: any,
  ): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (inv.icon)
      return inv.icon as keyof typeof MaterialCommunityIcons.glyphMap;
    const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
      MF: "chart-pie",
      PPF: "bank",
      LIC: "shield-check",
      FD: "lock",
      RD: "cash-clock",
      STOCK: "chart-line",
    };
    return map[inv.type] || "finance";
  };

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
          alignItems: "flex-end",
        }}
      >
        <View>
          <Text
            style={{
              color: c.text,
              fontSize: 26,
              fontWeight: "900",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            Wealth Tracker
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4 }}>
            Investments, Goals & Portfolio
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: c.primary + "11",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: c.primary + "33",
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                Invested
              </Text>
              <Text
                style={{
                  color: c.text,
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {fmt(totalInvested)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                Returns
              </Text>
              <Text
                style={{
                  color: totalReturns >= 0 ? c.income : c.expense,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {totalReturns >= 0 ? "+" : "-"}
                {fmt(Math.abs(totalReturns))} ({returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* FINANCIAL GOALS SECTION */}
        {app.goals.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MaterialCommunityIcons
                  name="bullseye-arrow"
                  size={20}
                  color={c.expense}
                />
                <Text
                  style={{
                    color: c.text,
                    fontSize: 16,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Financial Goals
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => app.openGoalModal()}
                style={{
                  backgroundColor: c.primary,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {app.goals.map((g) => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                const daysLeft = Math.max(
                  0,
                  Math.ceil(
                    (new Date(g.deadline).getTime() - new Date().getTime()) /
                      (1000 * 3600 * 24),
                  ),
                );
                const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
                const needPerMo = Math.max(
                  0,
                  (g.target - g.current) / monthsLeft,
                );

                const gData = g as any;
                const bgColor = gData.color || c.card;
                const isCustom = bgColor !== c.card;
                const useLightText = gData.textColorLight;
                const tColor = isCustom
                  ? useLightText
                    ? "#ffffff"
                    : "#0f172a"
                  : c.text;
                const tColorSec = isCustom
                  ? useLightText
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(15,23,42,0.7)"
                  : c.textSecondary;
                const iconBg =
                  gData.iconBgColor ||
                  (isCustom
                    ? useLightText
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.1)"
                    : c.primary + "1A");
                const iconCol =
                  gData.iconColor || (isCustom ? tColor : c.primary);
                const iconName = gData.icon || "bullseye-arrow";

                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => app.openGoalModal(g)}
                    activeOpacity={0.8}
                    style={{
                      width: 280,
                      backgroundColor: bgColor,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isCustom ? bgColor : c.cardBorder,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: iconBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialCommunityIcons
                          name={iconName}
                          size={24}
                          color={iconCol}
                        />
                      </View>
                      <Text
                        style={{
                          color: tColor,
                          fontSize: 16,
                          fontWeight: "800",
                        }}
                      >
                        {pct.toFixed(0)}%
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: tColor,
                        fontSize: 18,
                        fontWeight: "800",
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: tColorSec,
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        Linked: {getAccName(g.accountId)}
                      </Text>
                      <Text
                        style={{
                          color: tColorSec,
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        of {fmtCompact(g.target)}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: tColorSec,
                        fontSize: 12,
                        fontWeight: "500",
                        marginBottom: 12,
                      }}
                    >
                      Deadline: {g.deadline}
                    </Text>

                    <View
                      style={{
                        height: 6,
                        backgroundColor: isCustom
                          ? useLightText
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(0,0,0,0.1)"
                          : c.border,
                        borderRadius: 3,
                        marginBottom: 10,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${pct}%`,
                          height: 6,
                          backgroundColor:
                            pct === 100
                              ? isCustom
                                ? tColor
                                : c.income
                              : isCustom
                                ? tColor
                                : c.primary,
                          borderRadius: 3,
                        }}
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: tColorSec,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {daysLeft} days left
                      </Text>
                      <Text
                        style={{
                          color: tColorSec,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        Need {fmtCompact(needPerMo)}/mo
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* INVESTMENTS SECTION */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons
              name="chart-line-variant"
              size={20}
              color={c.expense}
            />
            <Text
              style={{
                color: c.text,
                fontSize: 16,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Investments
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => app.openInvestmentModal()}
            style={{
              backgroundColor: c.primary,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {groupedInvestments.length === 0 ? (
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
              name="seed-outline"
              size={48}
              color={c.mutedForeground}
            />
            <Text
              style={{ color: c.mutedForeground, marginTop: 12, fontSize: 15 }}
            >
              No investments tracked yet
            </Text>
          </View>
        ) : (
          groupedInvestments.map((group) => (
            <View key={group.type} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 13,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 12,
                  paddingLeft: 4,
                }}
              >
                {group.type}
              </Text>

              {group.data.map((inv) => {
                const isRet = inv.currentValue - inv.totalInvested;
                const isRetPct =
                  inv.totalInvested > 0 ? (isRet / inv.totalInvested) * 100 : 0;

                const freqMultiplier =
                  inv.frequency === "Monthly"
                    ? 12
                    : inv.frequency === "Quarterly"
                      ? 4
                      : inv.frequency === "Half-Yearly"
                        ? 2
                        : 1;
                const periodLabel =
                  inv.frequency === "Monthly"
                    ? "Months"
                    : inv.frequency === "Quarterly"
                      ? "Qtrs"
                      : inv.frequency === "Half-Yearly"
                        ? "Half-Yrs"
                        : "Yrs";
                const totalPeriods = (inv.tenureYears || 0) * freqMultiplier;
                const remainingPeriods = Math.max(
                  totalPeriods - (inv.paidCount || 0),
                  0,
                );

                const invColor = (inv as any).color || c.primary;
                const typeBg = invColor + "1A";
                const typeCol = invColor;
                const expBg = c.expense + "1A";
                const expCol = c.expense;
                const skipBg = c.warning + "1A";
                const skipCol = c.warning;

                return (
                  <TouchableOpacity
                    key={inv.id}
                    onPress={() => app.openInvestmentModal(inv)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: c.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: c.cardBorder,
                      flexDirection: "column",
                    }}
                  >
                    {/* ROW 1: BIG ICON + BADGES + CURRENT VALUE */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      {/* Left side: Icon block followed by badges */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                          paddingRight: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: typeBg,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <MaterialCommunityIcons
                            name={getInvIcon(inv)}
                            size={24}
                            color={invColor}
                          />
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 6,
                            flex: 1,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: typeBg,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: typeCol,
                                fontSize: 10,
                                fontWeight: "800",
                              }}
                            >
                              {inv.type}
                            </Text>
                          </View>
                          {inv.treatAsExpense ? (
                            <View
                              style={{
                                backgroundColor: expBg,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: expCol,
                                  fontSize: 10,
                                  fontWeight: "800",
                                  textTransform: "uppercase",
                                }}
                              >
                                EXPENSE
                              </Text>
                            </View>
                          ) : null}
                          {inv.skippedCount > 0 ? (
                            <View
                              style={{
                                backgroundColor: skipBg,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <MaterialCommunityIcons
                                name="alert"
                                size={10}
                                color={skipCol}
                              />
                              <Text
                                style={{
                                  color: skipCol,
                                  fontSize: 10,
                                  fontWeight: "800",
                                  textTransform: "uppercase",
                                }}
                              >
                                {inv.skippedCount} SKIPPED
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Right side: Value */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            color: c.text,
                            fontSize: 18,
                            fontWeight: "800",
                          }}
                        >
                          {fmtCompact(
                            inv.showReturns
                              ? inv.currentValue
                              : inv.totalInvested,
                          )}
                        </Text>
                        <Text
                          style={{
                            color: c.textSecondary,
                            fontSize: 10,
                            fontWeight: "500",
                            marginTop: 2,
                          }}
                        >
                          {inv.showReturns ? "Current Value" : "Total Saved"}
                        </Text>
                      </View>
                    </View>

                    {/* ROW 2: TITLE */}
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 18,
                        fontWeight: "800",
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                    >
                      {inv.name}
                    </Text>

                    {/* ROW 3: CONTRIBUTION */}
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 12,
                        fontWeight: "500",
                        marginBottom: 12,
                      }}
                    >
                      {fmt(inv.monthlyContribution)}/amt • {inv.frequency}
                    </Text>

                    {/* ROW 4: DUE DATE & QUARTERS */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 16,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={14}
                        color={invColor}
                      />
                      <Text
                        style={{
                          color: invColor,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Due: {inv.nextPaymentDate || "Not Set"}
                      </Text>
                      {inv.tenureYears > 0 ? (
                        <>
                          <Text style={{ color: c.border }}>|</Text>
                          <Text
                            style={{
                              color: c.warning,
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            {remainingPeriods} {periodLabel} left
                          </Text>
                        </>
                      ) : null}
                    </View>

                    {/* ROW 5: BOTTOM FINANCIALS */}
                    {inv.showReturns ? (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: c.border,
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 10,
                              fontWeight: "800",
                              letterSpacing: 0.5,
                            }}
                          >
                            INVESTED
                          </Text>
                          <Text
                            style={{
                              color: c.text,
                              fontSize: 15,
                              fontWeight: "800",
                              marginTop: 4,
                            }}
                          >
                            {fmtCompact(inv.totalInvested)}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 10,
                              fontWeight: "800",
                              letterSpacing: 0.5,
                            }}
                          >
                            RETURNS
                          </Text>
                          <Text
                            style={{
                              color: isRet >= 0 ? c.income : c.expense,
                              fontSize: 15,
                              fontWeight: "800",
                              marginTop: 4,
                            }}
                          >
                            {isRet >= 0 ? "+" : "-"}
                            {fmt(Math.abs(isRet))} ({isRetPct >= 0 ? "+" : ""}
                            {isRetPct.toFixed(1)}%)
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: c.border,
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 10,
                              fontWeight: "800",
                              letterSpacing: 0.5,
                            }}
                          >
                            INVESTED
                          </Text>
                          <Text
                            style={{
                              color: c.text,
                              fontSize: 15,
                              fontWeight: "800",
                              marginTop: 4,
                            }}
                          >
                            {fmtCompact(inv.totalInvested)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
