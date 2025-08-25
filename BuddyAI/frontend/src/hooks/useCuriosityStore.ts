import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type CuriosityTab = 'my-chapter' | 'for-you' | 'learn-ai' | 'robotics' | 'space';

export interface Item {
  id: string;
  title: string;
  subtitle?: string;
  badges?: string[];
  description: string;
  imageUrl?: string;
  ctaUrl?: string;
}

export interface DiscoverItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  url: string;
}

export const useCuriosityStore = () => {
  const [subjectId, setSubjectId] = useState<string>('Physics');
  const [chapterId, setChapterId] = useState<string>('Solar System');
  const [activeTab, setActiveTab] = useState<CuriosityTab>('my-chapter');
  const [interests, setInterests] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('curiosity.interests');
      return raw ? JSON.parse(raw) : ['Science'];
    } catch {
      return ['Science'];
    }
  });
  const [curated, setCurated] = useState<{
    myChapter: Item[];
    forYou: Item[];
    learnAI: Item[];
    robotics: Item[];
    space: Item[];
  }>({ myChapter: [], forYou: [], learnAI: [], robotics: [], space: [] });
  const [discoverFeed, setDiscoverFeed] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Persist interests
  useEffect(() => {
    try { localStorage.setItem('curiosity.interests', JSON.stringify(interests)); } catch {}
  }, [interests]);

  // Seed content for MVP
  useEffect(() => {
    // My Chapter seeded by chapterId with exact descriptions and logos
    const base: Item[] = [
      {
        id: 'stellarium',
        title: 'Stellarium',
        description:
          'A virtual planetarium app for sky mapping, helping users observe and learn about stars and planets. It provides an interactive experience for exploring celestial objects.',
        imageUrl: '/media/curiosity centre/stellarium.png',
      },
      {
        id: 'celestia',
        title: 'Celestia',
        description:
          'A 3D space simulator focused on space travel and exploring realistic planets beyond the Solar System. It allows users to experience the universe in a visually immersive way.',
        imageUrl: '/media/curiosity centre/celestia.png',
      },
      {
        id: 'universe-sandbox',
        title: 'Universe Sandbox',
        description:
          'A real-time physics simulation tool that models planetary movements, gravity, and collisions, helping users understand space physics dynamically.',
        imageUrl: '/media/curiosity centre/universe sandbox.jpeg',
      },
      {
        id: 'phet',
        title: 'PhET Simulations',
        description:
          'An interactive platform for simulating physics and chemistry experiments, offering virtual labs and real-world science examples in an engaging format.',
        imageUrl: '/media/curiosity centre/phet.png',
      },
    ];
    const learn: Item[] = [
      { id: 'teachable', title: 'Google Teachable Machine', description: 'Image recognition, Sound detection' },
      { id: 'quickdraw', title: 'Quick, Draw!', description: 'AI sketching, Pattern recognition' },
      { id: 'deepdream', title: 'Deep Dream Generator', description: 'AI art, Style transfer' },
      { id: 'runway', title: 'Runway ML', description: 'AI video editing and generation' },
    ];
    const robo: Item[] = [
      { id: 'lego', title: 'LEGO Mindstorms', description: 'Beginner robotics kits' },
      { id: 'ros', title: 'ROS Tutorials', description: 'Robot Operating System basics' },
    ];
    const space: Item[] = [
      { id: 'jwst', title: 'JWST Discoveries', description: 'Deep space observations' },
      { id: 'iss', title: 'ISS Experiments', description: 'Microgravity research' },
    ];

    const filteredForYou = base.filter(i => {
      const text = `${i.title} ${i.description}`.toLowerCase();
      return interests.some(tag => text.includes(tag.toLowerCase()) || tag === 'Science');
    });

    setCurated({ myChapter: base, forYou: filteredForYou, learnAI: learn, robotics: robo, space });
  }, [chapterId, interests]);

  const saveInterests = useCallback((next: string[]) => setInterests(next), []);

  return {
    subjectId, setSubjectId,
    chapterId, setChapterId,
    activeTab, setActiveTab,
    interests, saveInterests,
    curated, setCurated,
    discoverFeed, setDiscoverFeed,
    loading, setLoading,
  };
};
