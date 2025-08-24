import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

type PageLang = 'en' | 'ar';

interface SummaryRow {
  questionId: string;
  type: 'written' | 'mcq';
  yourAnswer: string | number | null;
  correctAnswer: string | number | null;
  score10: number;
  isCorrect: boolean;
  missedKeys: string[];
}

interface SummaryResponse {
  overallPercent: number;
  correctCount: number;
  total: number;
  timeSpentSec: number;
  rows: SummaryRow[];
}

const PracticeTestSummary: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const testId = new URLSearchParams(search).get('testId') || '';
  const [pageLang, setPageLang] = useState<PageLang>('en');
  const [data, setData] = useState<SummaryResponse | null>(null);

  const t = useMemo(() => {
    const dict: Record<string, { en: string; ar: string }> = {
      title: { en: 'Test Summary', ar: 'ملخص الاختبار' },
      overallScore: { en: 'Overall %', ar: 'النسبة الإجمالية' },
      correctOutOfTotal: { en: 'Correct / Total', ar: 'الصحيح / الإجمالي' },
      timeSpent: { en: 'Time Spent', ar: 'الوقت المستغرق' },
      attempts: { en: 'Attempts', ar: 'المحاولات' },
      qNo: { en: 'Q#', ar: 'رقم السؤال' },
      yourAnswer: { en: 'Your Answer', ar: 'إجابتك' },
      correctAnswer: { en: 'Correct Answer', ar: 'الإجابة الصحيحة' },
      score10: { en: 'Score (0–10)', ar: 'النتيجة (0–10)' },
      pass: { en: 'Pass', ar: 'ناجح' },
      fail: { en: 'Fail', ar: 'راسب' },
      missedKeys: { en: 'Missed Key Points', ar: 'نقاط رئيسية مفقودة' },
      reviewWeakAreas: { en: 'Review weak areas', ar: 'مراجعة نقاط الضعف' },
      backToPractice: { en: 'Back to Practice', ar: 'العودة للتدريب' },
      translate: { en: 'TRANSLATE', ar: 'ترجمة' },
      notAnswered: { en: 'Not answered', ar: 'لم تتم الإجابة' },
    };
    return (k: keyof typeof dict) => (pageLang === 'ar' ? dict[k].ar : dict[k].en);
  }, [pageLang]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!testId) return;
      try {
        const res = await axios.get(`/api/tests/${testId}/summary/`);
        setData(res.data as SummaryResponse);
      } catch {
        setData(null);
      }
    };
    fetchSummary();
  }, [testId]);

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex h-screen bg-white" dir={pageLang==='ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{t('title')}</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 mr-2">{t('translate')}</div>
              <select value={pageLang} onChange={e => setPageLang(e.target.value as PageLang)} className="border rounded px-2 py-1 text-sm">
                <option value="en">EN → AR</option>
                <option value="ar">AR → EN</option>
              </select>
            </div>
          </div>

          {data && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-500">{t('overallScore')}</div>
                  <div className="text-xl font-semibold">{data.overallPercent}%</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-500">{t('correctOutOfTotal')}</div>
                  <div className="text-xl font-semibold">{data.correctCount}/{data.total}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-500">{t('timeSpent')}</div>
                  <div className="text-xl font-semibold">{fmtTime(data.timeSpentSec)}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="text-xs text-gray-500">{t('attempts')}</div>
                  <div className="text-xl font-semibold">1</div>
                </div>
              </div>

              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">{t('qNo')}</th>
                      <th className="p-2 text-left">{t('yourAnswer')}</th>
                      <th className="p-2 text-left">{t('correctAnswer')}</th>
                      <th className="p-2 text-left">{t('score10')}</th>
                      <th className="p-2 text-left">{t('missedKeys')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, idx) => (
                      <tr key={r.questionId} className="border-t">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{r.yourAnswer === null || r.yourAnswer === undefined ? t('notAnswered') : String(r.yourAnswer)}</td>
                        <td className="p-2">{r.correctAnswer === null || r.correctAnswer === undefined ? '-' : String(r.correctAnswer)}</td>
                        <td className="p-2">{r.score10}</td>
                        <td className="p-2">{r.missedKeys && r.missedKeys.length ? r.missedKeys.join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 bg-teal-700 text-white rounded" onClick={() => navigate('/practice-test')}>
                  {t('backToPractice')}
                </button>
                <button className="px-4 py-2 border rounded" onClick={() => navigate('/practice-test')}>
                  {t('reviewWeakAreas')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeTestSummary;


