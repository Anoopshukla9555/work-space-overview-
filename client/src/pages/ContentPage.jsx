import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Heart,
  Trash2,
  Edit3,
  Eye,
  File,
  StickyNote,
  PenLine,
} from 'lucide-react';


// ============================================================
// API CONFIG
// ============================================================

const API_BASE = '/api';


// ============================================================
// API HELPER
// ============================================================

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
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


// ============================================================
// SIZE FORMATTER
// ============================================================

function formatSize(bytes = 0) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}


// ============================================================
// PAGE CONFIG
// ============================================================

const PAGE_CONFIG = {
  shayari: {
    title: 'My Shayari',
    description: 'Create and save your Shayari and quotes.',
    singular: 'Shayari',
    icon: PenLine,
    color: 'purple',
    createText: 'Create Shayari',
  },

  notes: {
    title: 'Important Notes',
    description: 'Keep your important notes safe in one place.',
    singular: 'Note',
    icon: StickyNote,
    color: 'blue',
    createText: 'New Note',
  },

  documents: {
    title: 'My Documents',
    description: 'Store your personal documents securely.',
    singular: 'Document',
    icon: FileText,
    color: 'indigo',
    createText: 'Upload Document',
  },

  photos: {
    title: 'My Photos',
    description: 'Upload and manage your personal photos.',
    singular: 'Photo',
    icon: ImageIcon,
    color: 'pink',
    createText: 'Add Photo',
  },
};


// ============================================================
// GET TYPE FROM URL
// ============================================================

function getPageType() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes('/shayari')) {
    return 'shayari';
  }

  if (
    path.includes('/notes') ||
    path.includes('/important-notes')
  ) {
    return 'notes';
  }

  if (path.includes('/photos')) {
    return 'photos';
  }

  return 'documents';
}


// ============================================================
// CREATE / UPLOAD MODAL
// ============================================================

function CreateItemModal({
  open,
  kind,
  onClose,
  onCreated,
}) {
  const config = PAGE_CONFIG[kind] || PAGE_CONFIG.documents;

  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
  });

  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isUpload =
    kind === 'documents' ||
    kind === 'photos';


  // ----------------------------------------------------------
  // RESET MODAL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      title: '',
      content: '',
      category: '',
    });

    setFiles([]);
    setError('');
    setSaving(false);

    const timer = setTimeout(() => {
      if (!isUpload) {
        titleInputRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, kind, isUpload]);


  // ----------------------------------------------------------
  // CLOSE WITH ESC
  // ----------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event) {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, saving, onClose]);


  // ----------------------------------------------------------
  // FORM CHANGE
  // ----------------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // ----------------------------------------------------------
  // FILE CHANGE
  // ----------------------------------------------------------

  function handleFiles(event) {
    const selected = Array.from(
      event.target.files || []
    );

    setFiles(selected);
    setError('');
  }


  // ----------------------------------------------------------
  // REMOVE SELECTED FILE
  // ----------------------------------------------------------

  function removeFile(index) {
    setFiles((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }


  // ----------------------------------------------------------
  // SAVE TEXT ITEM
  // ----------------------------------------------------------

  async function saveTextItem() {
    if (!form.title.trim()) {
      setError('Please enter a title.');
      titleInputRef.current?.focus();
      return;
    }

    if (!form.content.trim()) {
      setError('Please enter some content.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await apiRequest('/items', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          type: kind,
          title: form.title.trim(),
          content: form.content,
          category: form.category.trim(),
        }),
      });

      const created =
        result?.item ||
        result?.data ||
        result;

      onCreated(created);
      onClose();

    } catch (error) {
      console.error('Save error:', error);

      setError(
        error?.message ||
        'Unable to save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }


  // ----------------------------------------------------------
  // UPLOAD FILES
  // ----------------------------------------------------------

  async function uploadFiles() {
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const uploadedItems = [];

      for (const file of files) {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('type', kind);
        formData.append('title', file.name);

        const result = await apiRequest(
          '/items/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        const created =
          result?.item ||
          result?.data ||
          result;

        uploadedItems.push(created);
      }

      uploadedItems.forEach((item) => {
        onCreated(item);
      });

      onClose();

    } catch (error) {
      console.error('Upload error:', error);

      setError(
        error?.message ||
        'Upload failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }


  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (isUpload) {
      await uploadFiles();
    } else {
      await saveTextItem();
    }
  }


  if (!open) {
    return null;
  }


  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >

      {/* =====================================================
          MODAL
      ====================================================== */}

      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-200
            px-6
            py-5
          "
        >

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              {isUpload
                ? kind === 'photos'
                  ? 'Add Photos'
                  : 'Upload Documents'
                : `Create ${config.singular}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isUpload
                ? 'Choose files from your computer.'
                : 'Add your content below.'}
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-lg
              p-2
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            <X size={22} />
          </button>

        </div>


        {/* ===================================================
            SCROLLABLE BODY
        ==================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto">

          <form
            id="content-page-form"
            onSubmit={handleSubmit}
            className="space-y-5 p-6"
          >

            {/* =================================================
                FILE UPLOAD
            ================================================== */}

            {isUpload ? (

              <>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  accept={
                    kind === 'photos'
                      ? 'image/jpeg,image/png,image/webp,image/gif'
                      : '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp'
                  }
                  onChange={handleFiles}
                />


                {/* CHOOSE FILES */}

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="
                    flex
                    w-full
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border-2
                    border-dashed
                    border-slate-300
                    p-8
                    text-center
                    transition
                    hover:border-indigo-500
                    hover:bg-indigo-50
                  "
                >

                  <Upload
                    size={34}
                    className="text-indigo-600"
                  />

                  <span className="mt-3 text-base font-semibold text-slate-800">
                    Choose files
                  </span>

                  <span className="mt-1 text-sm text-slate-500">
                    {kind === 'photos'
                      ? 'JPG, PNG, WEBP and GIF'
                      : 'PDF, DOC, DOCX, TXT and images'}
                  </span>

                </button>


                {/* =================================================
                    SELECTED FILES
                ================================================== */}

                {files.length > 0 && (

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <p className="text-sm font-semibold text-slate-800">
                        Selected files
                      </p>

                      <span className="text-xs text-slate-500">
                        {files.length}{' '}
                        {files.length === 1
                          ? 'file'
                          : 'files'}
                      </span>

                    </div>


                    {/* THIS LIST SCROLLS */}

                    <div
                      className="
                        max-h-56
                        space-y-2
                        overflow-y-auto
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-2
                      "
                    >

                      {files.map(
                        (file, index) => (

                          <div
                            key={`${file.name}-${index}`}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-lg
                              bg-white
                              px-3
                              py-2.5
                              shadow-sm
                            "
                          >

                            {kind === 'photos' ? (
                              <ImageIcon
                                size={18}
                                className="shrink-0 text-pink-500"
                              />
                            ) : (
                              <FileText
                                size={18}
                                className="shrink-0 text-indigo-500"
                              />
                            )}


                            <span
                              className="
                                min-w-0
                                flex-1
                                truncate
                                text-sm
                                text-slate-700
                              "
                              title={file.name}
                            >
                              {file.name}
                            </span>


                            <span className="shrink-0 text-xs text-slate-500">
                              {formatSize(file.size)}
                            </span>


                            <button
                              type="button"
                              onClick={() =>
                                removeFile(index)
                              }
                              className="
                                shrink-0
                                rounded
                                p-1
                                text-slate-400
                                hover:bg-red-50
                                hover:text-red-500
                              "
                            >
                              <X size={16} />
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

              </>

            ) : (

              /* =================================================
                 TEXT CONTENT
              ================================================== */

              <>

                {/* TITLE */}

                <div>

                  <label
                    htmlFor="content-title"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    Title
                  </label>

                  <input
                    ref={titleInputRef}
                    id="content-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    placeholder={
                      kind === 'shayari'
                        ? 'Enter Shayari title'
                        : 'Enter note title'
                    }
                    autoComplete="off"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      outline-none
                      transition
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  />

                </div>


                {/* CONTENT */}

                <div>

                  <label
                    htmlFor="content-text"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    Content
                  </label>

                  <textarea
                    id="content-text"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder={
                      kind === 'shayari'
                        ? 'Write your Shayari or quote here...'
                        : 'Write your important note here...'
                    }
                    rows={8}
                    className="
                      w-full
                      resize-y
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      outline-none
                      transition
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  />

                </div>


                {/* CATEGORY */}

                <div>

                  <label
                    htmlFor="content-category"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    Category
                  </label>

                  <input
                    id="content-category"
                    name="category"
                    type="text"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Optional category"
                    autoComplete="off"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      outline-none
                      transition
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                  />

                </div>

              </>

            )}


            {/* ERROR */}

            {error && (

              <div
                className="
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

          </form>

        </div>


        {/* ===================================================
            FOOTER
            THIS STAYS VISIBLE
        ==================================================== */}

        <div
          className="
            flex
            shrink-0
            justify-end
            gap-3
            border-t
            border-slate-200
            bg-white
            px-6
            py-4
          "
        >

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-xl
              border
              border-slate-300
              px-5
              py-2.5
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
          >
            Cancel
          </button>


          <button
            type="submit"
            form="content-page-form"
            disabled={
              saving ||
              (isUpload && files.length === 0)
            }
            className="
              rounded-xl
              bg-indigo-600
              px-5
              py-2.5
              font-semibold
              text-white
              transition
              hover:bg-indigo-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {saving
              ? 'Uploading...'
              : isUpload
                ? `Upload${
                    files.length > 0
                      ? ` (${files.length})`
                      : ''
                  }`
                : 'Save'}

          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// MAIN CONTENT PAGE
// ============================================================

export default function ContentPage() {

  const kind = getPageType();

  const config =
    PAGE_CONFIG[kind] ||
    PAGE_CONFIG.documents;

  const PageIcon = config.icon;


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [items, setItems] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectedItem, setSelectedItem] =
    useState(null);


  // ----------------------------------------------------------
  // LOAD ITEMS
  // ----------------------------------------------------------

  async function loadItems() {

    setLoading(true);
    setError('');

    try {

      const result = await apiRequest(
        `/items?type=${encodeURIComponent(kind)}`
      );

      const loadedItems =
        result?.items ||
        result?.data ||
        (Array.isArray(result)
          ? result
          : []);

      setItems(loadedItems);

    } catch (err) {

      console.error('Load items error:', err);

      setError(
        err?.message ||
        'Unable to load your items.'
      );

    } finally {

      setLoading(false);

    }
  }


  // ----------------------------------------------------------
  // LOAD WHEN PAGE OPENS
  // ----------------------------------------------------------

  useEffect(() => {
    loadItems();
  }, [kind]);


  // ----------------------------------------------------------
  // ADD NEW ITEM TO UI
  // ----------------------------------------------------------

  function handleCreated(item) {

    if (!item) {
      loadItems();
      return;
    }

    setItems((previous) => [
      item,
      ...previous,
    ]);
  }


  // ----------------------------------------------------------
  // FAVORITE
  // ----------------------------------------------------------

  async function toggleFavorite(item) {

    const itemId =
      item?._id ||
      item?.id;

    if (!itemId) {
      return;
    }

    try {

      const result = await apiRequest(
        `/items/${itemId}/favorite`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const updated =
        result?.item ||
        result?.data;

      setItems((previous) =>
        previous.map((current) =>
          String(current._id || current.id) ===
          String(itemId)
            ? updated || {
                ...current,
                favorite:
                  !current.favorite,
                isFavorite:
                  !current.isFavorite,
              }
            : current
        )
      );

    } catch (err) {

      console.error(
        'Favorite error:',
        err
      );

      setError(
        err?.message ||
        'Unable to update favorite.'
      );
    }
  }


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  async function deleteItem(item) {

    const itemId =
      item?._id ||
      item?.id;

    if (!itemId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${item.title || item.name || 'this item'}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      await apiRequest(
        `/items/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      setItems((previous) =>
        previous.filter(
          (current) =>
            String(current._id || current.id) !==
            String(itemId)
        )
      );

    } catch (err) {

      console.error(
        'Delete error:',
        err
      );

      setError(
        err?.message ||
        'Unable to delete item.'
      );
    }
  }


  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const filteredItems = useMemo(() => {

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {

      const text = [
        item.title,
        item.name,
        item.content,
        item.category,
        item.originalName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });

  }, [items, search]);


  // ----------------------------------------------------------
  // ITEM TITLE
  // ----------------------------------------------------------

  function getItemTitle(item) {
    return (
      item.title ||
      item.name ||
      item.originalName ||
      'Untitled'
    );
  }


  // ----------------------------------------------------------
  // ITEM TYPE ICON
  // ----------------------------------------------------------

  function getItemIcon() {

    if (kind === 'photos') {
      return ImageIcon;
    }

    if (kind === 'shayari') {
      return PenLine;
    }

    if (kind === 'notes') {
      return StickyNote;
    }

    return FileText;
  }


  const ItemIcon = getItemIcon();


  // ----------------------------------------------------------
  // PHOTO URL
  // ----------------------------------------------------------

  function getPhotoUrl(item) {

    return (
      item.url ||
      item.fileUrl ||
      item.fileURL ||
      item.path ||
      item.filePath ||
      ''
    );
  }


  // ----------------------------------------------------------
  // OPEN ITEM
  // ----------------------------------------------------------

  function openItem(item) {

    const url = getPhotoUrl(item);

    if (
      (kind === 'photos' ||
        kind === 'documents') &&
      url
    ) {

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );

      return;
    }

    setSelectedItem(item);
  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="min-h-full">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-indigo-100
              text-indigo-600
            "
          >
            <PageIcon size={24} />
          </div>


          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              {config.title}
            </h1>

            <p className="text-sm text-slate-500">
              {config.description}
            </p>

          </div>

        </div>


        {/* CREATE BUTTON */}

        <button
          type="button"
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-indigo-600
            px-5
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-indigo-700
          "
        >

          <Plus size={19} />

          {config.createText}

        </button>

      </div>


      {/* ======================================================
          SEARCH
      ======================================================= */}

      <div className="mb-6">

        <div className="relative">

          <Search
            size={19}
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
              setSearch(event.target.value)
            }
            placeholder={
              kind === 'shayari'
                ? 'Search my shayari...'
                : kind === 'notes'
                  ? 'Search my notes...'
                  : kind === 'photos'
                    ? 'Search my photos...'
                    : 'Search my documents...'
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              py-3
              pl-11
              pr-4
              outline-none
              transition
              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-100
            "
          />

        </div>

      </div>


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div
          className="
            mb-5
            flex
            items-center
            justify-between
            rounded-xl
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
        >

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError('')}
            className="ml-4"
          >
            <X size={18} />
          </button>

        </div>

      )}


      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading ? (

        <div
          className="
            grid
            min-h-[300px]
            place-items-center
            rounded-2xl
            border
            border-slate-200
            bg-white
          "
        >

          <div className="text-center">

            <div
              className="
                mx-auto
                mb-3
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-slate-200
                border-t-indigo-600
              "
            />

            <p className="text-sm text-slate-500">
              Loading...
            </p>

          </div>

        </div>

      ) : filteredItems.length === 0 ? (

        /* ====================================================
           EMPTY STATE
        ===================================================== */

        <div
          className="
            flex
            min-h-[330px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-white
            px-6
            text-center
          "
        >

          <div
            className="
              mb-4
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-indigo-50
              text-indigo-600
            "
          >
            <ItemIcon size={28} />
          </div>


          <h2 className="text-lg font-semibold text-slate-900">
            {search
              ? 'No results found'
              : `No ${config.title.toLowerCase()} yet`}
          </h2>


          <p className="mt-2 max-w-md text-sm text-slate-500">

            {search
              ? 'Try a different search term.'
              : kind === 'photos'
                ? 'Upload your first photo to create your gallery.'
                : kind === 'documents'
                  ? 'Upload your first document to get started.'
                  : kind === 'shayari'
                    ? 'Create your first Shayari or quote.'
                    : 'Create your first important note.'}

          </p>


          {!search && (

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-5
                py-2.5
                font-semibold
                text-white
                hover:bg-indigo-700
              "
            >

              <Plus size={18} />

              {config.createText}

            </button>

          )}

        </div>

      ) : (

        /* ====================================================
           ITEMS
        ===================================================== */

        <div
          className={
            kind === 'photos'
              ? `
                grid
                grid-cols-2
                gap-4
                sm:grid-cols-3
                lg:grid-cols-4
              `
              : `
                grid
                gap-4
              `
          }
        >

          {filteredItems.map((item, index) => {

            const itemId =
              item._id ||
              item.id ||
              index;

            const favorite =
              item.favorite ??
              item.isFavorite ??
              false;

            const title =
              getItemTitle(item);

            const photoUrl =
              getPhotoUrl(item);


            /* ================================================
               PHOTO CARD
            ================================================= */

            if (kind === 'photos') {

              return (

                <div
                  key={itemId}
                  className="
                    group
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      openItem(item)
                    }
                    className="
                      block
                      aspect-square
                      w-full
                      overflow-hidden
                      bg-slate-100
                    "
                  >

                    {photoUrl ? (

                      <img
                        src={photoUrl}
                        alt={title}
                        className="
                          h-full
                          w-full
                          object-cover
                          transition
                          duration-300
                          group-hover:scale-105
                        "
                      />

                    ) : (

                      <div
                        className="
                          flex
                          h-full
                          w-full
                          items-center
                          justify-center
                          text-slate-400
                        "
                      >
                        <ImageIcon size={40} />
                      </div>

                    )}

                  </button>


                  <div className="p-3">

                    <p
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-slate-800
                      "
                      title={title}
                    >
                      {title}
                    </p>


                    <div className="mt-2 flex items-center justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite(item)
                        }
                        className={`
                          rounded-lg
                          p-2
                          transition
                          ${
                            favorite
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }
                        `}
                      >

                        <Heart
                          size={18}
                          fill={
                            favorite
                              ? 'currentColor'
                              : 'none'
                          }
                        />

                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          deleteItem(item)
                        }
                        className="
                          rounded-lg
                          p-2
                          text-slate-400
                          hover:bg-red-50
                          hover:text-red-500
                        "
                      >

                        <Trash2 size={18} />

                      </button>

                    </div>

                  </div>

                </div>

              );
            }


            /* ================================================
               NORMAL CARD
            ================================================= */

            return (

              <div
                key={itemId}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  hover:shadow-md
                "
              >

                <div className="flex items-start gap-4">

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

                    <ItemIcon size={22} />

                  </div>


                  <div className="min-w-0 flex-1">

                    <h3
                      className="
                        truncate
                        font-semibold
                        text-slate-900
                      "
                      title={title}
                    >
                      {title}
                    </h3>


                    {item.category && (

                      <span className="mt-1 inline-block text-xs text-indigo-600">
                        {item.category}
                      </span>

                    )}


                    {item.content && (

                      <p
                        className="
                          mt-2
                          line-clamp-3
                          whitespace-pre-wrap
                          text-sm
                          leading-6
                          text-slate-500
                        "
                      >
                        {item.content}
                      </p>

                    )}


                    {item.size && (

                      <p className="mt-2 text-xs text-slate-400">
                        {formatSize(item.size)}
                      </p>

                    )}

                  </div>

                </div>


                {/* CARD ACTIONS */}

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-between
                    border-t
                    border-slate-100
                    pt-3
                  "
                >

                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        openItem(item)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-slate-600
                        hover:bg-slate-100
                      "
                    >

                      <Eye size={17} />

                      Open

                    </button>


                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                      }}
                      className="
                        rounded-lg
                        p-2
                        text-slate-400
                        hover:bg-slate-100
                        hover:text-slate-700
                      "
                      title="View"
                    >

                      <Edit3 size={17} />

                    </button>

                  </div>


                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(item)
                      }
                      className={`
                        rounded-lg
                        p-2
                        ${
                          favorite
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }
                      `}
                      title="Favorite"
                    >

                      <Heart
                        size={18}
                        fill={
                          favorite
                            ? 'currentColor'
                            : 'none'
                        }
                      />

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        deleteItem(item)
                      }
                      className="
                        rounded-lg
                        p-2
                        text-slate-400
                        hover:bg-red-50
                        hover:text-red-500
                      "
                      title="Delete"
                    >

                      <Trash2 size={18} />

                    </button>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      )}


      {/* ======================================================
          CREATE MODAL
      ======================================================= */}

      <CreateItemModal
        open={modalOpen}
        kind={kind}
        onClose={() => {
          if (!loading) {
            setModalOpen(false);
          }
        }}
        onCreated={handleCreated}
      />


      {/* ======================================================
          VIEW TEXT ITEM MODAL
      ======================================================= */}

      {selectedItem && (
        <div
          className="
            fixed
            inset-0
            z-40
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedItem(null);
            }
          }}
        >

          <div
            className="
              max-h-[85vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
          >

            <div className="mb-5 flex items-start justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {getItemTitle(selectedItem)}
                </h2>

                {selectedItem.category && (

                  <p className="mt-1 text-sm text-indigo-600">
                    {selectedItem.category}
                  </p>

                )}

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-500
                  hover:bg-slate-100
                "
              >

                <X size={20} />

              </button>

            </div>


            {selectedItem.content && (

              <div
                className="
                  whitespace-pre-wrap
                  rounded-xl
                  bg-slate-50
                  p-5
                  text-sm
                  leading-7
                  text-slate-700
                "
              >
                {selectedItem.content}
              </div>

            )}

          </div>

        </div>
      )}

    </div>
  );
}