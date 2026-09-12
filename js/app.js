/* ============================================================
   Live Draft Program — app logic
   ============================================================ */

const STORAGE_KEY = 'live-draft-program:state';
const THEME_KEY = 'live-draft-program:theme';

let state = null;
let saveTimer = null;
let draggedId = null;
let presentIndex = 0;

/* ---------------- utilities ---------------- */

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------- markdown-lite renderer (for live preview) ---------------- */

function inlineFormat(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function renderMarkdownLite(raw) {
  if (!raw || !raw.trim()) {
    return '<p class="prose-empty">내용을 입력하면 여기에 실시간으로 표시됩니다.</p>';
  }
  const lines = raw.split('\n');
  let html = '';
  let listBuffer = [];
  let listType = null;
  let paraBuffer = [];

  function flushPara() {
    if (paraBuffer.length) {
      html += `<p>${paraBuffer.join(' ')}</p>`;
      paraBuffer = [];
    }
  }
  function flushList() {
    if (listBuffer.length) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      html += `<${tag}>${listBuffer.map((i) => `<li>${i}</li>`).join('')}</${tag}>`;
      listBuffer = [];
      listType = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (ulMatch) {
      flushPara();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(inlineFormat(ulMatch[1]));
    } else if (olMatch) {
      flushPara();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(inlineFormat(olMatch[1]));
    } else {
      flushList();
      paraBuffer.push(inlineFormat(line));
    }
  }
  flushPara();
  flushList();
  return html;
}

/* ---------------- seed / persistence ---------------- */

function seedState() {
  return {
    title: 'Live Draft Program',
    sections: [
      {
        id: uid(),
        title: '개요',
        content:
          '애플 스타일의 미니멀한 디자인과 실시간 인터랙션을 갖춘 **라이브 드래프트 에디터**입니다. 왼쪽에서 작성하면 오른쪽 프리뷰에 즉시 반영됩니다.',
      },
      {
        id: uid(),
        title: '핵심 기능',
        content:
          '- 좌우 분할 실시간 편집 및 프리뷰\n- 드래그 앤 드롭으로 섹션 순서 변경\n- 원클릭 `.md` 다운로드\n- 시연을 위한 프레젠테이션 포커스 모드\n- 공유 링크 생성',
      },
      {
        id: uid(),
        title: '다음 단계',
        content:
          '상단의 **+ 섹션 추가** 버튼으로 새 섹션을 만들고, 우측 상단의 [시연 모드] 버튼으로 발표를 시작해보세요.',
      },
    ],
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections)) return parsed;
    }
  } catch (e) {
    console.warn('로컬 저장소 로드 실패', e);
  }
  return null;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('로컬 저장소 저장 실패', e);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToStorage, 400);
}

function loadFromHash() {
  const hash = location.hash;
  if (!hash.startsWith('#d=')) return null;
  try {
    const encoded = hash.slice(3);
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);
    if (payload && Array.isArray(payload.sections)) {
      return {
        title: payload.title || 'Live Draft Program',
        sections: payload.sections.map((s) => ({
          id: s.id || uid(),
          title: s.title || '',
          content: s.content || '',
        })),
      };
    }
  } catch (e) {
    console.warn('공유 링크 파싱 실패', e);
  }
  return null;
}

/* ---------------- rendering: editor ---------------- */

function renderEditor() {
  const list = document.getElementById('sectionList');
  list.innerHTML = '';

  if (!state.sections.length) {
    list.innerHTML =
      '<div class="empty-state"><span class="empty-emoji">📝</span>섹션이 없습니다.<br/>+ 섹션 추가 버튼으로 시작해보세요.</div>';
    return;
  }

  state.sections.forEach((sec) => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.dataset.id = sec.id;
    card.innerHTML = `
      <div class="section-card-header">
        <span class="drag-handle">⋮⋮</span>
        <input class="section-title-input" value="${escapeHtml(sec.title)}" placeholder="섹션 제목" />
        <button class="icon-btn delete-btn" title="섹션 삭제" aria-label="섹션 삭제">🗑</button>
      </div>
      <textarea class="section-content-input" placeholder="내용을 입력하세요 (Markdown 지원: **굵게**, - 목록, [링크](url))">${escapeHtml(sec.content)}</textarea>
    `;

    const titleInput = card.querySelector('.section-title-input');
    const contentInput = card.querySelector('.section-content-input');

    titleInput.addEventListener('input', () => {
      sec.title = titleInput.value;
      renderPreview();
      scheduleSave();
    });
    contentInput.addEventListener('input', () => {
      sec.content = contentInput.value;
      renderPreview();
      scheduleSave();
    });
    card.querySelector('.delete-btn').addEventListener('click', () => deleteSection(sec.id));

    attachDragEvents(card, sec.id);
    list.appendChild(card);
  });
}

/* ---------------- drag & drop reordering ---------------- */

function attachDragEvents(card, id) {
  card.draggable = true;

  card.addEventListener('dragstart', (e) => {
    draggedId = id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.section-card').forEach((c) => c.classList.remove('drag-over'));
    draggedId = null;
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) card.classList.add('drag-over');
  });

  card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    if (draggedId && draggedId !== id) reorderSections(draggedId, id);
  });
}

function reorderSections(fromId, toId) {
  const fromIdx = state.sections.findIndex((s) => s.id === fromId);
  const toIdx = state.sections.findIndex((s) => s.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = state.sections.splice(fromIdx, 1);
  state.sections.splice(toIdx, 0, moved);
  renderEditor();
  renderPreview();
  scheduleSave();
}

/* ---------------- rendering: live preview ---------------- */

function renderPreview() {
  const area = document.getElementById('previewArea');
  area.innerHTML = '';

  const titleEl = document.createElement('div');
  titleEl.className = 'preview-doc-title';
  titleEl.textContent = state.title || '제목 없음';
  area.appendChild(titleEl);

  if (!state.sections.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-emoji">✨</span>내용을 추가하면 이곳에 실시간으로 프리뷰가 표시됩니다.';
    area.appendChild(empty);
    return;
  }

  state.sections.forEach((sec) => {
    const card = document.createElement('article');
    card.className = 'preview-card';
    card.innerHTML = `<h3>${escapeHtml(sec.title || '제목 없음')}</h3><div class="prose">${renderMarkdownLite(sec.content)}</div>`;
    area.appendChild(card);
  });
}

/* ---------------- section CRUD ---------------- */

function addSection() {
  state.sections.push({ id: uid(), title: '새 섹션', content: '' });
  renderEditor();
  renderPreview();
  scheduleSave();

  const cards = document.querySelectorAll('.section-card');
  const last = cards[cards.length - 1];
  if (last) {
    last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    last.querySelector('.section-title-input').select();
  }
}

function deleteSection(id) {
  state.sections = state.sections.filter((s) => s.id !== id);
  renderEditor();
  renderPreview();
  scheduleSave();
  showToast('섹션이 삭제되었습니다', '🗑');
}

/* ---------------- markdown export & download ---------------- */

function buildMarkdownDocument() {
  let md = `# ${state.title || '제목 없음'}\n\n`;
  state.sections.forEach((sec) => {
    md += `## ${sec.title || '제목 없음'}\n\n${sec.content || ''}\n\n`;
  });
  md += `---\n*Exported from Live Draft Program on ${new Date().toLocaleString('ko-KR')}*\n`;
  return md;
}

function downloadMarkdown() {
  const md = buildMarkdownDocument();
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (state.title || 'draft').replace(/[\\/:*?"<>|]/g, '').trim() || 'draft';
  a.href = url;
  a.download = `${safeName}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Markdown 파일이 다운로드되었습니다', '⬇');
}

/* ---------------- share link ---------------- */

function generateShareLink() {
  const payload = { title: state.title, sections: state.sections };
  let encoded;
  try {
    encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch (e) {
    showToast('공유 링크 생성에 실패했습니다', '⚠️');
    return;
  }
  const url = `${location.origin}${location.pathname}#d=${encoded}`;
  history.replaceState(null, '', `#d=${encoded}`);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('공유 링크가 클립보드에 복사되었습니다', '🔗'))
      .catch(() => window.prompt('아래 링크를 복사하세요:', url));
  } else {
    window.prompt('아래 링크를 복사하세요:', url);
  }
}

/* ---------------- theme ---------------- */

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {}
}

function initTheme() {
  let theme;
  try {
    theme = localStorage.getItem(THEME_KEY);
  } catch (e) {}
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
}

/* ---------------- presentation mode ---------------- */

function enterPresentMode() {
  if (!state.sections.length) {
    showToast('시연할 섹션이 없습니다', '⚠️');
    return;
  }
  presentIndex = 0;
  document.getElementById('presentOverlay').hidden = false;
  document.body.style.overflow = 'hidden';
  renderPresentSlide();
}

function exitPresentMode() {
  document.getElementById('presentOverlay').hidden = true;
  document.body.style.overflow = '';
}

function renderPresentSlide() {
  const sec = state.sections[presentIndex];
  const content = document.getElementById('presentContent');
  content.innerHTML = `
    <div class="present-eyebrow">${escapeHtml(state.title)} · ${presentIndex + 1} / ${state.sections.length}</div>
    <h1>${escapeHtml(sec.title || '제목 없음')}</h1>
    <div class="prose">${renderMarkdownLite(sec.content)}</div>
  `;
  document.getElementById('presentPrev').disabled = presentIndex === 0;
  document.getElementById('presentNext').disabled = presentIndex === state.sections.length - 1;
  renderPresentDots();
}

function renderPresentDots() {
  const dots = document.getElementById('presentDots');
  dots.innerHTML = '';
  state.sections.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === presentIndex ? ' active' : '');
    dot.addEventListener('click', () => {
      presentIndex = i;
      renderPresentSlide();
    });
    dots.appendChild(dot);
  });
}

function navigatePresent(delta) {
  const next = presentIndex + delta;
  if (next < 0 || next >= state.sections.length) return;
  presentIndex = next;
  renderPresentSlide();
}

function handleGlobalKeydown(e) {
  const overlay = document.getElementById('presentOverlay');
  if (overlay.hidden) return;
  if (e.key === 'Escape') exitPresentMode();
  else if (e.key === 'ArrowRight') navigatePresent(1);
  else if (e.key === 'ArrowLeft') navigatePresent(-1);
}

/* ---------------- toast ---------------- */

function showToast(message, icon = '✓') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-ico">${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 320);
  }, 2400);
}

/* ---------------- global bindings & init ---------------- */

function bindGlobalEvents() {
  document.getElementById('projectTitle').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
    scheduleSave();
  });
  document.getElementById('addSectionBtn').addEventListener('click', addSection);
  document.getElementById('downloadBtn').addEventListener('click', downloadMarkdown);
  document.getElementById('shareBtn').addEventListener('click', generateShareLink);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('presentBtn').addEventListener('click', enterPresentMode);
  document.getElementById('exitPresent').addEventListener('click', exitPresentMode);
  document.getElementById('presentPrev').addEventListener('click', () => navigatePresent(-1));
  document.getElementById('presentNext').addEventListener('click', () => navigatePresent(1));
  document.addEventListener('keydown', handleGlobalKeydown);
}

function init() {
  initTheme();

  const shared = loadFromHash();
  const stored = loadFromStorage();
  state = shared || stored || seedState();

  if (shared) {
    // clean the URL so subsequent local edits are not confused with the shared snapshot
    history.replaceState(null, '', location.pathname + location.search);
  }

  document.getElementById('projectTitle').value = state.title;

  renderEditor();
  renderPreview();
  bindGlobalEvents();

  if (shared) {
    showToast('공유된 드래프트를 불러왔습니다', '🔗');
    saveToStorage();
  }
}

document.addEventListener('DOMContentLoaded', init);
