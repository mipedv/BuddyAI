import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import type { DiscoverItem } from '../../hooks/useCuriosityStore';
import { useCuriosityStore } from '../../hooks/useCuriosityStore';
import { CuriosityI18nProvider, useCuriosityI18n } from '../../hooks/useCuriosityI18n';
import Sidebar from '../HomePage/Sidebar';
import HeaderRight from '../HeaderRight';
import { SUBJECTS_CHAPTERS } from '../HomePage';

const Chip: React.FC<{ active?: boolean; onClick?: () => void; children?: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-2 bg-white ${
      active ? 'border-teal-600 text-gray-800' : 'border-gray-300 text-gray-700 hover:border-gray-400'
    }`}
  >
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${active ? 'border-teal-600' : 'border-gray-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-teal-600' : 'bg-gray-500'}`}></span>
    </span>
    <span>{children}</span>
  </button>
);

const TranslateDropdown: React.FC<{ onChange?: (m: 'en-ar' | 'ar-en') => void }> = ({ onChange }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'en-ar' | 'ar-en'>('en-ar');
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="px-3 py-2 border rounded-lg bg-white text-gray-700">TRANSLATE</button>
      {open && (
        <div className="absolute z-10 mt-1 w-48 bg-white border rounded-lg shadow-lg">
          {[
            { key:'en-ar', label:'EN → AR', active:true },
            { key:'ar-en', label:'AR → EN', active:true },
            { key:'en-hi', label:'EN → HI', active:false },
            { key:'en-ml', label:'EN → ML', active:false },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => { if (!opt.active) return; setMode(opt.key as any); setOpen(false); onChange && onChange(opt.key as 'en-ar'|'ar-en'); }}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${mode===opt.key ? 'font-bold' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InnerDiscover: React.FC = () => {
  const navigate = useNavigate();
  const store = useCuriosityStore();
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const { pageLang, translateText } = useCuriosityI18n();

  const t = useMemo(() => {
    const dict: Record<string, string> = {
      'curiosity.discover.title': 'Discover',
      'curiosity.panel.title': 'Make it yours',
      'curiosity.panel.subtitle': 'Select topics and interests to customize your Curiosity Centre experience.',
      'curiosity.panel.save': 'Save Interests',
    };
    return (k: keyof typeof dict) => dict[k] || k;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/core/curiosity/discover`, {
          params: {
            subjectId: store.subjectId,
            chapterId: store.chapterId,
            interests: store.interests.join(','),
            limit: 10,
          }
        });
        // Physics-related curated fallbacks (preferred)
        const fallbacks: DiscoverItem[] = [
          { id: 'ph-1', title: 'First Private Mission to the Moon Announced', snippet: 'A commercial lander will carry instruments to study lunar surface composition and radiation.', source: 'space.com', publishedAt: '2025-08-24T00:00:00Z', imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200', url: '#' },
          { id: 'ph-2', title: 'Germany Invests in Fusion Research', snippet: 'New funding aims to accelerate stellarator experiments and fusion materials science.', source: 'physicsworld', publishedAt: '2025-08-24T00:00:00Z', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200', url: '#' },
          { id: 'ph-3', title: 'Voyager 2 Sends Back Fresh Data', snippet: 'After antenna realignment, the spacecraft resumes interstellar medium measurements.', source: 'nasa', publishedAt: '2025-08-24T00:00:00Z', imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1201', url: '#' },
          { id: 'ph-4', title: 'Large Hadron Collider Reaches New Luminosity Record', snippet: 'Upgrades boost collision rates enabling more precise measurements in particle physics.', source: 'cern', publishedAt: '2025-08-24T00:00:00Z', imageUrl: 'https://images.unsplash.com/photo-1581091215367-59ab6dcef1df?w=1200', url: '#' },
        ];
        // Prefer curated physics links to avoid repeated stubbed news
        setItems(fallbacks.slice(0, 4));
      } catch {
        setItems([]);
      }
    })();
  }, [store.subjectId, store.chapterId, store.interests]);

  return (
    <div className="flex h-screen bg-[#f6f6f1] overflow-hidden">
      <Sidebar activeItem="curiosity" />
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Global header row */}
        <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select value={store.subjectId} onChange={(e)=>store.setSubjectId(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-gray-700">
                {Object.keys(SUBJECTS_CHAPTERS).map((s)=> (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="relative">
              <select value={store.chapterId} onChange={(e)=>store.setChapterId(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-gray-700">
                {(SUBJECTS_CHAPTERS[store.subjectId as keyof typeof SUBJECTS_CHAPTERS] || ['Solar System']).map((c: string)=> (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <TranslateDropdown onChange={(m)=>{/* language handled at layout level if needed */}} />
          </div>
          <HeaderRight pageLang={'en'} />
        </div>

        {/* Main panel */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6" dir={pageLang==='ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-3 mb-6">
              <button className="p-2 border rounded" onClick={() => navigate('/curiosity/my-chapter')}>{'←'}</button>
              <h2 className="text-2xl font-semibold">{t('curiosity.discover.title')}</h2>
            </div>

            {/* Sub-tabs row (scope filters) */}
            <div className="flex items-center gap-6 border-b mb-6">
              <NavLink to="/curiosity/my-chapter" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>My Chapter</NavLink>
              <NavLink to="/curiosity/for-you" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>For you</NavLink>
              <NavLink to="/curiosity/learn-ai" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Learn AI</NavLink>
              <NavLink to="/curiosity/robotics" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Robotics</NavLink>
              <NavLink to="/curiosity/space" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>Space</NavLink>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                {items.length > 0 && (
                  <div className="border rounded-xl overflow-hidden mb-4">
                    {items[0].imageUrl && (
                      <img src={items[0].imageUrl} alt="" className="w-full aspect-video object-cover" />
                    )}
                    <div className="p-4">
                      <div className="text-xl font-semibold mb-1">{pageLang==='en' ? items[0].title : ''}</div>
                      <div className="text-gray-600 mb-2 line-clamp-3">{pageLang==='en' ? items[0].snippet : ''}</div>
                      <div className="text-xs text-gray-500">{items[0].source}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.slice(1).map((it) => (
                    <div key={it.id} className="border rounded-xl overflow-hidden">
                      {it.imageUrl && <img src={encodeURI(it.imageUrl)} alt="" className="w-full aspect-video object-cover" />}
                      <div className="p-4">
                        <div className="font-semibold mb-1 line-clamp-1">{pageLang==='en' ? it.title : ''}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{pageLang==='en' ? it.snippet : ''}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">{it.source}</div>
                          <button className="p-2 border rounded">🔖</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4">
                <div className="border rounded-xl p-4 bg-[#f6f6f1] relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">{t('curiosity.panel.title')}</div>
                    <button className="p-1 text-gray-600 hover:text-gray-800" aria-label="Close">×</button>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{t('curiosity.panel.subtitle')}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Technology','Science','Commerce & Economics','Arts & Music'].map(label => (
                      <Chip key={label} active={store.interests.includes(label)} onClick={() => {
                        const next = store.interests.includes(label)
                          ? store.interests.filter(x => x !== label)
                          : [...store.interests, label];
                        store.saveInterests(next);
                      }}>{label}</Chip>
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-teal-700 text-white rounded">{t('curiosity.panel.save')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DiscoverPage: React.FC = () => (
  <CuriosityI18nProvider>
    <InnerDiscover />
  </CuriosityI18nProvider>
);

export default DiscoverPage;


