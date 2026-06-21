import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { normalizeUser } from '../lib/normalizers';
import { supabase } from '../lib/supabase';
import type { AppUser } from '../types';

export function useAuthUser() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function syncProfile(user: User | null) {
      if (!user) {
        if (active) {
          setAuthUser(null);
          setProfile(null);
          setProfileError(null);
          setLoading(false);
        }
        return;
      }

      const alias = String(user.user_metadata.alias || user.user_metadata.display_name || user.email?.split('@')[0] || 'Learner');
      const { data, error } = await supabase
        .from('app_users')
        .upsert(
          { auth_user_id: user.id, username: alias, alias, display_name: alias },
          { onConflict: 'auth_user_id' },
        )
        .select('*')
        .single();

      if (active) {
        setAuthUser(user);
        setProfile(!error && data ? normalizeUser(data) : null);
        setProfileError(error?.message || null);
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data }) => syncProfile(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { authUser, profile, loading, profileError };
}
