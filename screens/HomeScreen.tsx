import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { useOhmPipeline } from '../hooks/useOhmPipeline';
import { RiskTier } from '../core/confirmationLog';
import { useActionPlan } from '../hooks/useActionPlan';
import { useTheme } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';
import AnimatedCheckbox from '../components/AnimatedCheckbox';

function getTierColor(theme: OhmTheme, tier: RiskTier): string {
  if (tier === 'High') return theme.riskHigh;
  if (tier === 'Elevated') return theme.riskElevated;
  return theme.riskLow;
}

export default function HomeScreen() {
  const { state, refresh } = useOhmPipeline();
  const { plan, toggleStep } = useActionPlan();
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const styles = makeStyles(theme);

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        <Text style={styles.loadingText}>Checking current risk...</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{state.message}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { risk, weatherIsStale, riskWindow } = state;
  const hasData = true;
  const tierColor = getTierColor(theme, risk.tier);

  // Real duration remaining in the risk window, grounded in whichever
  // signal produced it (scheduled outage times, weather forecast window, or
  // the fixed default) - replaces a previously hardcoded "next 2 hours"
  // label that didn't reflect the actual window length or update with it.
  function formatRiskWindowLabel(): string {
    if (!riskWindow) return 'right now';
    const end = new Date(riskWindow.end).getTime();
    const hoursRemaining = Math.max(0, Math.ceil((end - Date.now()) / (60 * 60 * 1000)));
    if (hoursRemaining <= 0) return 'this window';
    if (hoursRemaining === 1) return 'next hour';
    return `next ${hoursRemaining} hours`;
  }
  const riskWindowLabel = formatRiskWindowLabel();

  // Svg Geometry Parameters - the original design was a near-full ring
  // (stroke-dasharray "236 59.31" on a full circle, period fits almost
  // exactly twice into the circumference) with a single small gap at the
  // top. Reproduced directly here as one continuous ~350deg arc starting
  // and ending just either side of 12 o'clock, so it's unambiguous rather
  // than reverse-engineered from dash-pattern math.
  const r = 94;
  const ringGapDeg = 10; // total gap size at the top, matching the original's visual gap
  const arcStartAngle = -90 + ringGapDeg / 2; // just clockwise of 12 o'clock (SVG: 0deg = 3 o'clock)
  const arcEndAngle = 270 - ringGapDeg / 2; // just short of a full loop back to 12 o'clock
  const arcSpan = arcEndAngle - arcStartAngle;

  // Angular gap between adjacent segments. Rounded stroke caps extend
  // strokeWidth/2 past each segment's endpoint, so two adjacent capped ends
  // eat a full strokeWidth (34px) of arc before any gap becomes visible -
  // this needs to clear that plus leave a real visible break, not just a
  // couple of degrees.
  const segmentGapDeg = 28;

  const rawContributions = [
    { key: 'weather' as const, icon: 'bad-weather' as const, value: Math.max(risk.contributions.weather, 0) },
    { key: 'maintenance' as const, icon: 'scheduled-maintenance' as const, value: Math.max(risk.contributions.history, 0) },
    { key: 'infrastructure' as const, icon: 'infrastructure' as const, value: Math.max(risk.contributions.infrastructure, 0) },
  ];
  const totalContribution = rawContributions.reduce((sum, c) => sum + c.value, 0);

  // Build each visible segment's start/end angle along the arc, walking
  // around in order. Factors contributing ~0% are dropped entirely rather
  // than shown as a sliver, per product decision.
  let cursorAngle = arcStartAngle;
  const segments = totalContribution > 0.001
    ? rawContributions
        .map((c) => {
          const fraction = c.value / totalContribution;
          const rawSpan = fraction * arcSpan;
          const startAngle = cursorAngle;
          const endAngle = startAngle + Math.max(rawSpan - segmentGapDeg, 0);
          cursorAngle = startAngle + rawSpan;
          return { ...c, fraction, startAngle, endAngle };
        })
        .filter((s) => s.fraction > 0.02 && s.endAngle > s.startAngle) // hide near-zero contributors entirely
    : [];

  // When every factor is ~0 (very low risk), there's nothing meaningful to
  // split - show the same near-full ring as one solid piece, no icons.
  const showFullArcFallback = segments.length === 0;

  // Point on the ring's centerline at a given SVG angle (0deg = 3 o'clock,
  // clockwise), used both for building arc paths and for icon placement.
  function pointOnRing(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: 130 + radius * Math.cos(rad), y: 130 + radius * Math.sin(rad) };
  }

  function arcPath(startAngle: number, endAngle: number): string {
    const start = pointOnRing(startAngle, r);
    const end = pointOnRing(endAngle, r);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }

  function iconPosition(angleDeg: number) {
    // Icons sit centered on the stroke itself, inside the arc.
    const pos = pointOnRing(angleDeg, r);
    return { left: pos.x - 12, top: pos.y - 12 };
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={[styles.boltBox, { borderColor: theme.border }]}>
          <OhmLogo size={12} />
        </View>
        <View>
          <Text style={styles.header}>Welcome back,</Text>
          <Text style={styles.headerBold}>User</Text>
        </View>
        <View style={[styles.settingsIconBox, { backgroundColor: theme.buttonPrimaryBg }]}>
          <Icon name="exit" size={15} color={theme.buttonPrimaryText} />
        </View>
      </View>

      <View style={styles.ring}>
        {hasData ? (
          <View style={styles.gaugeContainer}>
            {/* The Arc Track: one Path per contributing factor, its angular
                span sized proportionally to its share of the total risk
                score. Same color/width/cap as the original single arc -
                only the segmentation is new. */}
            <Svg width="260" height="260" viewBox="0 0 260 260">
              {showFullArcFallback ? (
                <Path
                  d={arcPath(arcStartAngle, arcEndAngle)}
                  fill="none"
                  stroke={theme.buttonPrimaryBg}
                  strokeWidth="34"
                  strokeLinecap="round"
                />
              ) : (
                segments.map((seg) => (
                  <Path
                    key={seg.key}
                    d={arcPath(seg.startAngle, seg.endAngle)}
                    fill="none"
                    stroke={theme.buttonPrimaryBg}
                    strokeWidth="34"
                    strokeLinecap="round"
                  />
                ))
              )}
            </Svg>

            {/* One icon per visible segment, placed at the end of that
                segment's own arc (its trailing edge, where it meets the
                next segment/gap), centered on the stroke itself so it sits
                inside the arc rather than floating outside it. Icon SVGs
                have hardcoded fill colors (not currentColor), so a small
                backing chip guarantees contrast instead of relying on the
                color prop (which only affects icons that inherit it). None
                render in the full-arc fallback case. */}
            {!showFullArcFallback && segments.map((seg) => {
              const pos = iconPosition(seg.endAngle);
              return (
                <View key={seg.key} style={[styles.dynamicIconAnchor, { left: pos.left, top: pos.top }]}>
                  <View style={styles.dynamicIconChip}>
                    <Icon name={seg.icon} size={14} color="#FFFFFF" />
                  </View>
                </View>
              );
            })}

            {/* Inner Center Text Core Labels */}
            <View style={styles.gaugeCenterLabels}>
              <Text style={[styles.riskTierText, { color: theme.textPrimary }]}>
                <Text style={{ color: tierColor }}>{risk.tier}</Text> Risk
              </Text>
              <Text style={styles.riskSubtext}>{riskWindowLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.ringOuterOutline, { borderColor: theme.textPrimary }]}>
            <View style={[styles.ringInnerOutline, { borderColor: theme.textPrimary }]}>
              <Text style={[styles.noDataText, { color: theme.textPrimary }]}>No data</Text>
            </View>
          </View>
        )}
      </View>

      {weatherIsStale && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleBannerText}>Using last known weather data - live fetch failed.</Text>
        </View>
      )}

      <View style={styles.divider} />
      <View style={styles.whySection}>
        <View style={styles.whyHeaderRow}>
          <Text style={styles.whyLabel}>WHY THIS ALERT?</Text>
          <Pressable 
            style={styles.whyArrowBox} 
            onPress={() => navigation.navigate('Main', { screen: 'Details' })}
          >
            <Text style={styles.whyArrow}>↗</Text>
          </Pressable>
        </View>
        <Text style={styles.whyText}>{risk.explanation}</Text>
        <Pressable onPress={() => navigation.navigate('Report')}>
          <Text style={styles.reportLink}>
            Had a past outage we missed? <Text style={styles.reportLinkBold}>Report it</Text>
          </Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionPlanWrap}>
        <Pressable style={styles.actionPlanCard} onPress={() => navigation.navigate('ActionPlan')}>
          <View style={styles.actionPlanHeader}>
            <View>
              <Text style={styles.actionPlanTitle}>Action Plan</Text>
              <Text style={styles.actionPlanSubtitle}>
                {plan.length === 0
                  ? risk.tier === 'Low'
                    ? 'Low risk period'
                    : 'Not created yet'
                  : plan.slice(0, 2).map((s) => s.text).join(', ') + (plan.length > 2 ? '...' : '')}
              </Text>
            </View>
          </View>
        </Pressable>

        {plan.length === 0 && (
          <View style={styles.actionPlanBody}>
            {risk.tier === 'Low' ? (
              <Text style={styles.actionPlanEmptyText}>
                Low risk right now - relax, we'll let you know if that changes.
              </Text>
            ) : (
              <Pressable onPress={() => navigation.navigate('ActionPlan')}>
                <Text style={styles.actionPlanCreateLink}>Create your custom action plan ↗</Text>
                <Text style={styles.actionPlanCreateSubtext}>
                  What steps will you take when the outage hits? We'll check in so nothing gets missed.
                </Text>
              </Pressable>
            )}
          </View>
        )}
        {plan.length > 0 && (
          <View style={styles.actionPlanBody}>
            {plan.map((step, i) => (
              <View key={i} style={styles.checklistRow}>
                <AnimatedCheckbox checked={step.done} onPress={() => toggleStep(i)} size={18} />
                <Text style={styles.checklistText}>{step.text}</Text>
              </View>
            ))}
          </View>
        )}

        {plan.length > 0 && (
          <Pressable
            style={[styles.editButton, { backgroundColor: theme.mode === 'light' ? '#FFFFFF' : '#000000' }]}
            onPress={() => navigation.navigate('ActionPlan')}
          >
            <Icon name="action-plan-edit" size={18} color={theme.mode === 'light' ? '#000000' : '#FFFFFF'} />
          </Pressable>
        )}

        <View style={styles.wifiIndicator}>
          <Icon
            name={weatherIsStale ? 'wifi-bar-low' : 'wifi-bar-full'}
            size={20}
            color={theme.mode === 'light' ? '#FFFFFF' : '#000000'}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: OhmTheme) {
  return StyleSheet.create({
    content: { padding: 20, paddingTop: 60, paddingBottom: 160, flexGrow: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: theme.textMuted, fontFamily: 'Gilroy-Regular' },
    errorTitle: { fontWeight: '700', fontSize: 16, marginBottom: 6, color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    errorText: { color: theme.textMuted, textAlign: 'center', marginBottom: 16, fontFamily: 'Gilroy-Regular' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    boltBox: { width: 36, height: 36, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    header: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', fontFamily: 'Gilroy-Regular' },
    headerBold: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', fontFamily: 'Gilroy-Bold' },
    settingsIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    ring: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    ringOuterOutline: { width: 220, height: 220, borderRadius: 110, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    ringInnerOutline: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    noDataText: { fontSize: 16, fontWeight: '900', fontFamily: 'Gilroy-Black' },
    riskTierText: { fontSize: 16, fontWeight: '900', fontFamily: 'Gilroy-Black' },
    riskSubtext: { color: theme.textMuted, marginTop: 4, fontFamily: 'Gilroy-Regular', fontSize: 13 },
    staleBanner: { backgroundColor: theme.riskElevatedTint, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: theme.riskElevated },
    staleBannerText: { color: theme.textPrimary, fontSize: 13, fontFamily: 'Gilroy-Regular' },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 20 },
    whySection: {},
    whyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    whyLabel: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5, color: theme.textPrimary, fontFamily: 'Gilroy-Black' },
    whyArrowBox: { width: 36, height: 36, borderWidth: 1, borderColor: theme.textPrimary, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    whyArrow: { fontSize: 16, color: theme.textPrimary, transform: [{ translateY: -1 }] },
    whyText: { marginTop: 8, color: theme.textSecondary, lineHeight: 20, fontFamily: 'Gilroy-Medium', fontSize: 13 },
    reportLink: { marginTop: 12, color: theme.textSecondary, fontSize: 13, fontFamily: 'Gilroy-SemiBold' },
    reportLinkBold: { fontWeight: '700', textDecorationLine: 'underline', color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    actionPlanCard: { backgroundColor: theme.mode === 'light' ? '#000000' : '#FFFFFF', borderRadius: 16, padding: 16, position: 'relative', zIndex: 2, elevation: 2 },
    actionPlanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionPlanTitle: { color: theme.mode === 'light' ? '#FFFFFF' : '#000000', fontWeight: '700', fontSize: 15, fontFamily: 'Gilroy-Bold' },
    actionPlanSubtitle: { color: theme.mode === 'light' ? '#FFFFFFCC' : '#000000CC', fontSize: 12, marginTop: 2, fontFamily: 'Gilroy-Regular' },
    actionPlanBody: { backgroundColor: theme.cardBackgroundAlt, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 16, paddingTop: 36, marginTop: -16, position: 'relative', zIndex: 1, elevation: 1 },
    actionPlanEmptyText: { color: theme.textSecondary, fontFamily: 'Gilroy-Regular' },
    actionPlanCreateLink: { fontWeight: '700', marginBottom: 4, color: theme.textPrimary, fontFamily: 'Gilroy-Bold' },
    actionPlanCreateSubtext: { color: theme.textMuted, fontSize: 13, fontFamily: 'Gilroy-Regular' },
    checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    checklistText: { fontSize: 12, color: theme.textPrimary, fontFamily: 'Gilroy-Bold', marginLeft: 12 },
    actionPlanWrap: { position: 'relative', paddingBottom: 20 },
    editButton: { position: 'absolute', top: 85, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 3, elevation: 4 },
    wifiIndicator: { position: 'absolute', bottom: 0, right: 16, width: 44, height: 44, borderRadius: 24, backgroundColor: theme.mode === 'light' ? '#000000' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, zIndex: 3, elevation: 4 },
    retryButton: { backgroundColor: theme.buttonPrimaryBg, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
    retryButtonText: { color: theme.buttonPrimaryText, fontWeight: '600', fontFamily: 'Gilroy-SemiBold' },
    
    // Layout Systems
    gaugeContainer: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    gaugeCenterLabels: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

    // Positioned per-segment via left/top computed from each segment's
    // angular midpoint along the arc (see iconPosition in the component).
    dynamicIconAnchor: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    dynamicIconChip: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  });
}