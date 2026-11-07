// ============================================================================
//  Edit these values, then commit. Nothing here is secret.
// ============================================================================
window.GATE_CONFIG = {
  // Web app URL from Apps Script: Deploy → New deployment → Web app → copy the URL ending in /exec
  scriptUrl: "https://script.google.com/macros/s/AKfycbw9J-8fotTzU73baxJRfdHodqtfmLgx4J4yiovhHwqG52YKSEpmSdSxQFFv1lHAg2TW/exec",

  title: "RejectBench Survey",
  subtitle: "Understanding AI-assisted peer review in the research community",
  intro:
    "This survey is open to researchers and students at universities and research institutes worldwide. " +
    "Please enter your institutional email first; you will then be taken to the questionnaire.",
  organizer: "Your Lab, Your University",
  contactEmail: "contact@your-domain.org",

  // Shown beside the form. Keep it consistent with your consent text and ethics approval.
  privacy: [
    "We use your institutional email to check that you are at a research institution and to count one response per person.",
    "The research team records your email address and institution. Your Qualtrics answers carry a code that links them to this record, which is used to remove duplicate responses.",
  ],

  // Optional Cloudflare Turnstile bot check. Leave empty unless you also set CONFIG.TURNSTILE_SECRET in Code.gs.
  turnstileSiteKey: "",
};
