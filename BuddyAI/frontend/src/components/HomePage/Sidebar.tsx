import React from 'react';

interface SidebarProps {
  pageLang?: 'en' | 'ar';
}

const Sidebar: React.FC<SidebarProps> = ({ pageLang = 'en' }) => {
  const dict: Record<string, { en: string; ar: string }> = {
    newChat: { en: 'New Chat', ar: 'محادثة جديدة' },
    practice: { en: 'Practice & Test', ar: 'تدريب واختبار' },
    recap: { en: 'Classroom Recap', ar: 'مراجعة الصف' },
    curiosity: { en: 'Curiosity Centre', ar: 'مركز الفضول' },
    library: { en: 'Library', ar: 'المكتبة' },
    community: { en: 'Community', ar: 'المجتمع' },
  };
  const t = (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);

  const menuItems = [
    { icon: '➕', label: t('newChat'), isActive: true, className: 'text-white bg-blue-500' },
    { icon: '📝', label: t('practice'), isActive: false },
    { icon: '🎓', label: t('recap'), isActive: false },
    { icon: '💡', label: t('curiosity'), isActive: false },
    { icon: '📚', label: t('library'), isActive: false },
  ];

  return (
    <div className="w-64 bg-[#F8F7F0] p-4 flex flex-col h-full fixed left-0 top-0 bottom-0 overflow-y-auto">
      {/* Logo or Branding */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Buddy</span>{' '}
          <span>AI</span>
        </h1>
      </div>

      {/* Main Menu Items */}
      <nav className="space-y-2 flex-grow">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`
              w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center
              ${item.isActive 
                ? 'text-white bg-blue-500 hover:bg-blue-600' 
                : 'text-gray-600 hover:bg-gray-200'}
            `}
          >
            <span className="mr-3">{item.icon}</span>
            <span dir={pageLang==='ar' ? 'rtl' : 'ltr'} className={pageLang==='ar' ? 'text-right' : 'text-left'}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Community Item at Bottom */}
      <div className="mt-auto">
        <button
          className="w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center text-gray-600 hover:bg-gray-200"
        >
          <span className="mr-3">👥</span>
          <span dir={pageLang==='ar' ? 'rtl' : 'ltr'} className={pageLang==='ar' ? 'text-right' : 'text-left'}>{t('community')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 