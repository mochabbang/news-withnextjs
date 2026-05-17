import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type NewsletterSubscription = {
    id: string;
    user_id: string | null;
    email: string;
    channel: 'email' | 'telegram' | 'kakao';
    destination: string | null;
    country: string;
    category: string;
    active: boolean;
    consented_at: string | null;
    email_verified_at: string | null;
    unsubscribed_at: string | null;
    unsubscribe_token: string;
    created_at: string;
    updated_at: string;
};

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function upsertPendingEmailSubscription({
    email,
    country = 'kr',
    category = 'all',
}: {
    email: string;
    country?: string;
    category?: string;
}): Promise<NewsletterSubscription> {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) throw new Error('Invalid email address');

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .upsert(
            {
                email: normalizedEmail,
                channel: 'email',
                destination: normalizedEmail,
                country,
                category,
                active: false,
                consented_at: new Date().toISOString(),
                unsubscribed_at: null,
            },
            { onConflict: 'email,channel' },
        )
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return data as NewsletterSubscription;
}

export async function activateEmailSubscription({
    email,
    userId,
}: {
    email: string;
    userId: string;
}): Promise<NewsletterSubscription> {
    const normalizedEmail = normalizeEmail(email);
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .update({
            user_id: userId,
            active: true,
            email_verified_at: now,
            unsubscribed_at: null,
        })
        .eq('email', normalizedEmail)
        .eq('channel', 'email')
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return data as NewsletterSubscription;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .update({ active: false, unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', token)
        .select('id')
        .maybeSingle();

    if (error) throw new Error(error.message);
    return Boolean(data);
}
