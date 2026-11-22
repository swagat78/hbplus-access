import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';

export default function Index() {
  const { status } = useAuth();
  return <Redirect href={status === 'signed-in' ? '/dashboard' : '/login'} />;
}
