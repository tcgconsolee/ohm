import { createNavigationContainerRef } from '@react-navigation/native';

// Lets code outside the NavigationContainer's component tree navigate (e.g.
// the notification-response listener in App.tsx).
export const navigationRef = createNavigationContainerRef();

// Lets SettingsScreen trigger a return to onboarding without depending on
// `window` existing as a persistent global object on native (not guaranteed
// the way it is on web) or on a registered navigation route that doesn't
// exist - phase is app-root state, not something the navigator itself
// controls. Set by RootNavigator in App.tsx once it mounts.
export const revisitSetupRef: { current: (() => void) | null } = { current: null };
