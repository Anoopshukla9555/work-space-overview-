import React, { useEffect, useMemo, useState } from 'react';

import {
  Search,
  Upload,
  FileText,
  Image as ImageIcon,
  PenLine,
  StickyNote,
  Heart,
  Trash2,
  Settings,
  Home,
  Plus,
  Moon,
  LogOut,
  HardDrive,
  Menu,
  X,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

/* ============================================================
   STORAGE
============================================================ */

const STORAGE_LIMIT_GB = 20;

const STORAGE_LIMIT_BYTES =
  STORAGE_LIMIT_GB * 1024 * 1024 * 1024;

/* ============================================================
   API
============================================================ */

async function apiRequest(url, options = {}) {
  const response = await fetch(`/api${url}`, {
    credentials: 'include',
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* ============================================================
   HELPERS
============================================================ */

function formatBytes(bytes = 0) {
  if (!bytes || bytes <= 0) return '0 B';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
}

function getItemSize(item) {
  return Number(
    item?.size ??
      item?.fileSize ??
      item?.file_size ??
      0
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ==========================================================
     STATE
  ========================================================== */

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  /* ==========================================================
     LOAD CONTENT
  ========================================================== */

  async function loadDashboardData() {
    setLoading(true);
    setError('');

    try {
      const types = [
        'documents',
        'photos',
        'shayari',
        'notes',
      ];

      const responses = await Promise.all(
        types.map(async (type) => {
          try {
            const result = await apiRequest(
              `/items?type=${type}`
            );

            return (
              result?.items ||
              result?.data ||
              (Array.isArray(result) ? result : [])
            );
          } catch (err) {
            console.error(
              `Unable to load ${type}:`,
              err
            );

            return [];
          }
        })
      );

      const combined = responses.flat();

      /* Remove duplicates */
      const unique = [];
      const seen = new Set();

      for (const item of combined) {
        const id =
          item?._id ||
          item?.id ||
          `${item?.type}-${item?.title}-${item?.createdAt}`;

        if (!seen.has(String(id))) {
          seen.add(String(id));
          unique.push(item);
        }
      }

      /* Newest first */
      unique.sort(
        (a, b) =>
          new Date(b?.createdAt || 0) -
          new Date(a?.createdAt || 0)
      );

      setItems(unique);
    } catch (err) {
      console.error('Dashboard error:', err);

      setError(
        err?.message ||
          'Unable to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  /* ==========================================================
     STORAGE
  ========================================================== */

  const usedBytes = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + getItemSize(item),
      0
    );
  }, [items]);

  const usedGB =
    usedBytes /
    (1024 * 1024 * 1024);

  const storagePercentage = Math.min(
    100,
    (usedBytes /
      STORAGE_LIMIT_BYTES) *
      100
  );

  const remainingBytes = Math.max(
    0,
    STORAGE_LIMIT_BYTES - usedBytes
  );

  /* ==========================================================
     COUNTS
  ========================================================== */

  const documentCount = items.filter(
    (item) =>
      item?.type === 'documents' ||
      item?.type === 'document'
  ).length;

  const photoCount = items.filter(
    (item) =>
      item?.type === 'photos' ||
      item?.type === 'photo'
  ).length;

  const shayariCount = items.filter(
    (item) =>
      item?.type === 'shayari' ||
      item?.type === 'post'
  ).length;

  const noteCount = items.filter(
    (item) =>
      item?.type === 'notes' ||
      item?.type === 'note'
  ).length;

  /* ==========================================================
     SEARCH
  ========================================================== */

  const filteredItems = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      const text = [
        item?.title,
        item?.name,
        item?.content,
        item?.category,
        item?.originalName,
        item?.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });
  }, [items, search]);

  const recentItems =
    filteredItems.slice(0, 5);

  /* ==========================================================
     USER
  ========================================================== */

  const userName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const firstLetter =
    userName.charAt(0).toUpperCase();

  /* ==========================================================
     LOGOUT
  ========================================================== */

  async function handleLogout() {
    try {
      await apiRequest(
        '/auth/logout',
        {
          method: 'POST',
        }
      );
    } catch (err) {
      console.error(
        'Logout error:',
        err
      );
    } finally {
      navigate('/login');
      window.location.reload();
    }
  }

  /* ==========================================================
     QUICK ACTIONS
  ========================================================== */

  function openUpload() {
    navigate('/app/documents');
  }

  /* ==========================================================
     ITEM HELPERS
  ========================================================== */

  function getItemIcon(item) {
    const type =
      item?.type?.toLowerCase();

    if (
      type === 'photos' ||
      type === 'photo'
    ) {
      return ImageIcon;
    }

    if (
      type === 'shayari' ||
      type === 'post'
    ) {
      return PenLine;
    }

    if (
      type === 'notes' ||
      type === 'note'
    ) {
      return StickyNote;
    }

    return FileText;
  }

  function getItemType(item) {
    const type =
      item?.type?.toLowerCase();

    if (
      type === 'photos' ||
      type === 'photo'
    ) {
      return 'Photos';
    }

    if (
      type === 'shayari' ||
      type === 'post'
    ) {
      return 'Shayari & Posts';
    }

    if (
      type === 'notes' ||
      type === 'note'
    ) {
      return 'Important Notes';
    }

    return 'Documents';
  }

  function getItemTitle(item) {
    return (
      item?.title ||
      item?.name ||
      item?.originalName ||
      'Untitled'
    );
  }

  function getItemLink(item) {
    const type =
      item?.type?.toLowerCase();

    if (
      type === 'photos' ||
      type === 'photo'
    ) {
      return '/app/photos';
    }

    if (
      type === 'shayari' ||
      type === 'post'
    ) {
      return '/app/shayari';
    }

    if (
      type === 'notes' ||
      type === 'note'
    ) {
      return '/app/notes';
    }

    return '/app/documents';
  }

  /* ==========================================================
     SIDEBAR
  ========================================================== */

  const navigation = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/app',
    },
    {
      label: 'Documents',
      icon: FileText,
      path: '/app/documents',
    },
    {
      label: 'Shayari & Posts',
      icon: PenLine,
      path: '/app/shayari',
    },
    {
      label: 'Photos',
      icon: ImageIcon,
      path: '/app/photos',
    },
    {
      label: 'Important Notes',
      icon: StickyNote,
      path: '/app/notes',
    },
    {
      label: 'Favorites',
      icon: Heart,
      path: '/app/favorites',
    },
    {
      label: 'Recently Deleted',
      icon: Trash2,
      path: '/app/deleted',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/app/settings',
    },
  ];

  function Sidebar() {
    return (
      <aside
        className="
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[270px]
          flex-col
          border-r
          border-slate-200
          bg-white
        "
      >
        {/* LOGO */}

        <div
          className="
            flex
            h-[82px]
            items-center
            gap-3
            border-b
            border-slate-200
            px-6
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-br
              from-indigo-500
              to-purple-600
              text-white
              shadow-sm
            "
          >
            <HardDrive size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              My Personal Space
            </h2>

            <p className="text-xs text-slate-500">
              Your private space
            </p>
          </div>

          {/* Mobile close */}

          <button
            type="button"
            onClick={() =>
              setMobileMenu(false)
            }
            className="
              ml-auto
              rounded-lg
              p-2
              text-slate-500
              hover:bg-slate-100
              lg:hidden
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.path === '/app'
                  ? window.location.pathname ===
                    '/app'
                  : window.location.pathname.startsWith(
                      item.path
                    );

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${
                      active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
                    }
                  `}
                >
                  <Icon size={19} />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* SIDEBAR BOTTOM */}

        <div
          className="
            border-t
            border-slate-200
            p-4
          "
        >
          <div
            className="
              rounded-xl
              bg-indigo-50
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <HardDrive
                size={17}
                className="text-indigo-600"
              />

              <span className="text-sm font-semibold text-indigo-900">
                20 GB Storage
              </span>
            </div>

            <p className="mt-1 text-xs text-indigo-700">
              Store your personal content securely.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ======================================================
          MOBILE SIDEBAR
      ====================================================== */}

      {mobileMenu && (
        <>
          <div
            className="
              fixed
              inset-0
              z-40
              bg-black/30
              lg:hidden
            "
            onClick={() =>
              setMobileMenu(false)
            }
          />

          <div className="lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:ml-[270px]">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            flex
            h-[82px]
            items-center
            justify-between
            border-b
            border-slate-200
            bg-white/95
            px-5
            backdrop-blur
            sm:px-8
          "
        >
          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setMobileMenu(true)
            }
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              p-3
              text-slate-600
              hover:bg-slate-50
              lg:hidden
            "
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* DARK MODE */}

            <button
              type="button"
              title="Theme"
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                text-slate-600
                transition
                hover:bg-slate-50
              "
            >
              <Moon size={19} />
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                font-medium
                text-slate-700
                transition
                hover:bg-slate-50
              "
            >
              <LogOut size={18} />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <main
          className="
            mx-auto
            max-w-[1450px]
            px-5
            py-8
            sm:px-8
            lg:px-10
          "
        >
          {/* ==================================================
              WELCOME
          ================================================== */}

          <section className="mb-7">
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-orange-500
                  text-2xl
                  font-bold
                  text-white
                  shadow-sm
                "
              >
                {firstLetter}
              </div>

              <div>
                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    text-slate-900
                  "
                >
                  Welcome, {userName} 👋
                </h1>

                <p className="mt-1 text-slate-500">
                  Manage your personal space in one place.
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <section className="mb-7">
            <div className="relative">
              <Search
                size={21}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search documents, photos, notes..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-12
                  py-4
                  text-sm
                  outline-none
                  transition
                  focus:border-indigo-500
                  focus:ring-2
                  focus:ring-indigo-100
                "
              />
            </div>
          </section>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <section
            className="
              mb-8
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {/* DOCUMENT */}

            <button
              type="button"
              onClick={openUpload}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                px-5
                py-3.5
                font-medium
                text-slate-700
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-indigo-300
                hover:bg-indigo-50
                hover:text-indigo-700
              "
            >
              <Upload size={19} />
              Upload Document
            </button>

            {/* SHAYARI */}

            <Link
              to="/app/shayari"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                px-5
                py-3.5
                font-medium
                text-slate-700
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-indigo-300
                hover:bg-indigo-50
                hover:text-indigo-700
              "
            >
              <PenLine size={19} />
              Create Shayari
            </Link>

            {/* NOTE */}

            <Link
              to="/app/notes"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                px-5
                py-3.5
                font-medium
                text-slate-700
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-indigo-300
                hover:bg-indigo-50
                hover:text-indigo-700
              "
            >
              <Plus size={19} />
              New Note
            </Link>

            {/* PHOTO */}

            <Link
              to="/app/photos"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white
                px-5
                py-3.5
                font-medium
                text-slate-700
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-indigo-300
                hover:bg-indigo-50
                hover:text-indigo-700
              "
            >
              <ImageIcon size={19} />
              Add Photo
            </Link>
          </section>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="
                mb-6
                rounded-xl
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          {/* ==================================================
              STATISTICS
          ================================================== */}

          <section
            className="
              mb-8
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {/* DOCUMENTS */}

            <Link
              to="/app/documents"
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                    text-indigo-600
                  "
                >
                  <FileText size={23} />
                </div>

                <span className="text-3xl font-bold text-slate-900">
                  {documentCount}
                </span>
              </div>

              <p className="mt-5 font-semibold text-slate-800">
                Documents
              </p>

              <p className="mt-1 text-sm text-slate-500">
                PDF, DOC, DOCX, TXT
              </p>
            </Link>

            {/* SHAYARI */}

            <Link
              to="/app/shayari"
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-purple-50
                    text-purple-600
                  "
                >
                  <PenLine size={23} />
                </div>

                <span className="text-3xl font-bold text-slate-900">
                  {shayariCount}
                </span>
              </div>

              <p className="mt-5 font-semibold text-slate-800">
                Shayari & Posts
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your saved Shayari and quotes
              </p>
            </Link>

            {/* PHOTOS */}

            <Link
              to="/app/photos"
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-pink-50
                    text-pink-600
                  "
                >
                  <ImageIcon size={23} />
                </div>

                <span className="text-3xl font-bold text-slate-900">
                  {photoCount}
                </span>
              </div>

              <p className="mt-5 font-semibold text-slate-800">
                Photos
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your personal photo gallery
              </p>
            </Link>

            {/* NOTES */}

            <Link
              to="/app/notes"
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-md
              "
            >
              <div className="flex items-center justify-between">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                  "
                >
                  <StickyNote size={23} />
                </div>

                <span className="text-3xl font-bold text-slate-900">
                  {noteCount}
                </span>
              </div>

              <p className="mt-5 font-semibold text-slate-800">
                Important Notes
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your important information
              </p>
            </Link>
          </section>

          {/* ==================================================
              DOCUMENT STORE
          ================================================== */}

          <section className="mb-8">
            <Link
              to="/app/documents"
              className="
                inline-flex
                items-center
                gap-4
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <FileText size={24} />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  Document Store
                </p>

                <p className="text-sm text-slate-500">
                  {documentCount}{' '}
                  {documentCount === 1
                    ? 'item'
                    : 'items'}
                </p>
              </div>
            </Link>
          </section>

          {/* ==================================================
              RECENT + STORAGE
          ================================================== */}

          <section
            className="
              grid
              gap-6
              lg:grid-cols-[1.6fr_1fr]
            "
          >
            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest documents, photos,
                  posts and notes.
                </p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading...
                </div>
              ) : recentItems.length === 0 ? (
                <div
                  className="
                    flex
                    min-h-[190px]
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-dashed
                    border-slate-300
                    text-center
                  "
                >
                  <FileText
                    size={34}
                    className="text-slate-300"
                  />

                  <p className="mt-3 font-medium text-slate-700">
                    Nothing here yet
                  </p>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    Documents, posts, photos and
                    notes you add will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentItems.map(
                    (item, index) => {
                      const ItemIcon =
                        getItemIcon(item);

                      const title =
                        getItemTitle(item);

                      return (
                        <Link
                          key={
                            item?._id ||
                            item?.id ||
                            index
                          }
                          to={getItemLink(item)}
                          className="
                            flex
                            items-center
                            gap-4
                            rounded-xl
                            border
                            border-slate-100
                            p-3
                            transition
                            hover:bg-slate-50
                          "
                        >
                          <div
                            className="
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-indigo-50
                              text-indigo-600
                            "
                          >
                            <ItemIcon size={21} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-800
                              "
                            >
                              {title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {getItemType(item)}
                            </p>
                          </div>

                          {getItemSize(item) >
                            0 && (
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatBytes(
                                getItemSize(item)
                              )}
                            </span>
                          )}
                        </Link>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                STORAGE
            ================================================= */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                    text-indigo-600
                  "
                >
                  <HardDrive size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Storage
                  </h2>

                  <p className="text-sm text-slate-500">
                    Personal space
                  </p>
                </div>
              </div>

              {/* PROGRESS */}

              <div className="mt-7">
                <div
                  className="
                    h-3
                    overflow-hidden
                    rounded-full
                    bg-slate-200
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-indigo-600
                      transition-all
                      duration-500
                    "
                    style={{
                      width: `${storagePercentage}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {formatBytes(
                      usedBytes
                    )}{' '}
                    used
                  </span>

                  <span className="text-sm font-medium text-slate-500">
                    {STORAGE_LIMIT_GB} GB
                  </span>
                </div>
              </div>

              {/* STORAGE DETAILS */}

              <div
                className="
                  mt-6
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <div
                  className="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <p className="text-xs text-slate-500">
                    Used
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {usedGB.toFixed(2)} GB
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-slate-50
                    p-4
                  "
                >
                  <p className="text-xs text-slate-500">
                    Available
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatBytes(
                      remainingBytes
                    )}
                  </p>
                </div>
              </div>

              {/* STORAGE LIMIT */}

              <div
                className="
                  mt-5
                  rounded-xl
                  border
                  border-indigo-100
                  bg-indigo-50
                  p-4
                "
              >
                <p className="text-sm font-semibold text-indigo-900">
                  20 GB Personal Storage
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-700">
                  Store your documents, photos,
                  Shayari and important notes
                  within your storage limit.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}