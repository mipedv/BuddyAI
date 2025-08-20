import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Sidebar from './HomePage/Sidebar';

type PageLang = 'en' | 'ar';

interface Question {
  id: string;
  chapterId: string;
  section?: string | null;
  type: 'written' | 'mcq';
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  modelAnswer: string;
  rubric: {
    keyPoints: string[];
    keywords: string[];
    misconceptions: string[];
  };
  difficulty: 'easy' | 'moderate' | 'hard';
}

type QuestionView = Question & {
  promptTranslated?: string;
  optionsTranslated?: string[];
};

interface ScoreResponse {
  score: number;
  feedback: {
    recommendations: { id: string; text: string; why: string }[];
    correctParts: string[];
  };
}

const PracticeTestPage: React.FC = () => {
  const [pageLang, setPageLang] = useState<PageLang>('en');
  const [mode, setMode] = useState<'practice' | 'test'>('practice');
  const [section, setSection] = useState<string | null>(null);
  const [mix, setMix] = useState<{ written: number; mcq: number }>({ written: 1, mcq: 0 });
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | 'mixed'>('moderate');
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [answerTextTranslated, setAnswerTextTranslated] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ScoreResponse['feedback'] | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useMemo(() => {
    const dict: Record<string, { en: string; ar: string }> = {
      practiceTest: { en: 'Practice & Test', ar: 'تدريب واختبار' },
      practiceMode: { en: 'Practice Mode', ar: 'وضع التدريب' },
      testMode: { en: 'Test Mode', ar: 'وضع الاختبار' },
      allSections: { en: 'All Sections', ar: 'كل الأقسام' },
      writtenPractice: { en: 'written practice', ar: 'ممارسة كتابية' },
      moderate: { en: 'Moderate', ar: 'متوسط' },
      question: { en: 'Question', ar: 'سؤال' },
      writeAnswer: { en: 'Write answer', ar: 'اكتب الإجابة' },
      checkAnswer: { en: 'Check Answer', ar: 'تحقق من الإجابة' },
      next: { en: 'Next', ar: 'التالي' },
      tryAgain: { en: 'Try Answering Again', ar: 'حاول الإجابة مرة أخرى' },
      viewCorrect: { en: 'View Correct Answer', ar: 'عرض الإجابة الصحيحة' },
      translate: { en: 'TRANSLATE', ar: 'ترجمة' },
      score: { en: 'AI Score', ar: 'نتيجة الذكاء الاصطناعي' },
      recommendation: { en: 'Recommendation', ar: 'توصية' },
      correctPart: { en: 'Correct Part', ar: 'الجزء الصحيح' },
      generateMore: { en: 'Generate More Questions', ar: 'إنشاء أسئلة إضافية' },
    };
    return (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);
  }, [pageLang]);

  const current = questions[currentIndex];

  // Centralized translation helpers reused locally
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const translateText = async (text: string, target: 'en' | 'ar', source?: 'en' | 'ar') => {
    const key = `${target}|${text}`;
    const cached = translationCacheRef.current.get(key);
    if (cached !== undefined) return { text: cached } as { text: string };
    try {
      const resp = await axios.post(`/api/core/translate/`, { text, sourceLang: source, targetLang: target }, { timeout: 15000 });
      if (resp.data?.success) {
        translationCacheRef.current.set(key, resp.data.translatedText as string);
        return { text: resp.data.translatedText as string };
      }
    } catch {}
    return { text } as { text: string };
  };
  const translateArray = async (items: string[], target: 'en' | 'ar', source?: 'en' | 'ar') => {
    const out: string[] = [];
    for (const item of items) {
      const { text } = await translateText(item, target, source);
      out.push(text);
    }
    return out;
  };

  const generate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chapterId = 'solar-system'; // TODO: wire with real selection
      const res = await axios.post(`/api/chapters/${chapterId}/generate-questions`, {
        section,
        mix,
        difficulty,
        seed: 'dev',
        dedupeAgainstIds: questions.map(q => q.id),
      });
      const items: Question[] = res.data.items || [];
      setQuestions(prev => [...prev, ...items]);
      if (items.length && prevIsEmpty(count => count === 0)) setCurrentIndex(0);
    } catch (e: any) {
      setError('Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };

  const prevIsEmpty = (fn: (n: number) => boolean) => fn(questions.length);

  const scoreCurrent = async () => {
    if (!current) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = { type: current.type };
      if (current.type === 'written') payload.answer = answerText;
      else payload.selectedIndex = selectedOption;
      const res = await axios.post(`/api/questions/${current.id}/score`, payload);
      const data: ScoreResponse = res.data;
      setScore(data.score);
      setFeedback(data.feedback);
    } catch (e: any) {
      setError('Scoring failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCorrect = async () => {
    if (!current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/questions/${current.id}/correct`);
      const modelAnswer: string = res.data?.modelAnswer || '';
      setCorrectAnswer(modelAnswer);
      setShowCorrect(true);
    } catch (e: any) {
      setError('Failed to fetch correct answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Centralized translation effect for dynamic content on this page
  useEffect(() => {
    const target: 'en' | 'ar' = pageLang;
    const run = async () => {
      // Translate questions (prompt + options)
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const tp = (await translateText(q.prompt, target)).text;
        let topts: string[] | undefined = undefined;
        if (q.type === 'mcq' && q.options) topts = await translateArray(q.options, target);
        setQuestions(prev => prev.map((qq, idx) => (idx === i ? { ...qq, promptTranslated: tp, optionsTranslated: topts } : qq)));
      }
      // Translate current student's answer and feedback
      if (answerText) {
        const { text } = await translateText(answerText, target);
        setAnswerTextTranslated(text);
      } else {
        setAnswerTextTranslated('');
      }
      if (feedback) {
        const recs = await Promise.all(feedback.recommendations.map(async r => ({ ...r, text: (await translateText(r.text, target)).text })));
        const cps = await Promise.all(feedback.correctParts.map(async c => (await translateText(c, target)).text));
        setFeedback({ recommendations: recs, correctParts: cps });
      }
      // Correct answer panel
      if (showCorrect && correctAnswer) {
        const { text } = await translateText(correctAnswer, target);
        setCorrectAnswer(text);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLang]);

  return (
    <div className="flex h-screen bg-white overflow-hidden" dir={pageLang==='ar' ? 'rtl' : 'ltr'}>
      <Sidebar pageLang={pageLang} />
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{t('practiceTest')}</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 mr-2">{t('translate')}</div>
              <select
                value={pageLang}
                onChange={(e) => setPageLang(e.target.value as PageLang)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="en">EN → AR</option>
                <option value="ar">AR → EN</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              className={`px-3 py-1 rounded-full text-sm ${mode==='practice' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
              onClick={() => setMode('practice')}
            >{t('practiceMode')}</button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${mode==='test' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
              onClick={() => setMode('test')}
            >{t('testMode')}</button>
            <div className="ml-auto flex items-center gap-2">
              <button className="px-3 py-1 border rounded text-sm" onClick={generate} disabled={isLoading}>
                {t('generateMore')}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}

          {current && (
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm">{t('question')} {currentIndex + 1}</div>
                {score !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 border rounded-full px-3 py-1">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      {t('score')} <span className="font-semibold">{score}%</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="text-gray-900 mb-3">{current.promptTranslated ?? current.prompt}</div>

              {current.type === 'written' ? (
                <textarea
                  value={answerTextTranslated || answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={t('writeAnswer')}
                  dir={pageLang==='ar' ? 'rtl' : 'ltr'}
                  className="w-full min-h-[120px] border rounded-lg p-3"
                />
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {(current.optionsTranslated ?? current.options ?? []).map((opt, idx) => (
                    <label key={idx} className={`border rounded p-3 cursor-pointer ${selectedOption===idx ? 'border-teal-600 ring-1 ring-teal-600' : ''}`}>
                      <input type="radio" className="mr-2" checked={selectedOption===idx} onChange={() => setSelectedOption(idx)} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button className="px-4 py-2 bg-teal-700 text-white rounded" onClick={scoreCurrent} disabled={isLoading}>
                  {t('checkAnswer')}
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button className="px-3 py-2 border rounded" onClick={() => setCurrentIndex(Math.max(0, currentIndex-1))}>{'⏮'}</button>
                  <button className="px-3 py-2 border rounded" onClick={() => setCurrentIndex(Math.min(questions.length-1, currentIndex+1))}>{t('next')}</button>
                  {'⏭'}
                </div>
              </div>
            </div>
          )}

          {feedback && (
            <div className="mt-4 bg-white border rounded-xl p-4">
              <div className="flex gap-3 text-sm border-b pb-2 mb-3">
                <div className="px-3 py-1 rounded-full bg-gray-200">{t('recommendation')}</div>
                <div className="px-3 py-1 rounded-full bg-gray-100">{t('correctPart')}</div>
              </div>
              <ul className="space-y-2">
                {feedback.recommendations.map(r => (
                  <li key={r.id} className="text-sm text-gray-800">
                    <span className="mr-2">1</span>
                    {r.text}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border rounded p-3 text-gray-800" dir={pageLang==='ar' ? 'rtl' : 'ltr'}>
                {answerTextTranslated || answerText}
              </div>
              <div className="mt-3 flex gap-3">
                <button className="px-3 py-2 bg-teal-700 text-white rounded" onClick={() => { setAnswerText(''); setScore(null); setFeedback(null); }}>{t('tryAgain')}</button>
                <button className="px-3 py-2 border rounded" onClick={fetchCorrect}>{t('viewCorrect')}</button>
              </div>
            </div>
          )}

          {showCorrect && (
            <div className="mt-4 bg-white border rounded-xl p-4">
              <div className="font-medium mb-2">{t('viewCorrect')}</div>
              <div className="text-gray-800 whitespace-pre-wrap">{correctAnswer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeTestPage;


