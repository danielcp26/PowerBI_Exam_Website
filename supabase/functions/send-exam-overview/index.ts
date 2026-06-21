import { Resend } from 'npm:resend@4.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Breakdown = { label: string; correct: number; total: number; percentage: number };
type MissedQuestion = { prompt: string; domain: string; skill: string; explanation?: string | null; studySources: string[] };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header.');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) throw new Error('Unable to identify the signed-in user.');

    const payload = await request.json() as {
      alias: string; score: number; total: number; percentage: number; passed: boolean;
      domainBreakdown: Breakdown[]; missedQuestions: MissedQuestion[];
    };
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const from = Deno.env.get('OVERVIEW_FROM_EMAIL') || 'PL-300 Practice Arena <onboarding@resend.dev>';
    const domainRows = payload.domainBreakdown.map((item) => `<li><strong>${escapeHtml(item.label)}</strong>: ${item.correct}/${item.total} (${item.percentage}%)</li>`).join('');
    const missedRows = payload.missedQuestions.length
      ? payload.missedQuestions.map((item) => {
          const sources = item.studySources.length
            ? `<p>Study: ${item.studySources.map((url) => `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`).join(' · ')}</p>`
            : '<p>Study: Review the relevant Microsoft Learn module for this skill.</p>';
          return `<li><strong>${escapeHtml(item.domain)} · ${escapeHtml(item.skill)}</strong><br/>${escapeHtml(item.prompt)}<br/>${escapeHtml(item.explanation || 'Review this concept and retry a similar question.')} ${sources}</li>`;
        }).join('')
      : '<li>Perfect score. Keep the momentum going.</li>';

    const { error: mailError } = await resend.emails.send({
      from,
      to: [user.email],
      subject: `PL-300 overview: ${payload.percentage}%`,
      html: `<h1>Nice work, ${escapeHtml(payload.alias)}</h1><p>You scored <strong>${payload.score}/${payload.total} (${payload.percentage}%)</strong> and ${payload.passed ? 'met' : 'did not yet meet'} the 70% target.</p><h2>Key trends by domain</h2><ul>${domainRows}</ul><h2>Missed questions and study sources</h2><ol>${missedRows}</ol>`,
    });
    if (mailError) throw mailError;

    return Response.json({ sent: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to send email.' }, { status: 400, headers: corsHeaders });
  }
});
