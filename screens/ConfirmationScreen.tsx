import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { confirmationLog } from '../hooks/useOhmPipeline';
import { ConfirmedWindow } from '../core/confirmationLog';
import { useTheme } from '../theme/ThemeProvider';
import { OhmTheme } from '../theme/theme';
import OhmLogo from '../components/OhmLogo';
import Icon from '../components/Icon';

// How far back to look for windows still waiting on a confirmation.
const LOOKBACK_HOURS = 7 * 24;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const period = h >= 12 ? 'P.M.' : 'A.M.';
  h = h % 12;
  if (h === 0) h = 12;
  const minutes = d.getMinutes();
  const minutesPart = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${h}${minutesPart} ${period}`;
}

export default function ConfirmationScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const styles = makeStyles(theme);
  const isLight = theme.mode === 'light';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [windows, setWindows] = useState<ConfirmedWindow[]>([]);
  const [answers, setAnswers] = useState<Record<string, 'outage' | 'no_outage'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    confirmationLog
      .getUnconfirmedWithin(LOOKBACK_HOURS)
      .then((w) => {
        // Most recent window first, matching the mock.
        const sorted = [...w].sort((a, b) => new Date(b.windowStart).getTime() - new Date(a.windowStart).getTime());
        setWindows(sorted);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Could not load your pending confirmations.');
      })
      .finally(() => setLoading(false));
  }, []);

  const upperBgColor = isLight ? '#A2A3AA' : '#2C2C2D';
  const lowerBgColor = isLight ? '#BCBDC1' : '#383839';
  const dividerColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.7)';

  const allAnswered = windows.length > 0 && windows.every((w) => answers[w.id] !== undefined);

  const handleSelect = (id: string, outcome: 'outage' | 'no_outage') => {
    setAnswers((prev) => ({ ...prev, [id]: outcome }));
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await Promise.all(
        windows.map((w) => confirmationLog.confirmOutcome(w.id, answers[w.id], 'post_window_prompt'))
      );
      navigation.goBack();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong saving your answers - please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <OhmLogo size={18} style={styles.logo} />

      <View style={styles.headerCard}>
        <View style={[styles.cardUpperBlock, { backgroundColor: upperBgColor }]}>
          <View style={styles.iconWrapper}>
            <Icon name="confirmation" size={16} color={theme.textPrimary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Confirmation</Text>
        </View>

        <View style={[styles.dividerWrapperContainer, { backgroundColor: lowerBgColor }]}>
          <View style={[styles.card70PercentDivider, { backgroundColor: dividerColor }]} />
        </View>

        <View style={[styles.cardLowerBlock, { backgroundColor: lowerBgColor }]}>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Did your power go out recently?
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.textPrimary} style={{ marginTop: 20 }} />
      ) : loadError ? (
        <Text style={[styles.emptyText, { color: theme.riskHigh }]}>{loadError}</Text>
      ) : windows.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Nothing waiting on a confirmation right now.
        </Text>
      ) : (
        <View style={styles.formContainer}>
          {windows.map((w) => {
            const selected = answers[w.id];
            return (
              <View key={w.id} style={styles.windowBlock}>
                <View style={styles.windowLabelRow}>
                  <Text style={[styles.arrow, { color: theme.textPrimary }]}>{'\u2192'}</Text>
                  <Text style={[styles.windowLabel, { color: theme.textPrimary }]}>
                    <Text style={styles.windowDate}>{formatDate(w.windowStart)},</Text> {formatTime(w.windowStart)} to{' '}
                    {formatTime(w.windowEnd)}
                  </Text>
                </View>

                <View style={styles.choiceRow}>
                  <Pressable
                    style={[
                      styles.choiceButton,
                      styles.choiceButtonSpacing,
                      {
                        backgroundColor: selected === 'outage' ? theme.chipActiveBg : theme.chipInactiveBg,
                        borderColor: theme.chipBorder,
                      },
                    ]}
                    onPress={() => handleSelect(w.id, 'outage')}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        { color: selected === 'outage' ? theme.chipActiveText : theme.chipInactiveText },
                      ]}
                    >
                      Yes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: selected === 'no_outage' ? theme.chipActiveBg : theme.chipInactiveBg,
                        borderColor: theme.chipBorder,
                      },
                    ]}
                    onPress={() => handleSelect(w.id, 'no_outage')}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        { color: selected === 'no_outage' ? theme.chipActiveText : theme.chipInactiveText },
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {windows.length > 0 && (
        <>
          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.buttonPrimaryBg }, !allAnswered && styles.submitButtonDisabled]}
            disabled={!allAnswered || submitting}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>
              {submitting ? 'Saving...' : 'Submit'}
            </Text>
          </Pressable>
          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            Please answer all of the questions to proceed
          </Text>
          {submitError && <Text style={[styles.errorText, { color: theme.riskHigh }]}>{submitError}</Text>}
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(theme: OhmTheme) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 30, paddingBottom: 40, alignItems: 'center', flexGrow: 1 },
    logo: { alignSelf: 'center', marginBottom: 20 },

    headerCard: { borderRadius: 24, padding: 0, marginBottom: 28, width: '100%', overflow: 'hidden' },
    cardUpperBlock: { width: '100%', paddingTop: 20, paddingBottom: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    iconWrapper: { marginRight: 6, justifyContent: 'center', alignItems: 'center' },

    dividerWrapperContainer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
    card70PercentDivider: { width: '70%', height: 1 },

    cardLowerBlock: { width: '100%', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, alignItems: 'center' },
    headerTitle: { fontSize: 16, textAlign: 'center', fontFamily: 'Gilroy-Black', fontWeight: '900' },
    headerSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, fontFamily: 'Gilroy-Bold', fontWeight: '700' },

    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20, fontFamily: 'Gilroy-Regular' },

    formContainer: { width: '100%' },
    windowBlock: { marginBottom: 26 },
    windowLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    arrow: { fontSize: 14, marginRight: 8, fontFamily: 'Gilroy-Regular' },
    windowLabel: { fontSize: 13, fontFamily: 'Gilroy-Regular', flexShrink: 1 },
    windowDate: { fontFamily: 'Gilroy-Bold', fontWeight: '700' },

    choiceRow: { flexDirection: 'row' },
    choiceButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    choiceButtonSpacing: { marginRight: 12 },
    choiceButtonText: { fontSize: 13, fontFamily: 'Gilroy-Bold', fontWeight: '700' },

    submitButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 },
    submitButtonDisabled: { opacity: 0.4 },
    submitButtonText: { fontWeight: '700', fontSize: 13, fontFamily: 'Gilroy-Bold' },

    footer: { textAlign: 'center', fontSize: 12, lineHeight: 16, marginTop: 16, fontFamily: 'Gilroy-Regular' },
    errorText: { textAlign: 'center', fontSize: 12, lineHeight: 16, marginTop: 8, fontFamily: 'Gilroy-Regular' },
  });
}
