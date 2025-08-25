import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './HomePage/Sidebar';
import HeaderRight from './HeaderRight';

type Lang = 'en' | 'ar';

const ProfilePage: React.FC = () => {
  const [pageLang, setPageLang] = useState<Lang>('en');
  const [translateOpen, setTranslateOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<{ name: string; gradeLabel?: string; avatarUrl?: string; points?: number; badges?: Array<{ id:string; name:string; imageUrl:string }>; } | null>(null);

  const t = useMemo(() => {
    const dict: Record<string, { en: string; ar: string }> = {
      title: { en: 'My Profile', ar: 'ملفي الشخصي' },
      points: { en: '+ 120 Points', ar: '+ 120 نقطة' },
      badgesTitle: { en: 'Badges & Achievements', ar: 'الشارات والإنجازات' },
      badgesMore: { en: 'Get More Badges', ar: 'احصل على المزيد من الشارات' },
      spaceExplorer: { en: 'Space Explorer', ar: 'مستكشف الفضاء' },
      mathEnthusiast: { en: 'Math Enthusiast', ar: 'محب الرياضيات' },
      aiVisionary: { en: 'AI Visionary', ar: 'رائد الذكاء الاصطناعي' },
      interestsTitle: { en: 'Interest & Strengths', ar: 'الاهتمامات ونقاط القوة' },
      chipSpace: { en: 'Space Exploration', ar: 'استكشاف الفضاء' },
      chipAI: { en: 'AI Visionary', ar: 'رؤية الذكاء الاصطناعي' },
      chipMath: { en: 'Math Enthusiast', ar: 'محب الرياضيات' },
      i1title: { en: 'Space Exploration', ar: 'استكشاف الفضاء' },
      i1desc: { en: 'Reads astronomy articles and participates in space related discussion frequently.', ar: 'يقرأ مقالات الفلك ويشارك بشكل متكرر في مناقشات الفضاء.' },
      i2title: { en: 'AI Visionary', ar: 'رائد الذكاء الاصطناعي' },
      i2desc: { en: 'Envisions groundbreaking applications of AI and actively experiments with innovative machine learning solutions.', ar: 'يتخيل تطبيقات رائدة للذكاء الاصطناعي ويجرب حلول التعلم الآلي المبتكرة.' },
      i3title: { en: 'Math Enthusiast', ar: 'محب الرياضيات' },
      i3desc: { en: 'Consistently scores high in math quizzes and shows strong problem‑solving abilities', ar: 'يحقق درجات عالية باستمرار في اختبارات الرياضيات ويظهر قدرات قوية على حل المشكلات.' },
      feedbackTitle: { en: 'Teacher & Peer Feedback', ar: 'تعليقات المعلم والزملاء' },
      teacherName: { en: 'Mr. Thompson (Math Teacher)', ar: 'السيد طومبسون (معلم الرياضيات)' },
      teacherMsg: { en: 'Zayan demonstrate strong problem‑solving in geometry–Consider advanced tasks. His analytical thinking is particularly impressive', ar: 'يظهر زيان مهارات قوية في حل المسائل في الهندسة — يُنصح بمهام متقدمة. تفكيره التحليلي لافت للإعجاب.' },
      peerName: { en: 'Jackson L. (Classmate)', ar: 'جاكسون ل. (زميل صف)' },
      peerMsg: { en: 'Thanks for helping me with that robotics question! Your explanation made it so much clearer.', ar: 'شكرًا لمساعدتي في سؤال الروبوتات! جعل شرحك الأمر أوضح بكثير.' },
      curiosityTitle: { en: 'Curiosity Corner', ar: 'ركن الفضول' },
      timeSpent: { en: '3 Hours in the Past 2 Weeks', ar: '3 ساعات في آخر أسبوعين' },
      modulesCompleted: { en: 'Modules Completed', ar: 'وحدات مكتملة' },
      astrophysics: { en: 'Astrophysics 101', ar: 'الفيزياء الفلكية 101' },
      robotics: { en: 'Intro to Robotics', ar: 'مقدمة في الروبوتات' },
      nextRecommendations: { en: 'Next Recommendations:', ar: 'التوصيات التالية:' },
      upcomingFair: { en: 'Upcoming Science Fair', ar: 'معرض العلوم القادم' },
      registerBy: { en: 'Register by June 10', ar: 'سجّل قبل 10 يونيو' },
      languageTitle: { en: 'Language Fluency', ar: 'الطلاقة اللغوية' },
      speakingFluency: { en: 'Speaking Fluency', ar: 'طلاقة التحدث' },
      improvedThisMonth: { en: 'Improved this month', ar: 'تحسّن هذا الشهر' },
      tryExercise: { en: 'Try a 5-minute conversation exercise', ar: 'جرّب تمرين محادثة لمدة 5 دقائق' },
      languageNote: { en: 'Fluency is tracked from mic‑based conversation exercises; monthly score updates reflect performance analytics.', ar: 'تُقاس الطلاقة من تمارين المحادثة عبر الميكروفون؛ يتم تحديث الدرجة شهريًا وفق تحليلات الأداء.' },
      translate: { en: 'Translate', ar: 'ترجمة' },
      gradeLevel: { en: '7th Standard', ar: 'الصف السابع' },
      name: { en: 'Zayan', ar: 'زيان' },
    };
    return (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);
  }, [pageLang]);

  const badgeSrc = (p: string) => encodeURI(p);

  const donut = (percent: number) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);
    return { radius, circumference, offset };
  };
  const d = donut(75);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          name: parsed.username || 'User',
          gradeLabel: parsed.class || undefined,
          avatarUrl: parsed.avatarUrl || '/boy.png',
          points: parsed.points || 120,
          badges: parsed.badges || undefined,
        });
      } else {
        setUser({ name: 'User', gradeLabel: undefined, avatarUrl: '/boy.png', points: 120 });
      }
    } catch {
      setUser({ name: 'User', gradeLabel: undefined, avatarUrl: '/boy.png', points: 120 });
    } finally {
      setLoadingUser(false);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#f6f6f1] overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Header (subject/chapter placeholders + translator like other pages) */}
        <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">{t('title')}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Global-style TRANSLATE control */}
            <div className="relative">
              <button
                onClick={() => setTranslateOpen(!translateOpen)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-700 flex items-center gap-2"
                title={t('translate')}
              >
                <span className="text-sm">{t('translate')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z" fill="currentColor"/></svg>
              </button>
              {translateOpen && (
                <div className="absolute right-0 z-10 mt-1 w-48 bg-white border rounded-lg shadow-lg">
                  {[
                    { key: 'en-ar', label: 'EN → AR', target: 'ar' },
                    { key: 'ar-en', label: 'AR → EN', target: 'en' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setTranslateOpen(false); setPageLang(opt.target as Lang); }}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${opt.target===pageLang ? 'font-bold' : ''}`}
                    >
                      {(opt.target===pageLang ? '✓ ' : '') + opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <HeaderRight />
          </div>
        </div>

        {/* Main panel */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-md border p-6">
            {/* Header Block split into two bands */}
            <div className={`flex flex-col ${pageLang==='ar' ? 'items-end' : 'items-start'}`}>
              {/* Top band: user info + points */}
              <div className={`w-full ${pageLang==='ar' ? 'sm:flex-row-reverse' : ''} flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gray-50 px-6 py-4 border-b`}> 
                <div className={`flex items-center gap-4 ${pageLang==='ar' ? 'sm:flex-row-reverse' : ''}`}>
                  {loadingUser ? (
                    <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
                  ) : (
                    <img src={user?.avatarUrl || '/media/user-profile/avatar-placeholder.png'} alt="Profile avatar" className="w-20 h-20 rounded-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/media/user-profile/avatar-placeholder.png';}} />
                  )}
                  <div className={`${pageLang==='ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-xl font-semibold text-gray-800">{loadingUser ? '...' : (user?.name || 'User')}</div>
                    <div className="text-sm text-gray-500">{user?.gradeLabel || t('gradeLevel')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold">{`+ ${user?.points || 120} Points`}</button>
                </div>
              </div>
              {/* Badges band */}
              <div className="w-full bg-white px-6 py-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">{t('badgesTitle')}</div>
                <div className={`flex flex-wrap justify-center gap-6 pb-2 overflow-x-auto sm:overflow-visible ${pageLang==='ar' ? 'flex-row-reverse' : ''}`} style={{ scrollbarWidth: 'thin' }}>
                  {(user?.badges && user.badges.length > 0
                    ? user.badges.map(b => ({ src: b.imageUrl, label: b.name, key: b.id }))
                    : [
                        { src: '/media/user profile/space.png', label: t('spaceExplorer'), key: 'space' },
                        { src: '/media/user profile/maths.png', label: t('mathEnthusiast'), key: 'math' },
                        { src: '/media/user profile/AI visionary.png', label: t('aiVisionary'), key: 'ai' },
                        { src: '/media/user profile/getmorebadges.png', label: t('badgesMore'), key: 'more' },
                      ]
                  ).map((b) => (
                    <div key={b.key} className="flex flex-col items-center min-w-[120px]">
                      <img src={badgeSrc(b.src)} alt={`Badge: ${b.label}`} className="w-16 h-16 object-contain" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/media/placeholder-badge.png';}} />
                      <div className="text-xs text-gray-600 mt-2 text-center">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              {/* Left column */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                {/* Interests & Strengths */}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('interestsTitle')}</h2>
                  <div className={`flex flex-wrap gap-2 mb-4 ${pageLang==='ar' ? 'justify-end' : ''}`}>
                    <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs">{t('chipSpace')}</span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">{t('chipAI')}</span>
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">{t('chipMath')}</span>
                  </div>
                  <div className="space-y-4">
                    {[{ iconBg: 'bg-pink-100', icon: '🛰️', title: t('i1title'), desc: t('i1desc') },
                      { iconBg: 'bg-blue-100', icon: '🤖', title: t('i2title'), desc: t('i2desc') },
                      { iconBg: 'bg-yellow-100', icon: '📐', title: t('i3title'), desc: t('i3desc') }].map((it, i) => (
                      <div key={i} className={`flex items-start gap-3 ${pageLang==='ar' ? 'flex-row-reverse text-right' : ''}`}>
                        <div className={`w-9 h-9 ${it.iconBg} rounded-full flex items-center justify-center text-base`}>{it.icon}</div>
                        <div>
                          <div className="font-medium text-gray-800 text-sm">{it.title}</div>
                          <div className="text-xs text-gray-600">{it.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teacher & Peer Feedback */}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('feedbackTitle')}</h2>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-yellow-50 p-3">
                      <div className="text-xs font-medium text-gray-800 mb-1">{t('teacherName')}</div>
                      <div className="text-xs text-gray-700">{t('teacherMsg')}</div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3">
                      <div className="text-xs font-medium text-gray-800 mb-1">{t('peerName')}</div>
                      <div className="text-xs text-gray-700">{t('peerMsg')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Curiosity Corner */}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('curiosityTitle')}</h2>
                  <div className={`text-xs text-blue-700 mb-4 ${pageLang==='ar' ? 'text-right' : ''}`}>{t('timeSpent')}</div>
                  <div className="space-y-4">
                    {[{ label: t('astrophysics'), current: 3, total: 5 }, { label: t('robotics'), current: 1, total: 4 }].map((p, i) => {
                      const percent = Math.round((p.current / p.total) * 100);
                      return (
                        <div key={i}>
                          <div className={`flex items-center justify-between text-xs text-gray-700 mb-1 ${pageLang==='ar' ? 'flex-row-reverse' : ''}`}>
                            <span>{p.label}</span>
                            <span className="text-gray-500">{p.current}/{p.total} {t('modulesCompleted')}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <div className={`border rounded-lg p-3 bg-blue-50 text-blue-800 text-xs ${pageLang==='ar' ? 'text-right' : ''}`}>
                      <div className="font-medium">{t('upcomingFair')}</div>
                      <div>{t('registerBy')}</div>
                    </div>
                  </div>
                </div>

                {/* Language Fluency */}
                <div className="border rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('languageTitle')}</h2>
                  <div className={`flex items-center gap-6 ${pageLang==='ar' ? 'flex-row-reverse' : ''}`}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={d.radius} stroke="#E5E7EB" strokeWidth="10" fill="none" />
                      <circle cx="60" cy="60" r={d.radius} stroke="#2563EB" strokeWidth="10" fill="none" strokeDasharray={`${d.circumference} ${d.circumference}`} strokeDashoffset={d.offset} strokeLinecap="round" transform="rotate(-90 60 60)" />
                      <text x="60" y="66" textAnchor="middle" fontSize="18" fill="#111827">75%</text>
                    </svg>
                    <div className={`${pageLang==='ar' ? 'text-right' : 'text-left'}`}>
                      <div className="text-sm font-medium text-gray-800 mb-1">{t('speakingFluency')}</div>
                      <div className="text-xs text-gray-500 mb-3">{t('improvedThisMonth')}</div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" aria-label={t('tryExercise')}>{t('tryExercise')}</button>
                      <div className="text-[11px] text-gray-500 mt-3">{t('languageNote')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


