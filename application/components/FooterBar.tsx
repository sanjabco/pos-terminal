import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/colors';

type FooterButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Relative width in a multi-button row (default 1) */
  flex?: number;
  style?: ViewStyle;
};

export function FooterButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  flex = 1,
  style,
}: FooterButtonProps) {
  const isDisabled = disabled || loading;
  const showAsDisabled = Boolean(disabled) && !loading;
  const spinnerColor =
    variant === 'primary' && !showAsDisabled ? '#fff' : colors.orangeDeep;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
      style={[
        styles.btn,
        { flex },
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        showAsDisabled &&
        (variant === 'primary' ? styles.btnPrimaryDisabled : styles.btnMutedDisabled),
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={spinnerColor} size="small" />
          <Text
            style={[
              styles.btnText,
              variant === 'secondary' && styles.btnTextSecondary,
              variant === 'ghost' && styles.btnTextGhost,
            ]}
          >
            {label}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'secondary' && styles.btnTextSecondary,
            variant === 'ghost' && styles.btnTextGhost,
            showAsDisabled && styles.btnTextDisabled,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

type FooterBarProps = {
  children: React.ReactNode;
  top?: React.ReactNode;
};

/** Sticky bottom bar with safe-area padding — customer-app style */
export function FooterBar({ children, top }: FooterBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {top ? <View style={styles.topSlot}>{top}</View> : null}
      <View style={styles.row}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: '#15171C',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  topSlot: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    gap: 10,
  },
  btn: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnPrimary: {
    backgroundColor: colors.orange,
    shadowColor: colors.orangeDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSecondary: {
    backgroundColor: colors.orangeTint,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  btnGhost: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnPrimaryDisabled: {
    backgroundColor: '#D8D9DE',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnMutedDisabled: {
    opacity: 0.55,
  },
  loadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  btnTextSecondary: {
    color: colors.orangeDeep,
  },
  btnTextGhost: {
    color: colors.inkSoft,
  },
  btnTextDisabled: {
    color: '#9A9DA6',
  },
});
