export type Pillar = 'Body' | 'Mind' | 'Gut';

export type Pathway = {
  name: string;
  pillars: Pillar[];
  blurb: string;
};

// Mirrors the "Our Pathways" section on hbplus.fit.
export const PATHWAYS: Pathway[] = [
  {
    name: 'Pain Management',
    pillars: ['Body'],
    blurb: 'Physio-led plans for chronic aches and recurring pain.',
  },
  {
    name: 'Weight Management',
    pillars: ['Body', 'Gut'],
    blurb: 'Training and nutrition built around a real routine.',
  },
  {
    name: 'Pre & Post Natal',
    pillars: ['Body', 'Mind', 'Gut'],
    blurb: 'Safe, guided support before and after birth.',
  },
  {
    name: 'Lifestyle Management',
    pillars: ['Body', 'Mind', 'Gut'],
    blurb: 'Sustainable habits that fit a busy, real-life routine.',
  },
  {
    name: 'Deep Healing',
    pillars: ['Mind'],
    blurb: 'Mental wellness work alongside physical care.',
  },
  {
    name: 'Injury Management',
    pillars: ['Body'],
    blurb: 'Rehab from first assessment back to full movement.',
  },
  {
    name: 'Sports Ready',
    pillars: ['Body'],
    blurb: 'Strength and conditioning for performance goals.',
  },
];
