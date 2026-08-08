import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowRight from './ArrowRight';
import { colors, fonts } from '../theme/colors';

type PosTopBarProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
};

/** Light top bar matching customer-app TopBar */
export function PosTopBar({ title, onBack, right, dark }: PosTopBarProps) {
  const insets = useSafeAreaInsets();
  const bg = dark ? colors.navy : colors.surface;
  const fg = dark ? '#fff' : colors.ink;

  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <View
        style={[
          styles.bar,
          {
            backgroundColor: bg,
            borderBottomColor: dark ? 'transparent' : colors.line,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : colors.bg }]}
          >
            <ArrowRight height={22} color={fg} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        <Text style={[styles.title, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightSlot}>{right}</View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  title: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  rightSlot: {
    minWidth: 34,
    alignItems: 'flex-start',
  },
});
