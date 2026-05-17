export type EmailMessage = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};

export type EmailSendResult = {
    ok: boolean;
    provider?: string;
    id?: string;
    error?: string;
};

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!resendApiKey || !from) {
        return {
            ok: false,
            provider: 'resend',
            error: 'RESEND_API_KEY and EMAIL_FROM are required for email digest delivery',
        };
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
        }),
    });

    const body = await response.json().catch(() => null) as { id?: string; message?: string } | null;
    if (!response.ok) {
        return {
            ok: false,
            provider: 'resend',
            error: body?.message ?? `Resend API failed with ${response.status}`,
        };
    }

    return { ok: true, provider: 'resend', id: body?.id };
}
