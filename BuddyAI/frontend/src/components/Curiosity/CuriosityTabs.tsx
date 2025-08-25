import React, { useEffect, useState } from 'react';
import { useCuriosityStore } from '../../hooks/useCuriosityStore';
import { useCuriosityI18n } from '../../hooks/useCuriosityI18n';

const Card: React.FC<{ title: string; subtitle?: string; description: string; imageUrl?: string }>
  = ({ title, subtitle, description, imageUrl }) => {
  const { pageLang, translateText } = useCuriosityI18n();
  const [tTitle, setTTitle] = useState(title);
  const [tSubtitle, setTSubtitle] = useState(subtitle || '');
  const [tDesc, setTDesc] = useState(description);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const newTitle = pageLang === 'en' ? title : await translateText(title, 'ar', 'en');
      const newSubtitle = subtitle ? (pageLang === 'en' ? subtitle : await translateText(subtitle, 'ar', 'en')) : '';
      const newDesc = pageLang === 'en' ? description : await translateText(description, 'ar', 'en');
      if (mounted) { setTTitle(newTitle); setTSubtitle(newSubtitle); setTDesc(newDesc); }
    })();
    return () => { mounted = false; };
  }, [pageLang, title, description, translateText]);
  return (
    <div className="border rounded-xl p-5 shadow-sm bg-white">
      <div className={`flex items-start gap-4 ${pageLang==='ar' ? 'flex-row-reverse' : ''}`}>
        {imageUrl && (
          <img
            src={encodeURI(imageUrl)}
            alt=""
            className="w-12 h-12 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/media/thumbnail1.png'; }}
          />
        )}
        <div className="flex-1">
          <div className="font-semibold mb-0.5">{tTitle}</div>
          {tSubtitle && <div className="text-xs text-gray-500 mb-1 truncate">{tSubtitle}</div>}
          <div className="text-sm text-gray-600 line-clamp-3">{tDesc}</div>
        </div>
      </div>
    </div>
  );
};

export const MyChapterView: React.FC = () => {
  const { curated } = useCuriosityStore();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {curated.myChapter.map(i => (
        <Card key={i.id} title={i.title} description={i.description} imageUrl={i.imageUrl} />
      ))}
    </div>
  );
};

export const ForYouView: React.FC = () => {
  const { curated } = useCuriosityStore();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {curated.forYou.map(i => (
        <Card key={i.id} title={i.title} description={i.description} imageUrl={i.imageUrl} />
      ))}
    </div>
  );
};

export const LearnAIView: React.FC = () => {
  const items = [
    {
      id: 'teachable',
      title: 'Google Teachable Machine',
      subtitle: 'Image recognition, Sound detection',
      description: 'Trains AI models to recognize images, sounds, or body movements without coding.',
      imageUrl: '/media/curiosity centre/learnAI/teachablemachine.png',
    },
    {
      id: 'quickdraw',
      title: 'Quick, Draw!',
      subtitle: 'AI sketching, Pattern recognition, Fun learning',
      description: 'An interactive platform where users sketch an object and AI predicts in real time what it is.',
      imageUrl: '/media/curiosity centre/learnAI/quick draw.png',
    },
    {
      id: 'deepdream',
      title: 'Deep Dream Generator',
      subtitle: 'AI art, Image transformation, Style transfer',
      description: 'Uses AI to transform regular photos into dream-like artistic images, employing image transformation and style transfer.',
      imageUrl: '/media/curiosity centre/learnAI/deep generator .png',
    },
    {
      id: 'runway',
      title: 'Runway ML',
      subtitle: 'AI video editing, Image generation, Creative AI',
      description: 'Provides creative AI tools for video editing and image generation, suitable for experimenting with AI-powered media projects.',
      imageUrl: '/media/curiosity centre/learnAI/runway.png',
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(i => (
        <Card key={i.id} title={i.title} subtitle={i.subtitle} description={i.description} imageUrl={i.imageUrl} />
      ))}
    </div>
  );
};

export const RoboticsView: React.FC = () => {
  const { curated } = useCuriosityStore();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {curated.robotics.map(i => (
        <Card key={i.id} title={i.title} description={i.description} imageUrl={i.imageUrl} />
      ))}
    </div>
  );
};

export const SpaceView: React.FC = () => {
  const { curated } = useCuriosityStore();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {curated.space.map(i => (
        <Card key={i.id} title={i.title} description={i.description} imageUrl={i.imageUrl} />
      ))}
    </div>
  );
};


