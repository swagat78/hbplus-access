import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { colors, fonts, radius, space } from '@/theme';

type Resource = {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  url: string;
};

const RESOURCES: Resource[] = [
  { icon: 'globe', title: 'hbplus.fit', subtitle: 'Main website', url: 'https://hbplus.fit' },
  {
    icon: 'clipboard',
    title: 'Free Lifestyle Test',
    subtitle: 'What new clients fill in first',
    url: 'https://onboarding.hbplus.fit',
  },
  {
    icon: 'instagram',
    title: '@hopwith_hb',
    subtitle: 'Instagram community',
    url: 'https://www.instagram.com/hopwith_hb/',
  },
];

export function ResourcesCard() {
  return (
    <Card title="Quick links" caption="The public side of HB+.">
      <View style={styles.list}>
        {RESOURCES.map((resource) => (
          <ResourceRow key={resource.url} resource={resource} />
        ))}
      </View>
    </Card>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => Linking.openURL(resource.url)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="link"
      accessibilityLabel={`${resource.title}, opens in a new tab`}
      style={({ pressed }) => [styles.row, (hovered || pressed) && styles.rowActive]}
    >
      <View style={styles.icon}>
        <Feather name={resource.icon} size={16} color={colors.inkSoft} />
      </View>
      <View style={styles.text}>
        <AppText style={styles.title}>{resource.title}</AppText>
        <AppText variant="small">{resource.subtitle}</AppText>
      </View>
      <Feather name="arrow-up-right" size={16} color={hovered ? colors.rust : colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.xs,
    marginHorizontal: -space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderRadius: radius.md,
  },
  rowActive: {
    backgroundColor: colors.cream,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
});
