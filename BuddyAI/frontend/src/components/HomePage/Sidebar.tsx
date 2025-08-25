import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SidebarProps {
  pageLang?: 'en' | 'ar';
  activeItem?: 'home' | 'practice' | 'recap' | 'curiosity' | 'library' | 'community';
}

const Sidebar: React.FC<SidebarProps> = ({ pageLang = 'en', activeItem = 'home' }) => {
  const dict: Record<string, { en: string; ar: string }> = {
    back: { en: 'Back', ar: 'رجوع' },
    newChat: { en: 'New Chat', ar: 'محادثة جديدة' },
    practice: { en: 'Practice & Test', ar: 'تدريب واختبار' },
    recap: { en: 'Classroom Recap', ar: 'مراجعة الصف' },
    curiosity: { en: 'Curiosity Centre', ar: 'مركز الفضول' },
    library: { en: 'Library', ar: 'المكتبة' },
    community: { en: 'Community', ar: 'المجتمع' },
  };
  const t = (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);

  const navigate = useNavigate();
  const menuItems = [
    { key: 'home', icon: '➕', label: t('newChat'), onClick: () => navigate('/home') },
    { key: 'practice', icon: '📝', label: t('practice'), onClick: () => navigate('/practice-test') },
    { key: 'recap', icon: '🎓', label: t('recap') },
    { key: 'curiosity', icon: '💡', label: t('curiosity'), onClick: () => navigate('/curiosity/my-chapter') },
    { key: 'library', icon: '📚', label: t('library') },
  ] as const;

  return (
    <div className="w-64 bg-[#F8F7F0] p-4 flex flex-col h-full fixed left-0 top-0 bottom-0 overflow-y-auto">
      {/* Logo or Branding */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 select-none">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Homie</span>{' '}
          <span>AI</span>
        </h1>
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else navigate('/home');
          }}
          title={t('back')}
          aria-label={t('back')}
          className="p-2 rounded hover:bg-gray-200 text-gray-600"
        >
          <ArrowLeft size={20} className={`${pageLang==='ar' ? '-scale-x-100' : ''}`} />
        </button>
      </div>

      {/* Main Menu Items */}
      <nav className="space-y-2 flex-grow">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`
              w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center
              ${activeItem === item.key ? 'text-white bg-blue-500 hover:bg-blue-600' : 'text-gray-600 hover:bg-gray-200'}
            `}
            onClick={item.onClick as any}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Community Item at Bottom */}
      <div className="mt-auto">
        <button
          className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center ${activeItem === 'community' ? 'text-white bg-blue-500 hover:bg-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => navigate('/community')}
          aria-current={activeItem==='community' ? 'page' : undefined}
        >
          <span className="mr-3">👥</span>
          <span dir={pageLang==='ar' ? 'rtl' : 'ltr'} className={pageLang==='ar' ? 'text-right' : 'text-left'}>{t('community')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 