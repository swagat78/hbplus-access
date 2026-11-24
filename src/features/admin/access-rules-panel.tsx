import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ConfirmButton } from '@/components/confirm-button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/features/auth/auth-provider';
import { useLayout } from '@/hooks/use-layout';
import { getEmailDomain, isValidDomain, normalizeDomain } from '@/lib/domain';
import { formatDate } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';
import type { DomainRow } from '@/types/database';

import { useDomains } from './use-domains';

const RULES: { icon: ComponentProps<typeof Feather>['name']; text: string }[] = [
  {
    icon: 'user-x',
    text: 'New Google accounts outside this list are refused before they exist: by the sign-up hook, and again by a trigger on the users table.',
  },
  {
    icon: 'database',
    text: 'Row-level security hides every row from a session whose email isn’t on the list, whatever the app does.',
  },
  {
    icon: 'smartphone',
    text: 'The app reads this list after sign-in and again whenever someone comes back to it.',
  },
  {
    icon: 'alert-triangle',
    text: 'Removing a domain cuts its members off immediately. Public providers such as gmail.com can’t be added from here.',
  },
];

export function AccessRulesPanel() {
  const { profile } = useAuth();
  const { contentWidth } = useLayout();
  const { domains, error, add, remove } = useDomains();
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ownDomain = getEmailDomain(profile?.email);
  const twoColumns = contentWidth >= 1040;

  const submit = async () => {
    const value = normalizeDomain(draft);
    if (!isValidDomain(value)) {
      setFormError("That doesn't look like a domain. Use something like hop.studio.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await add(value);
      setDraft('');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not add that domain.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (domain: string) => {
    setActionError(null);
    try {
      await remove(domain);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not remove that domain.');
    }
  };

  return (
    <View style={[styles.columns, twoColumns && styles.columnsRow]}>
      <View style={[styles.column, twoColumns && styles.main]}>
        <Card
          title="Allowed domains"
          caption="Google accounts on these domains can sign in. Everyone else sees the access-restricted message."
        >
          <View style={styles.form}>
            <TextField
              icon="at-sign"
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                if (formError) setFormError(null);
              }}
              onSubmitEditing={submit}
              placeholder="Add a domain, e.g. hop.studio"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              invalid={Boolean(formError)}
              accessibilityLabel="Domain to allow"
              style={styles.input}
            />
            <Button label="Add domain" tone="primary" onPress={submit} loading={saving} disabled={!draft.trim()} />
          </View>
          {formError ? (
            <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}

          {error ? <Notice message={error} /> : null}
          {actionError ? <Notice message={actionError} onDismiss={() => setActionError(null)} /> : null}

          {domains === null && !error ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.rust} />
            </View>
          ) : (
            <View>
              {(domains ?? []).map((row, index, all) => (
                <DomainItem
                  key={row.domain}
                  row={row}
                  isOwn={row.domain === ownDomain}
                  last={index === all.length - 1}
                  onRemove={() => handleRemove(row.domain)}
                />
              ))}
            </View>
          )}
        </Card>
      </View>

      <View style={[styles.column, twoColumns && styles.side]}>
        <Card title="How the rule is enforced" caption="Changes on the left apply everywhere, immediately.">
          <View style={styles.rules}>
            {RULES.map((rule) => (
              <View key={rule.icon} style={styles.rule}>
                <View style={styles.ruleIcon}>
                  <Feather name={rule.icon} size={15} color={colors.inkSoft} />
                </View>
                <AppText variant="small" style={styles.ruleText}>
                  {rule.text}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </View>
  );
}

function DomainItem({
  row,
  isOwn,
  last,
  onRemove,
}: {
  row: DomainRow;
  isOwn: boolean;
  last: boolean;
  onRemove: () => Promise<void>;
}) {
  const people = `${row.members} ${row.members === 1 ? 'member' : 'members'}`;

  return (
    <View style={[styles.domain, !last && styles.divider]}>
      <View style={styles.domainIcon}>
        <Feather name="globe" size={16} color={colors.rust} />
      </View>
      <View style={styles.domainText}>
        <View style={styles.domainNameRow}>
          <AppText style={styles.domainName}>@{row.domain}</AppText>
          {isOwn ? (
            <View style={styles.ownPill}>
              <AppText style={styles.ownText}>Your domain</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="small">
          Added {formatDate(row.created_at)} · {people}
          {isOwn ? '' : row.members > 0 ? ' would lose access if removed' : ''}
        </AppText>
      </View>
      {isOwn ? null : (
        <ConfirmButton
          label="Remove"
          confirmLabel="Confirm remove"
          accessibilityLabel={`Remove ${row.domain}`}
          onConfirm={onRemove}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    gap: space.xl,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: space.xl,
  },
  main: {
    flex: 1.5,
  },
  side: {
    flex: 1,
  },
  form: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  input: {
    flexGrow: 1,
    flexBasis: 220,
  },
  state: {
    paddingVertical: space.xl,
    alignItems: 'center',
  },
  domain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  domainIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.rustTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainText: {
    flex: 1,
    gap: 2,
  },
  domainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  domainName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  ownPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.successTint,
  },
  ownText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.success,
  },
  rules: {
    gap: space.lg,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    flex: 1,
    lineHeight: 19,
  },
});
