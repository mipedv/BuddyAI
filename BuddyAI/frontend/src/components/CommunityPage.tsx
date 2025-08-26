import React, { useMemo, useState } from 'react';
import Sidebar from './HomePage/Sidebar';
import HeaderRight from './HeaderRight';

type Lang = 'en' | 'ar';

const CommunityPage: React.FC = () => {
  const [pageLang, setPageLang] = useState<Lang>('en');
  const [translateOpen, setTranslateOpen] = useState(false);

  const t = useMemo(() => {
    const dict: Record<string, { en: string; ar: string }> = {
      title: { en: 'Community', ar: 'المجتمع' },
      picker: { en: 'School Community', ar: 'مجتمع المدرسة' },
      sharePlaceholder: { en: 'Share thoughts, ideas or updates', ar: 'شارك أفكارك أو التحديثات' },
      discussion: { en: 'Discussion', ar: 'نقاش' },
      post: { en: 'Post', ar: 'منشور' },
      question: { en: 'Question', ar: 'سؤال' },
      poll: { en: 'Poll', ar: 'استطلاع' },
      suggested: { en: 'Suggested Community', ar: 'مجتمعات مقترحة' },
      join: { en: 'Join', ar: 'انضم' },
      events: { en: 'Events', ar: 'فعاليات' },
      news: { en: 'News', ar: 'أخبار' },
      like: { en: 'Like', ar: 'إعجاب' },
      comment: { en: 'Comment', ar: 'تعليق' },
      send: { en: 'Send', ar: 'إرسال' },
      translate: { en: 'Translate', ar: 'ترجمة' },
    };
    return (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);
  }, [pageLang]);

  const feed = [
    {
      id: 'post1',
      author: { name: 'School Hackathon', avatarUrl: '/media/community/hackathon.png' },
      createdAt: '2d',
      text: 'Join our 24-hour hackathon: build your personal website and win amazing prizes. Register below!\nhttps://buff.ly/3e3QaL7',
      imageUrl: '/media/community/hackathon.png',
    },
  ];

  const suggested = [
    { id: 's1', name: 'Astronomy Lovers', members: 56, avatarUrl: '/media/community/astronomy lovers.png' },
    { id: 's2', name: 'Art & Creativity', members: 71, avatarUrl: '/media/community/art&creativity.png' },
    { id: 's3', name: 'Tech Innovators', members: 32, avatarUrl: '/media/community/tech innovators.png' },
  ];

  return (
    <div className="flex h-screen bg-[#f6f6f1] overflow-hidden">
      <Sidebar activeItem="community" />
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
          <div className="flex items-center gap-4">
            <select className="px-3 py-2 border rounded-lg bg-white text-gray-700">
              <option>{t('picker')}</option>
            </select>
            {/* Translate Dropdown (same behavior pattern as other pages) */}
            <div className="relative">
              <button
                onClick={() => setTranslateOpen(!translateOpen)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-700 flex items-center gap-2"
                title={t('translate')}
              >
                <span className="text-sm">{t('translate')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
              </button>
              {translateOpen && (
                <div className="absolute right-0 z-10 mt-1 w-48 bg-white border rounded-lg shadow-lg">
                  {[
                    { key: 'en-ar', label: 'EN → AR', target: 'ar' },
                    { key: 'ar-en', label: 'AR → EN', target: 'en' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setTranslateOpen(false);
                        setPageLang(opt.target as Lang);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        (opt.target === pageLang) ? 'font-bold' : ''
                      }`}
                    >
                      {(opt.target === pageLang ? '✓ ' : '') + opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <HeaderRight pageLang={'en'} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6 grid grid-cols-12 gap-6">
            {/* Left feed column */}
            <div className="col-span-12 lg:col-span-7">
              {/* Composer */}
              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src="/boy.png" alt="me" className="w-10 h-10 rounded-full object-cover" />
                  <input className="flex-1 px-4 py-2 rounded-full border" placeholder={t('sharePlaceholder')} />
                </div>
                <div className="flex gap-3 mt-3">
                  {[t('discussion'), t('post'), t('question'), t('poll')].map((label, i) => (
                    <button key={i} className="px-3 py-1.5 rounded-full border text-sm bg-white hover:bg-gray-50">{label}</button>
                  ))}
                </div>
              </div>
              <div className="mt-2 border-t pt-3 flex items-center justify-end">
                <span className="text-xs text-gray-500 mr-2">Sort by</span>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white text-sm hover:bg-gray-50">
                  Top
                  <span className="ml-1">▾</span>
                </button>
              </div>

              {/* Feed */}
              {feed.map((p) => (
                <div key={p.id} className="border rounded-xl shadow-sm mb-6 overflow-hidden">
                  <div className="p-4 flex items-start gap-3">
                    <img src={p.author.avatarUrl} alt="avatar" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-medium">{p.author.name}</div>
                      <div className="text-xs text-gray-500">821 following · {p.createdAt}</div>
                    </div>
                    <button className="p-1 text-gray-500">•••</button>
                  </div>
                  <div className="px-4 pb-4 text-gray-800 whitespace-pre-line">
                    {p.text}
                  </div>
                  {p.imageUrl && (
                    <img loading="lazy" src={p.imageUrl} alt="post" className="w-full object-cover" />
                  )}
                  <div className="p-4 flex items-center gap-6 text-gray-600">
                    <button className="flex items-center gap-2">👍 {t('like')}</button>
                    <button className="flex items-center gap-2">💬 {t('comment')}</button>
                    <button className="flex items-center gap-2">📤 {t('send')}</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right sidebar */}
            <div className="col-span-12 lg:col-span-5">
              {/* Suggested Communities */}
              <div className="border rounded-xl p-4 bg-white mb-6 shadow-sm">
                <div className="font-semibold mb-2">{t('suggested')}</div>
                <div className="text-sm text-gray-600 mb-3">Communities to join based on your activity and mutual friends</div>
                <div className="space-y-3">
                  {suggested.map((c)=> (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={c.avatarUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.members} members</div>
                        </div>
                      </div>
                      <button className="px-4 py-1 rounded-full border text-sm bg-white hover:bg-gray-50">{t('join')}</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events/News */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <button className="px-3 py-1 rounded-full border bg-gray-100 text-sm">{t('events')}</button>
                  <button className="px-3 py-1 rounded-full border bg-white text-sm hover:bg-gray-50">{t('news')}</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'e1', title: 'Creative Minds Workshop', category: 'Science', date: '19 April, 2025', venue: 'School Ground', going: '50+ going', img: '/media/community/rightside_events.png', speaker: 'John Doe'
                    },
                    {
                      id: 'e2', title: 'Tech Talk Tuesdays', category: 'Science', date: '22 April, 2025', venue: 'School Auditorium', going: '42+ going', img: '/media/community/tech innovators.png', speaker: 'John Doe'
                    },
                    {
                      id: 'e3', title: 'Creative Canvas Expo', category: 'Arts', date: '25 April, 2025', venue: 'School Auditorium', going: '61+ going', img: '/media/community/art&creativity.png', speaker: 'George'
                    },
                  ].map((e)=> (
                    <div key={e.id} className="rounded-xl overflow-hidden shadow-sm border bg-white">
                      <div className="relative">
                        <img loading="lazy" src={e.img} alt="" className="w-full aspect-video object-cover" />
                        <span className="absolute top-3 left-3 text-white text-xs bg-orange-500 px-3 py-1 rounded-full">{e.category}</span>
                        <span className="absolute top-3 right-3 bg-blue-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">★</span>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-gray-800 mb-1 text-sm">{e.title}</div>
                        <div className="text-xs text-gray-500 mb-2">{e.speaker}</div>
                        <div className="flex items-center gap-2 mb-2"><span className="px-2 py-1 rounded-lg bg-gray-100 text-xs">{e.date}</span></div>
                        <div className="flex items-center gap-2 mb-3"><span className="px-2 py-1 rounded-lg bg-gray-100 text-xs">{e.venue}</span></div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="flex -space-x-2">
                            <img src="/boy.png" alt="a" className="w-5 h-5 rounded-full object-cover border" />
                            <img src="/boy.png" alt="b" className="w-5 h-5 rounded-full object-cover border" />
                            <img src="/boy.png" alt="c" className="w-5 h-5 rounded-full object-cover border" />
                          </div>
                          <span>{e.going}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;


