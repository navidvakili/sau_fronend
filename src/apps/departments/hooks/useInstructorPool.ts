// ============================================================
// useInstructorPool — فهرست اساتید مدعو/هیات‌علمی قابل‌انتخاب برای «دیالوگ اساتید مدعو شاخص
// گروه» + جست‌وجوی نرمال‌شدهٔ فارسی روی آن. فهرست سنگین است (تا ۵۰۰ نفر)، پس فقط وقتی دیالوگ
// واقعاً باز می‌شود بارگذاری می‌شود، نه هنگام باز شدن ویرایشگر.
// ============================================================

import { useMemo, useState } from 'react';
import type { PersonItem } from '@/src/shared-types';
import { normalizePersian } from '@/src/shared-utils/formatters';
import { fetchPeople } from '../../people/api';

interface UseInstructorPoolOptions {
  /** فراخوانی‌شده وقتی بارگذاری فهرست با خطا مواجه شود (برای نمایش toast صفحه) */
  onError?: (message: string) => void;
}

export function useInstructorPool(options: UseInstructorPoolOptions = {}) {
  const { onError } = options;
  const [pool, setPool] = useState<PersonItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const ensureLoaded = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const [faculty, visiting] = await Promise.all([
        fetchPeople({ type: 'faculty_member', per_page: 500 }),
        fetchPeople({ type: 'visiting_professor', per_page: 500 }),
      ]);
      const seen = new Set<number>();
      const merged: PersonItem[] = [];
      [...(faculty?.data || []), ...(visiting?.data || [])].forEach((p) => {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      });
      setPool(merged);
      setLoaded(true);
    } catch (err: any) {
      onError?.(err.message || 'خطا در بارگذاری فهرست اساتید');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => setSearch('');

  /** فهرست فیلترشده بر اساس جست‌وجو — روی نام/عنوان/تخصص/گروه/سمت. با normalizePersian
   *  یکسان‌سازی می‌شود تا تفاوت رسم‌الخط عربی/فارسی (ي/ی، ك/ک)، نیم‌فاصله و ارقام فارسی/عربی
   *  جلوی تطبیق را نگیرد (مثلاً جست‌وجوی «كامپيوتر» با «کامپیوتر» ثبت‌شده مطابقت یابد) */
  const filteredPool = useMemo(() => {
    const query = normalizePersian(search);
    if (query === '') return pool;
    return pool.filter((p) => {
      const haystack = normalizePersian(
        [p.title, p.firstName, p.lastName, p.specialization, p.department, p.position].filter(Boolean).join(' ')
      );
      return haystack.includes(query);
    });
  }, [pool, search]);

  return { pool, loaded, loading, search, setSearch, resetSearch, ensureLoaded, filteredPool };
}
