import { ACTION_LABELS, SEGMENT_LABELS } from '@/types/profile';
import type { VanProfile, NextBestActionType, SegmentKey } from '@/types/profile';

// ── Shared email helpers ────────────────────────────────────────────────────

const STRENGTH_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export interface EmailData {
  subject: string;
  greeting: string;
  body: string;
  ctaLabel: string;
}

export const ACTION_EMAIL_META: Record<
  NextBestActionType,
  { subject: (model: string, firstName: string) => string; cta: string }
> = {
  bookTestDrive: {
    subject: (model) => `Experience the ${model} — Your Personal Test Drive Awaits`,
    cta: 'Reserve My Test Drive',
  },
  completeConfiguration: {
    subject: (model) => `Your ${model} Configuration is One Step Away`,
    cta: 'Continue My Configuration',
  },
  completeOrder: {
    subject: (model, firstName) => `Finalise Your ${model} Order, ${firstName}`,
    cta: 'Complete My Order',
  },
  contactDealer: {
    subject: () => `A Personal Message from Your Volvo Advisor`,
    cta: 'Connect with My Advisor',
  },
  viewContent: {
    subject: (model) => `Curated for You — Stories & Insights on the ${model}`,
    cta: 'Discover My Content',
  },
};

export function getTopModel(profile: VanProfile): string {
  return [...profile.analyticalScores.affinities.models]
    .sort((a, b) => (STRENGTH_ORDER[a.strength] ?? 2) - (STRENGTH_ORDER[b.strength] ?? 2))[0]?.value ?? 'EX90';
}

export function buildAIPrompt(
  profile: VanProfile,
  action: { action: NextBestActionType; reasoning: string },
): string {
  const d = profile.profileData.demographics;
  const p = profile.profileData.psychographics;
  const m = profile.profileData.mobilityNeeds;
  const aff = profile.analyticalScores.affinities;
  const seg = profile.analyticalScores.segmentRanking;
  const prop = profile.analyticalScores.propensityToBuy;

  const personas = [
    p.familyLogistician && 'Family Logistician',
    p.styleConsciousCommuter && 'Style-Conscious Commuter',
    p.highMileCruiser && 'High-Mile Cruiser',
  ].filter(Boolean).join(', ') || 'none identified';

  const topModels = [...aff.models]
    .sort((x, y) => (STRENGTH_ORDER[x.strength] ?? 2) - (STRENGTH_ORDER[y.strength] ?? 2))
    .slice(0, 2)
    .map((item) => `${item.value} (${item.strength})`)
    .join(', ');

  const topPt = [...aff.powertrain]
    .sort((x, y) => (STRENGTH_ORDER[x.strength] ?? 2) - (STRENGTH_ORDER[y.strength] ?? 2))
    .map((item) => `${item.value} (${item.strength})`)
    .join(', ');

  const drivers = aff.personalDrivers
    .filter((item) => item.strength === 'high' || item.strength === 'medium')
    .map((item) => item.value)
    .join(', ');

  return `You are a premium Volvo Cars copywriter. Write exactly 2 short paragraphs for a personalised marketing email.

ACTION: ${ACTION_LABELS[action.action] ?? action.action}
REASONING: ${action.reasoning}

CUSTOMER PROFILE:
- Name: ${d.name ?? 'Customer'}
- City: ${d.city ?? 'unknown'}
- Affordability: ${d.affordability}
- Children: ${d.childrenCount ?? 'unknown'}
- Personas: ${personas}
- Interests: ${p.interests?.join(', ') ?? 'none'}
- Values: ${p.values?.join(', ') ?? 'none'}
- Daily driving: ${m.dailyUsage ?? 'unknown'}
- Weekend use: ${m.weekendUsage?.join(', ') ?? 'unknown'}
- Current car: ${m.currentCar ?? 'unknown'}
- Buying reason: ${m.reasonForBuying ?? 'unknown'}
- Top models: ${topModels}
- Powertrain preference: ${topPt}
- Key drivers: ${drivers || 'none'}
- Dominant segment: ${SEGMENT_LABELS[seg.dominantSegment]}
- Buying stage: ${prop.stage}
- Propensity score: ${prop.score}/100
- Engagement strategy: ${profile.recommendations.engagementStrategy}

RULES:
- Address the customer by first name only
- Naturally weave in their interests, values, and lifestyle
- Reference the specific Volvo model they prefer
- Tone: warm, premium, Scandinavian — never pushy or salesy
- Each paragraph: 2-3 sentences max
- Output ONLY the two paragraphs, no greeting, no sign-off, no subject line, no markdown`;
}

// ── Volvo HTML email template ───────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildVolvoEmailHtml(data: EmailData): string {
  const paragraphs = data.body
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:15px; line-height:26px; color:#333333;">${escapeHtml(p.trim())}</p>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <base target="_blank">
    <title>${escapeHtml(data.subject)}</title>
    <!--[if gte mso 9]>
    <style type="text/css">
        body, table td, span, a, p, h1, h2, li {
            font-family: Arial, Helvetica, sans-serif !important;
            mso-line-height-rule: exactly;
        }
    </style>
    <xml>
        <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        body {
            margin: 0;
            padding: 0;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }
        table {
            border-spacing: 0;
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
        }
        a {
            color: #141414;
            text-decoration: underline;
        }
        span.MsoHyperlink { mso-style-priority: 99; color: inherit; }
        span.MsoHyperlinkFollowed { mso-style-priority: 99; color: inherit; }
        :root {
            color-scheme: light only;
            supported-color-schemes: light only;
        }
        @media screen and (max-width: 640px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
            h1.hero-title { font-size: 20px !important; line-height: 28px !important; }
            .cta-btn { padding: 14px 28px !important; }
        }
        @media screen and (max-width: 480px) {
            u + #body #wrapper { min-width: 100vw; }
        }
    </style>
    <style>
        div[style*="margin: 16px 0;"] { margin: 0 !important; }
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4;" bgcolor="#f4f4f4" id="body">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" id="wrapper" style="background-color:#f4f4f4;">
        <tr>
            <td align="center" id="content" style="padding:0;">

                <!-- ====== EMAIL CONTAINER ====== -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width:600px; width:100%;">

                    <!-- Top spacer -->
                    <tr><td style="height:24px; font-size:0; line-height:0;" bgcolor="#f4f4f4">&nbsp;</td></tr>

                    <!-- ── HEADER ── -->
                    <tr>
                        <td style="background-color:#141414; padding:28px 40px;" class="mobile-padding" bgcolor="#141414">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:700; letter-spacing:5px; color:#ffffff; line-height:1;">
                                        VOLVO
                                    </td>
                                    <td align="right" valign="middle" style="font-family:Arial,Helvetica,sans-serif; font-size:9px; letter-spacing:2.5px; color:#ffffff; opacity:0.35; text-transform:uppercase; line-height:1;">
                                        For Life
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ── HERO / SUBJECT BANNER ── -->
                    <tr>
                        <td style="background-color:#1B365D; padding:36px 40px 40px;" class="mobile-padding" bgcolor="#1B365D">
                            <p style="margin:0 0 10px 0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#ffffff; opacity:0.5;">
                                Personalised for you
                            </p>
                            <h1 class="hero-title" style="margin:0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:24px; line-height:32px; font-weight:400; color:#ffffff;">
                                ${escapeHtml(data.subject)}
                            </h1>
                        </td>
                    </tr>

                    <!-- Accent line -->
                    <tr><td style="height:3px; font-size:0; line-height:0; background-color:#4A90A4;" bgcolor="#4A90A4">&nbsp;</td></tr>

                    <!-- ── BODY ── -->
                    <tr>
                        <td style="background-color:#ffffff; padding:36px 40px 20px;" class="mobile-padding" bgcolor="#ffffff">
                            <p style="margin:0 0 24px 0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:15px; line-height:26px; color:#141414; font-weight:600;">
                                ${escapeHtml(data.greeting)}
                            </p>
                            ${paragraphs}
                        </td>
                    </tr>

                    <!-- ── CTA ── -->
                    <tr>
                        <td style="background-color:#ffffff; padding:8px 40px 40px;" class="mobile-padding" bgcolor="#ffffff">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <!--[if mso]>
                                    <td style="background-color:#141414; padding:14px 36px;">
                                        <a href="#" style="font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.5px;">
                                            ${escapeHtml(data.ctaLabel)} &rarr;
                                        </a>
                                    </td>
                                    <![endif]-->
                                    <!--[if !mso]>-->
                                    <td class="cta-btn" style="background-color:#141414; padding:14px 36px; border-radius:2px;">
                                        <a href="#" style="font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.5px; white-space:nowrap;">
                                            ${escapeHtml(data.ctaLabel)} &rarr;
                                        </a>
                                    </td>
                                    <!--<![endif]-->
                                </tr>
                            </table>
                            <p style="margin:12px 0 0 0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:10px; color:#999999;">
                                Preview only &mdash; confirm in Catalyst before sending
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr><td style="height:1px; font-size:0; line-height:0; background-color:#e5e5e5;" bgcolor="#e5e5e5">&nbsp;</td></tr>

                    <!-- ── FOOTER ── -->
                    <tr>
                        <td style="background-color:#ffffff; padding:28px 40px;" class="mobile-padding" bgcolor="#ffffff">
                            <p style="margin:0 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; color:#141414; letter-spacing:3px; text-transform:uppercase; line-height:1;">
                                VOLVO
                            </p>
                            <p style="margin:0 0 12px 0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:11px; line-height:18px; color:#999999;">
                                Volvo Car Corporation &middot; Gothenburg, Sweden
                            </p>
                            <p style="margin:0; font-family:'Volvo Novum',Arial,Helvetica,sans-serif; font-size:10px; line-height:16px; color:#bbbbbb;">
                                This email was personalised by Volvo AI based on your profile and conversations.<br>
                                <a href="#" style="color:#999999; text-decoration:underline;">Manage preferences</a> &middot;
                                <a href="#" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Bottom spacer -->
                    <tr><td style="height:24px; font-size:0; line-height:0;" bgcolor="#f4f4f4">&nbsp;</td></tr>

                </table>
                <!-- ====== /EMAIL CONTAINER ====== -->

            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ── Campaign summary prompt ─────────────────────────────────────────────────

export function buildCampaignSummaryPrompt(
  segmentKey: SegmentKey,
  profileSummaries: { name: string; city: string; actionLabel: string; likelihood: number }[],
): string {
  const segmentName = SEGMENT_LABELS[segmentKey];
  const lines = profileSummaries
    .map((p) => `- ${p.name} (${p.city}): ${p.actionLabel} (${p.likelihood}%)`)
    .join('\n');

  const actionCounts = new Map<string, number>();
  for (const p of profileSummaries) {
    actionCounts.set(p.actionLabel, (actionCounts.get(p.actionLabel) ?? 0) + 1);
  }
  const themes = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${label} (${count})`)
    .join(', ');

  return `You are a Volvo Cars campaign strategist. Write a concise 3-4 sentence campaign summary for a group email reachout targeting the "${segmentName}" segment.

SEGMENT: ${segmentName}
PROFILES TARGETED (${profileSummaries.length}):
${lines}

ACTION THEMES: ${themes}

In your summary:
1. Describe the key characteristics of this segment
2. Highlight the dominant action themes across the group
3. Suggest an optimal send time or cadence
4. Provide one tactical insight for maximising engagement

RULES:
- Write exactly 3-4 sentences
- Tone: strategic, data-informed, premium brand voice
- Output ONLY the summary text, no headers or formatting`;
}
