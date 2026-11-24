import { useEffect, useState } from 'react';

import { Button } from './button';

type Props = {
  label: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Two-step button for destructive actions: the first press arms it, the
// second (within a few seconds) runs it. Used instead of a browser confirm()
// dialog, which React Native Web can't style and Alert can't show on web.
export function ConfirmButton({
  label,
  confirmLabel = 'Confirm',
  onConfirm,
  disabled,
  accessibilityLabel,
}: Props) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handlePress = async () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const name = accessibilityLabel ?? label;

  return (
    <Button
      size="sm"
      tone={armed ? 'danger' : 'secondary'}
      label={armed ? confirmLabel : label}
      accessibilityLabel={armed ? `${confirmLabel}: ${name}` : name}
      onPress={handlePress}
      loading={busy}
      disabled={disabled}
    />
  );
}
