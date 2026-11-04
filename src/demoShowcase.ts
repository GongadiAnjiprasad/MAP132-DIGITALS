export type DemoShowcaseItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  sourceUrl: string;
  style: string;
};

// Licensed stock-photo moodboards used only as clearly labelled visual placeholders.
// Replace these with original edited videos/photos from the Admin Dashboard.
export const DEMO_SHOWCASE: DemoShowcaseItem[] = [
  { id: 'cinematic', category: 'Cinematic Films', title: 'The Final Frame', description: 'A cinematic mood study for trailers, teasers and dramatic storytelling.', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/cinematic-night-sky', style: 'DRAMA · COLOUR · SOUND' },
  { id: 'wedding', category: 'Wedding & Events', title: 'Forever in Frame', description: 'An elegant visual direction for wedding highlights and event films.', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/wedding-celebration', style: 'EMOTION · LIGHT · STORY' },
  { id: 'birthday', category: 'Birthday Films', title: 'A Day to Remember', description: 'A bright celebration-film concept for birthdays and special moments.', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/birthday-celebration', style: 'CELEBRATION · MOMENTS · JOY' },
  { id: 'reels', category: 'Reels & Shorts', title: 'Make It Move', description: 'A punchy short-form direction for vertical social videos and quick hooks.', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/video-camera', style: 'PACE · ENERGY · IMPACT' },
  { id: 'youtube', category: 'YouTube Videos', title: 'Beyond the Cut', description: 'A creator-focused visual concept for intros, storytelling and channel edits.', image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/filmmaking-camera', style: 'CREATOR · STORY · FLOW' },
  { id: 'brand', category: 'Brand Promotions', title: 'Built to Be Seen', description: 'A polished commercial moodboard for product showcases and brand campaigns.', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/creative-business', style: 'BRAND · PRODUCT · MESSAGE' },
  { id: 'ai', category: 'AI Video Creation', title: 'Future in Motion', description: 'A futuristic visual direction for AI-assisted scenes and experimental edits.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/artificial-intelligence', style: 'GENERATIVE · FUTURE · VISUALS' },
  { id: 'other', category: 'Other Projects', title: 'Behind the Edit', description: 'A workspace-inspired concept for creative experiments and editing breakdowns.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1100&q=85', sourceUrl: 'https://unsplash.com/s/photos/video-editing-workspace', style: 'PROCESS · CRAFT · DETAIL' }
];
