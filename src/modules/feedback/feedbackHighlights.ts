export type FeedbackHighlight = { label: string; category: 'video' | 'website' };

/**
 * Derive concise tags only from explicit phrases in the original feedback.
 * No text is rewritten and no inferred/unsupported praise is generated.
 */
const rules: Array<{ label: string; category: FeedbackHighlight['category']; pattern: RegExp }> = [
  { label: 'Cinematic Editing', category: 'video', pattern: /\b(cinematic edit(?:ing)?|film[- ]like edit(?:ing)?)\b/i },
  { label: 'Editing Quality', category: 'video', pattern: /\b(editing quality|quality of (?:the )?edit(?:ing)?)\b/i },
  { label: 'Smooth Editing', category: 'video', pattern: /\b(smooth edit(?:ing)?|seamless edit(?:ing)?)\b/i },
  { label: 'Transitions', category: 'video', pattern: /\b(transitions?|smooth transition(?:s)?)\b/i },
  { label: 'Colour Grading', category: 'video', pattern: /\b(colou?r grading|colour tone|color tone)\b/i },
  { label: 'Storytelling', category: 'video', pattern: /\b(storytelling|story flow|story[- ]driven)\b/i },
  { label: 'Sound Design', category: 'video', pattern: /\b(sound design|audio mix(?:ing)?|sound effects?)\b/i },
  { label: 'Pacing', category: 'video', pattern: /\b(pacing|beat sync|beat[- ]matched)\b/i },
  { label: 'Motion Graphics', category: 'video', pattern: /\b(motion graphics?|animation)\b/i },
  { label: 'On-Time Delivery', category: 'video', pattern: /\b(on[- ]time delivery|delivered on time|timely delivery)\b/i },
  { label: 'Creative Direction', category: 'video', pattern: /\b(creative direction|creative approach|creative ideas?)\b/i },
  { label: 'Professional Service', category: 'video', pattern: /\b(professional service|professional work|highly professional)\b/i },
  { label: 'Easy Navigation', category: 'website', pattern: /\b(easy navigation|easy to navigate|navigation)\b/i },
  { label: 'Mobile Experience', category: 'website', pattern: /\b(mobile experience|mobile friendly|works on mobile|responsive)\b/i },
  { label: 'Premium Design', category: 'website', pattern: /\b(premium design|visual design|website design|looks? premium)\b/i },
  { label: 'Loading Speed', category: 'website', pattern: /\b(loading speed|loads? fast|fast loading|page speed)\b/i },
  { label: 'User Experience', category: 'website', pattern: /\b(user experience|easy to use|usability)\b/i },
  { label: 'Clear Layout', category: 'website', pattern: /\b(clear layout|clean layout|well[- ]organized layout)\b/i },
  { label: 'Responsive Design', category: 'website', pattern: /\b(responsive design|responsive website)\b/i },
  { label: 'Visual Appeal', category: 'website', pattern: /\b(visual appeal|visually appealing|attractive design)\b/i },
];

export function getFeedbackHighlights(message: string, kind: string): string[] {
  if (typeof message !== 'string' || !message.trim()) return [];
  const category: FeedbackHighlight['category'] =
    /website/i.test(kind) ? 'website' : /work feedback|video|editing/i.test(kind) ? 'video' : 'video';
  return rules
    .filter(rule => rule.category === category && rule.pattern.test(message))
    .map(rule => rule.label)
    .slice(0, 4);
}
