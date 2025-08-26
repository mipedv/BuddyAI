import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCuriosityStore } from '../../hooks/useCuriosityStore';
import Sidebar from '../HomePage/Sidebar';
import HeaderRight from '../HeaderRight';
import { SUBJECTS_CHAPTERS } from '../HomePage';
import { CuriosityI18nProvider, useCuriosityI18n } from '../../hooks/useCuriosityI18n';

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
      <button onClick={() => setOpen(!open)} className="px-3 py-2 border rounded-lg bg-white text-gray-700">
        TRANSLATE
      </button>
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
              onClick={() => {
                if (!opt.active) return;
                setMode(opt.key as any);
                setOpen(false);
                onChange && onChange(opt.key as 'en-ar' | 'ar-en');
              }}
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

const InnerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useCuriosityStore();
  const { pageLang, setPageLang } = useCuriosityI18n();

  const t = useMemo(() => {
    const dict: Record<string, { en: string; ar: string }> = {
      'curiosity.title': { en: 'Curiosity Centre', ar: 'مركز الفضول' },
      'curiosity.tabs.myChapter': { en: 'My Chapter', ar: 'فصلي' },
      'curiosity.tabs.forYou': { en: 'For you', ar: 'لك' },
      'curiosity.tabs.learnAI': { en: 'Learn AI', ar: 'تعلّم الذكاء الاصطناعي' },
      'curiosity.tabs.robotics': { en: 'Robotics', ar: 'الروبوتات' },
      'curiosity.tabs.space': { en: 'Space', ar: 'الفضاء' },
      'curiosity.actions.books': { en: 'Books', ar: 'الكتب' },
      'curiosity.actions.discover': { en: 'Discover', ar: 'اكتشف' },
      'curiosity.panel.title': { en: 'Make it yours', ar: 'اجعلها تناسبك' },
      'curiosity.panel.subtitle': { en: 'Select topics and interests to customize your Curiosity Centre experience.', ar: 'اختر المواضيع والاهتمامات لتخصيص تجربة مركز الفضول.' },
      'curiosity.panel.interests.technology': { en: 'Technology', ar: 'التكنولوجيا' },
      'curiosity.panel.interests.science': { en: 'Science', ar: 'العلوم' },
      'curiosity.panel.interests.commerce': { en: 'Commerce & Economics', ar: 'التجارة والاقتصاد' },
      'curiosity.panel.interests.arts': { en: 'Arts & Music', ar: 'الفنون والموسيقى' },
      'curiosity.panel.save': { en: 'Save Interests', ar: 'حفظ الاهتمامات' },
    };
    return (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);
  }, [pageLang]);

  useEffect(() => {
    if (location.pathname === '/curiosity' || location.pathname === '/curiosity/') {
      navigate('/curiosity/my-chapter', { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleInterest = (label: string) => {
    const next = store.interests.includes(label)
      ? store.interests.filter(x => x !== label)
      : [...store.interests, label];
    store.saveInterests(next);
  };

  return (
    <div className="flex h-screen bg-[#f6f6f1] overflow-hidden">
      <Sidebar activeItem="curiosity" pageLang={pageLang} />
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Global header row to match app */}
        <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
          {/* Subject & Chapter selectors + Translate */}
          <div className="flex items-center space-x-4">
            {/* Subject */}
            <div className="relative">
              <select
                value={store.subjectId}
                onChange={(e) => store.setSubjectId(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-700"
              >
                {Object.keys(SUBJECTS_CHAPTERS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Chapter */}
            <div className="relative">
              <select
                value={store.chapterId}
                onChange={(e) => store.setChapterId(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-700"
              >
                {(SUBJECTS_CHAPTERS[store.subjectId as keyof typeof SUBJECTS_CHAPTERS] || ['Solar System']).map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Translate dropdown (same UX as Home/Response) */}
            <TranslateDropdown onChange={(mode) => {
              if (mode === 'en-ar') setPageLang('ar');
              if (mode === 'ar-en') setPageLang('en');
            }} />
          </div>
          <HeaderRight pageLang={'en'} />
        </div>

        {/* Main panel */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6" dir={pageLang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{t('curiosity.title')}</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded text-sm" onClick={() => navigate('/curiosity/books')}>{t('curiosity.actions.books')}</button>
                <button className="px-3 py-1 bg-teal-700 text-white rounded text-sm" onClick={() => navigate('/curiosity/discover')}>{t('curiosity.actions.discover')}</button>
              </div>
            </div>

            <div className="flex items-center gap-6 border-b mb-6">
              <NavLink to="/curiosity/my-chapter" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>{t('curiosity.tabs.myChapter')}</NavLink>
              <NavLink to="/curiosity/for-you" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>{t('curiosity.tabs.forYou')}</NavLink>
              <NavLink to="/curiosity/learn-ai" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>{t('curiosity.tabs.learnAI')}</NavLink>
              <NavLink to="/curiosity/robotics" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>{t('curiosity.tabs.robotics')}</NavLink>
              <NavLink to="/curiosity/space" className={({isActive}) => `pb-2 -mb-px ${isActive ? 'border-b-2 border-teal-700 text-teal-700' : 'text-gray-600 hover:text-gray-800'}`}>{t('curiosity.tabs.space')}</NavLink>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <Outlet />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <div className="border rounded-xl p-4 bg-[#f6f6f1] relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">{t('curiosity.panel.title')}</div>
                    <button className="p-1 text-gray-600 hover:text-gray-800" aria-label="Close">×</button>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{t('curiosity.panel.subtitle')}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Chip active={store.interests.includes('Technology')} onClick={() => toggleInterest('Technology')}>{t('curiosity.panel.interests.technology')}</Chip>
                    <Chip active={store.interests.includes('Science')} onClick={() => toggleInterest('Science')}>{t('curiosity.panel.interests.science')}</Chip>
                    <Chip active={store.interests.includes('Commerce & Economics')} onClick={() => toggleInterest('Commerce & Economics')}>{t('curiosity.panel.interests.commerce')}</Chip>
                    <Chip active={store.interests.includes('Arts & Music')} onClick={() => toggleInterest('Arts & Music')}>{t('curiosity.panel.interests.arts')}</Chip>
                  </div>
                  <button className="px-4 py-2 bg-teal-700 text-white rounded" onClick={() => {/* analytics: curiosity_interests_save */}}>{t('curiosity.panel.save')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CuriosityLayout: React.FC = () => (
  <CuriosityI18nProvider>
    <InnerLayout />
  </CuriosityI18nProvider>
);

export default CuriosityLayout;


