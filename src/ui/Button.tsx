import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
};

// primary — белая плашка, ghost — только контур. Третьего варианта не нужно.
export function Button({ label, onPress, variant = 'primary', disabled, busy }: Props) {
  const primary = variant === 'primary';
  const off = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.base,
        primary ? s.primary : s.ghost,
        pressed && !off && s.pressed,
        off && s.off,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? color.bg : color.text} />
      ) : (
        <Text style={[s.label, primary ? s.labelPrimary : s.labelGhost]}>{label}</Text>
      )}
    </Pressable>
  );
}

// Круглая кнопка для «+» и прочих одиночных действий в сцене.
export function IconButton({
  glyph,
  onPress,
  active,
}: {
  glyph: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.icon, active && s.iconActive, pressed && s.pressed]}>
      <View>
        <Text style={[s.iconGlyph, active && s.iconGlyphActive]}>{glyph}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: { backgroundColor: color.text },
  ghost: { borderWidth: 1, borderColor: color.line },
  pressed: { opacity: 0.6 },
  off: { opacity: 0.35 },
  label: { ...type.label, fontSize: 15 },
  labelPrimary: { color: color.bg },
  labelGhost: { color: color.text },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceHigh,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: color.text, borderColor: color.text },
  iconGlyph: { color: color.text, fontSize: 22, lineHeight: 26 },
  iconGlyphActive: { color: color.bg },
});
