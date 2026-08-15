import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import OhmLogo from '../../components/OhmLogo';

interface Props {
  onExit: () => void;
  onGoBack: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'Is my data safe?',
    a: 'Yes, your data completely stays on your device.',
  },
  {
    q: "What if I don't want alerts anymore?",
    a: 'No worries, you can turn them off anytime.',
  },
  {
    q: "Will this replace TANGEDCO's own alerts?",
    a: "No, Ohm works alongside TANGEDCO's alerts, adding advance warning they don't currently offer.",
  },
];

export default function UnsureStep({ onExit, onGoBack }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Centered Brand Vector Logo Badge */}
      <OhmLogo size={20} style={styles.logo} />
      
      <Text style={[styles.title, { color: theme.textPrimary }]}>Unsure about the app?</Text>

      {/* Main FAQ Informational Card Container */}
      <View style={styles.faqCard}>
        {FAQ_ITEMS.map((item, i) => (
          <View key={i} style={styles.faqItem}>
            <Text style={styles.faqQ}>Q. {item.q}</Text>
            <Text style={styles.faqA}>A. {item.a}</Text>
          </View>
        ))}
      </View>

      {/* Dynamic Theme Capsule Block Element */}
      <View style={styles.stillUnsureCapsule}>
        <Text style={styles.stillUnsureText}>Still unsure?</Text>
      </View>
      
      <Text style={[styles.stillUnsureBody, { color: theme.textSecondary }]}>
        No worries, take your time. You can come back and set up Ohm whenever you're ready.
      </Text>

      {/* Dynamic Action Exit Target Button Frame */}
      <Pressable style={styles.exitButton} onPress={onExit}>
        <Text style={styles.exitButtonText}>Exit</Text>
      </Pressable>

      {/* Redesigned Progress Axis Navigation Layer */}
      <View style={styles.progressRow}>
        <Pressable onPress={onGoBack}>
          <Text style={[styles.progressArrowActive, { color: theme.textPrimary }]}>←</Text>
        </Pressable>
        <View style={styles.progressLine} />
        <Pressable onPress={onGoBack}>
          <Text style={[styles.goBackTextLabel, { color: theme.textPrimary }]}>Go back</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
import { OhmTheme } from '../../theme/theme';

function makeStyles(theme: OhmTheme) {
  const isLight = theme.mode === 'light';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
    logo: { alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center', fontFamily: 'Gilroy-Black' },
    
    // Card swaps background color values and inner text ink colors dynamically per active theme mode
    faqCard: { 
      width: '100%', 
      borderRadius: 28, 
      padding: 24, 
      marginBottom: 24, 
      backgroundColor: isLight ? '#383839' : '#BCBDC1' 
    },
    faqItem: { marginBottom: 16 },
    faqQ: { 
      color: isLight ? '#FFFFFF' : '#000000', 
      fontWeight: '700', 
      fontSize: 14, 
      marginBottom: 4, 
      fontFamily: 'Gilroy-Bold' 
    },
    faqA: { 
      color: isLight ? '#FFFFFFCC' : '#000000CC', 
      fontSize: 12, 
      lineHeight: 18, 
      fontFamily: 'Gilroy-Regular' 
    },
    
    // Capsule block shifts from light gray to dark gray seamlessly
    stillUnsureCapsule: { 
      width: '100%', 
      borderRadius: 14, 
      paddingVertical: 14, 
      marginBottom: 16, 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: isLight ? '#BCBDC1' : '#383839'
    },
    stillUnsureText: { 
      fontWeight: '900', 
      fontSize: 14, 
      color: isLight ? '#000000' : '#FFFFFF', 
      fontFamily: 'Gilroy-Black' 
    },
    stillUnsureBody: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 28, paddingHorizontal: 12, fontFamily: 'Gilroy-Regular' },
    
    // Exit button converts from a solid solid white card to a black transparent block with white lines
    exitButton: { 
      borderWidth: 1, 
      borderColor: isLight ? '#000000' : '#FFFFFF', 
      borderRadius: 12, 
      paddingVertical: 14, 
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? '#FFFFFF' : '#000000',
      marginBottom: 36
    },
    exitButtonText: { 
      fontWeight: '700', 
      fontSize: 13, 
      fontFamily: 'Gilroy-Bold', 
      color: isLight ? '#000000' : '#FFFFFF' 
    },
    
    progressRow: { 
      flexDirection: 'row', 
      width: '100%', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginTop: 'auto', 
      paddingBottom: 10 
    },
    progressLine: { 
      flex: 1, 
      height: 1, 
      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)', 
      marginHorizontal: 16 
    },
    progressArrowActive: { fontSize: 18, fontFamily: 'Gilroy-Bold' },
    goBackTextLabel: { fontSize: 13, fontWeight: '700', fontFamily: 'Gilroy-Bold', textAlign: 'right' },
  });
}
