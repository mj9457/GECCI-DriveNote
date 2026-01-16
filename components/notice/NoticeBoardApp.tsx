'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { Bell, LogOut, Pencil, Check, Trash2, User as UserIcon, Users, X } from 'lucide-react';

import HeaderMenu from '@/components/shared/HeaderMenu';
import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import { useVacationAuth } from '@/components/vacation/hooks/useVacationAuth';
import { useRealtimeNoticePosts } from '@/components/notice/hooks/useRealtimeNoticePosts';
import { useNoticeActions } from '@/components/notice/hooks/useNoticeActions';
import NoticeBell from '@/components/notice/NoticeBell';
import FAB from '@/components/vehicle/layout/FAB';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
};

const parseTags = (raw: string) => {
  const parts = raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

export default function NoticeBoardApp() {
  const router = useRouter();
  const { user, isApproved, loading, loginError, handleLogin, handleLogout } = useVacationAuth();

  const { posts } = useRealtimeNoticePosts(!!user && isApproved);
  const { createPost, updatePost, deletePost, addLike } = useNoticeActions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAuthorEmail, setEditingAuthorEmail] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [openLikesId, setOpenLikesId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    tags: '',
  });
  const [search, setSearch] = useState('');

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((post) => {
      const haystack = [post.title, post.content, post.authorName, ...(post.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [posts, search]);

  const resetToCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setEditingAuthorEmail(undefined);
    setForm({ title: '', content: '', tags: '' });
  };

  const openCreateModal = () => {
    resetToCreateForm();
    setIsFormOpen(true);
  };

  const openPostModal = (post: {
    id: string;
    title: string;
    content: string;
    authorEmail?: string;
    tags?: string[];
    isConfirmed?: boolean;
  }) => {
    if (!user) return;
    const canEdit =
      !!post.authorEmail && !!user.email && post.authorEmail === user.email && post.isConfirmed;
    setFormMode(canEdit ? 'edit' : 'view');
    setEditingId(post.id);
    setEditingAuthorEmail(post.authorEmail);
    setForm({ title: post.title, content: post.content, tags: (post.tags || []).join(', ') });
    setOpenLikesId(null);
    setIsFormOpen(true);
  };

  const onSubmit = async () => {
    if (!user) return;
    if (submitting) return;

    const title = form.title.trim();
    const content = form.content.trim();
    const tags = parseTags(form.tags);

    if (!title || !content) {
      toast.error('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    if (formMode === 'view') {
      toast.error('수정 권한이 없습니다.');
      return;
    }

    if (formMode === 'edit') {
      const canEdit = !!editingAuthorEmail && !!user.email && editingAuthorEmail === user.email;
      if (!canEdit) {
        toast.error('수정 권한이 없습니다.');
        return;
      }
      if (!currentConfirmed) {
        toast.error('확인 체크 후 수정할 수 있습니다.');
        return;
      }
      if (!editingId) {
        toast.error('수정 대상이 없습니다.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        await createPost({
          title,
          content,
          tags,
          authorName: user.displayName || user.email || '익명',
          authorEmail: user.email,
          createdAt: new Date().toISOString(),
        });
        toast.success('게시글이 등록되었습니다.');
        setIsFormOpen(false);
        resetToCreateForm();
        return;
      }

      if (formMode === 'edit' && editingId) {
        await updatePost(editingId, {
          title,
          content,
          tags,
          updatedAt: new Date().toISOString(),
        });
        toast.success('수정되었습니다.');
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('저장에 실패했습니다.', { description: '잠시 후 다시 시도해 주세요.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm('정말 이 게시글을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deletePost(id);
      toast.success('삭제되었습니다.');
      setIsFormOpen(false);
      resetToCreateForm();
    } catch (error) {
      console.error(error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const isReadOnly = formMode === 'view';
  const userEmail = user?.email;
  const canManageEditing = !!editingAuthorEmail && !!userEmail && editingAuthorEmail === userEmail;
  const currentUserId = user?.uid || user?.email || '';
  const currentUserName = user?.displayName || user?.email || '익명';
  const currentPost = useMemo(
    () => (editingId ? posts.find((post) => post.id === editingId) : undefined),
    [editingId, posts]
  );
  const currentConfirmed = useMemo(() => {
    if (!currentPost) return false;
    const likes = currentPost.likes || [];
    return (
      (!!currentUserId && likes.some((like) => like.uid === currentUserId)) ||
      (!!userEmail && likes.some((like) => like.email === userEmail))
    );
  }, [currentPost, currentUserId, userEmail]);

  const seenPostIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);
  const seenStorageKey = `notice_notified_${currentUserId || 'guest'}`;

  useEffect(() => {
    if (!user || !isApproved) return;

    if (!hasInitialized.current) {
      try {
        const raw = window.localStorage.getItem(seenStorageKey);
        if (raw) {
          const stored = JSON.parse(raw) as string[];
          stored.forEach((id) => seenPostIds.current.add(id));
        }
      } catch {
        /* ignore */
      }
      posts.forEach((post) => seenPostIds.current.add(post.id));
      try {
        window.localStorage.setItem(
          seenStorageKey,
          JSON.stringify(Array.from(seenPostIds.current))
        );
      } catch {
        /* ignore */
      }
      hasInitialized.current = true;
      return;
    }

    const newPosts = posts.filter((post) => !seenPostIds.current.has(post.id));
    newPosts.forEach((post) => {
      toast(`새로운 공지: ${post.title}`);
      seenPostIds.current.add(post.id);
    });
    if (newPosts.length > 0) {
      try {
        window.localStorage.setItem(
          seenStorageKey,
          JSON.stringify(Array.from(seenPostIds.current))
        );
      } catch {
        /* ignore */
      }
    }
  }, [posts, user, isApproved]);

  const onConfirmPost = async (post: {
    id: string;
    likes?: { uid: string; name: string; email?: string }[];
  }) => {
    if (!currentUserId || !user) return;
    const userEmail = user.email;

    const existing =
      post.likes?.find((like) => like.uid === currentUserId) ||
      post.likes?.find((like) => !!userEmail && like.email === userEmail);

    try {
      if (existing) return;
      await addLike(post.id, {
        uid: currentUserId,
        name: currentUserName,
        email: userEmail,
      });
    } catch (error) {
      console.error(error);
      toast.error('확인 처리에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (!isApproved) {
    return <UnauthorizedScreen email={user.email || user.uid} onLogout={handleLogout} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />

      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2">
        <header
          className="
            bg-white text-gray-800
            px-3 sm:px-4 md:px-6 py-3 sm:py-4
            flex flex-wrap items-center justify-between
            min-[721px]:flex-nowrap
            z-30 shadow-sm relative
          "
        >
          <div className="flex items-center gap-2 order-1">
            <div className="bg-rose-600 text-white w-11 h-11 rounded-lg flex items-center justify-center">
              <Bell />
            </div>
            <h1 className="font-bold text-base sm:text-lg md:text-xl">공지 게시판</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 order-2">
            <HeaderMenu />
            <NoticeBell
              enabled={!!user && isApproved}
              userId={currentUserId}
              userEmail={userEmail}
            />
            <div className="relative flex items-center">
              <div
                className="
                  inline-flex items-center
                  gap-0 min-[721px]:gap-2
                  text-xs sm:text-sm
                  bg-gray-50
                  px-2 min-[721px]:px-3 py-1.5
                  rounded-full border border-gray-300
                  min-[721px]:max-w-[170px]
                  cursor-pointer hover:bg-rose-50 hover:border-rose-400
                "
                onClick={() => router.push('/staff')}
              >
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 truncate hidden min-[721px]:block">
                  {user.displayName || user.email}
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[14px] px-2 py-1 rounded-md shadow-lg z-50">
                로그아웃
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto px-3 sm:px-4 md:px-6 py-4">
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 내용, 작성자, 태그로 검색"
              className="w-full h-11 rounded-full border border-gray-300 bg-white px-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          {filteredPosts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              {search.trim().length > 0
                ? '검색 결과가 없습니다.'
                : '아직 등록된 게시글이 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {filteredPosts.map((post) => {
                const canManage =
                  !!post.authorEmail && !!user.email && post.authorEmail === user.email;
                const createdLabel = formatDateTime(post.createdAt);
                const subtitle = `${post.authorName} · ${createdLabel}`;

                const likes = post.likes || [];
                const likeCount = likes.length;
                const hasConfirmed =
                  likes.some((like) => like.uid === currentUserId) ||
                  likes.some((like) => !!user.email && like.email === user.email);

                const openDetails = () =>
                  openPostModal({
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    authorEmail: post.authorEmail,
                    tags: post.tags,
                    isConfirmed: hasConfirmed,
                  });

                return (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={openDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDetails();
                      }
                    }}
                    className="relative text-left bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 py-4 sm:py-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                          {post.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
                            <Pencil className="w-3 h-3" />내 글
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-700 whitespace-pre-line break-words">
                      {post.content}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={`${post.id}-${tag}`}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasConfirmed) return;
                          onConfirmPost(post);
                        }}
                        disabled={hasConfirmed}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
                          hasConfirmed
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-rose-200 hover:text-rose-600'
                        }`}
                        aria-pressed={hasConfirmed}
                      >
                        <Check className="w-3.5 h-3.5" />
                        확인 {likeCount}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenLikesId((prev) => (prev === post.id ? null : post.id));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-500 hover:border-rose-200 hover:text-rose-600"
                        aria-label="확인한 사람 보기"
                      >
                        <Users className="w-3.5 h-3.5" />
                        사람 보기
                      </button>
                    </div>
                    {openLikesId === post.id && (
                      <div className="absolute right-4 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-lg z-20">
                        <div className="text-[11px] text-gray-500 mb-1">확인한 사람</div>
                        {likes.length === 0 ? (
                          <div className="text-xs text-gray-400">아직 없습니다.</div>
                        ) : (
                          <ul className="max-h-32 overflow-auto text-xs text-gray-700">
                            {likes.map((like) => (
                              <li key={`${post.id}-${like.uid}`} className="py-0.5">
                                {like.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {post.updatedAt && (
                      <p className="mt-2 text-[11px] text-gray-400">
                        수정됨 · {formatDateTime(post.updatedAt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <FAB visible={!isFormOpen} onClick={openCreateModal} />
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsFormOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
            <div className="w-full sm:max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-rose-600 p-2 rounded-lg text-white">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-gray-900">
                      {formMode === 'create'
                        ? '새 공지 작성'
                        : formMode === 'edit'
                          ? '공지 수정'
                          : '공지 상세'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formMode === 'view'
                        ? '게시글 내용을 확인할 수 있습니다.'
                        : '작성 후 저장하면 즉시 게시됩니다.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-auto">
                <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">제목 *</span>
                      <input
                        value={form.title}
                        disabled={isReadOnly}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="h-11 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="공지 제목을 입력하세요."
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">내용 *</span>
                      <textarea
                        value={form.content}
                        disabled={isReadOnly}
                        onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                        className="min-h-90 rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="공지 내용을 입력하세요."
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">태그</span>
                      <input
                        value={form.tags}
                        disabled={isReadOnly}
                        onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                        className="h-11 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="예: 공지, 전산, 회의"
                      />
                      <span className="text-[11px] text-gray-400">
                        쉼표(,)로 구분해 입력하세요.
                      </span>
                    </label>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs sm:text-sm text-gray-500">
                    <span>작성자: {user.displayName || user.email}</span>
                    <div className="flex items-center gap-2">
                      {formMode !== 'create' && editingId && !currentConfirmed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentPost) onConfirmPost(currentPost);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:bg-rose-50 hover:border-rose-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                          확인 체크
                        </button>
                      )}
                      {formMode === 'view' &&
                        !!editingId &&
                        canManageEditing &&
                        currentConfirmed && (
                          <button
                            type="button"
                            disabled={!isReadOnly}
                            onClick={() => setFormMode('edit')}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs sm:text-sm ${
                              isReadOnly
                                ? 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            수정하기
                          </button>
                        )}
                      {formMode === 'edit' && editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsFormOpen(false);
                            resetToCreateForm();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm text-gray-500 hover:bg-gray-50"
                        >
                          새 글 작성
                        </button>
                      )}
                      {formMode !== 'create' && editingId && canManageEditing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingId) onDelete(editingId);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    {!isReadOnly && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={onSubmit}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                      >
                        {submitting
                          ? '저장 중...'
                          : formMode === 'edit'
                            ? '수정 저장'
                            : '공지 등록'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
