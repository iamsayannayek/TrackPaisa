---
name: PaisaWeb architecture
description: Patterns and decisions for the PaisaWeb Expo finance app
---

## Context API
- `useApp()` from `@/context/AppContext` — NOT `useAppContext`
- `toggleTheme` (not `toggleDarkMode`) controls isDarkMode
- `openTxModal(tx?)`, `openCommitmentModal(com?)`, `skipCommitment(id)`, `markCommitmentPaid(id)`
- `activeTab` / `setActiveTab` for sub-view navigation on dashboard
- `commitments[].title` (not `.name`), `.date` (not `.dueDay`), `.isPaid`, `.isSkipped`
- `isDarkMode` defaults to `true` (dark by default)

## Colors
- `useAppColors()` from `@/hooks/useAppColors` — wraps `useColors()` which reads `isDarkMode` from AppContext
- tokens: `text`, `textSecondary`, `textTertiary`, `inputBg`, `inputBorder`, `cardBorder`, `warning`, `transfer`, `mutedForeground`, `surfaceElevated`, `tabBg`, `tabBorder`
- primary: #4f46e5 light / #818cf8 dark

## Charts
- `@/components/Charts` exports `DonutChart({ data: PieSlice[] })`, `SavingsLineChart({ data, filter })`, `ProgressBar`
- `PieSlice = { name, value, color }`
- Existing `@/components/charts/DonutChart` and `charts/LineChart` still exist — barrel Charts.tsx re-exports adapted versions

## SelectPicker
- Default export from `@/components/SelectPicker`, named export `SelectOption`
- Bottom-sheet modal, supports `group` field for grouped options

## Layout
- `(tabs)/_layout.tsx` uses ClassicTabLayout only (no NativeTabs/liquid glass)
- `GlobalModals` rendered inside ClassicTabLayout after `<Tabs />`
- SafeAreaView with `edges={["top","bottom"]}` on every screen
- Fonts: `@expo-google-fonts/inter` — blank screen on first render until fonts load is normal

**Why:** User uploaded their own implementation zip that fully replaced the scaffold. All decisions follow the uploaded source.
