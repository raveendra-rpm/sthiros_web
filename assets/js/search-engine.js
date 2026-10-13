/**
 * Sthiros Site-Wide Search Engine (Vanilla JavaScript)
 * -----------------------------------------------------
 * 100% Zero External Dependencies (No CDN, No Frameworks).
 * Section-Level Deep Linking, Fast In-Memory Scoring, Safe DOM Highlighting,
 * Keyboard Navigation (Up/Down/Enter/Esc), Accessibility & Mobile Support.
 */

(function () {
  'use strict';

  // Global cached search index
  let searchIndex = null;
  let isIndexLoading = false;
  let indexLoadCallbacks = [];

  // Helper to escape regex special characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get current page filename (e.g. "about.html" or "index.html")
  function getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.split('/').pop().split('#')[0].split('?')[0];
    return page || 'index.html';
  }

  // Determine relative path to assets based on current location
  function getBaseAssetPath() {
    return '';
  }

  // Load search index (once per session)
  function loadSearchIndex(callback) {
    if (searchIndex && searchIndex.length > 0) {
      if (callback) callback(searchIndex);
      return;
    }

    if (callback) {
      indexLoadCallbacks.push(callback);
    }

    if (isIndexLoading) return;
    isIndexLoading = true;

    // Check if preloaded in window.__sthirosSearchIndex (e.g. via search-index-data.js)
    if (window.__sthirosSearchIndex && Array.isArray(window.__sthirosSearchIndex)) {
      searchIndex = window.__sthirosSearchIndex;
      isIndexLoading = false;
      flushCallbacks(searchIndex);
      return;
    }

    // Otherwise, fetch static JSON index
    const indexPath = getBaseAssetPath() + 'assets/data/search-index.json';
    fetch(indexPath)
      .then(res => {
        if (!res.ok) throw new Error('Search index fetch failed: ' + res.status);
        return res.json();
      })
      .then(data => {
        searchIndex = data;
        isIndexLoading = false;
        flushCallbacks(searchIndex);
      })
      .catch(err => {
        console.warn('Could not fetch search-index.json, trying fallback script...', err);
        // Fallback: Dynamically inject search-index-data.js
        const script = document.createElement('script');
        script.src = getBaseAssetPath() + 'assets/js/search-index-data.js';
        script.onload = () => {
          searchIndex = window.__sthirosSearchIndex || [];
          isIndexLoading = false;
          flushCallbacks(searchIndex);
        };
        script.onerror = () => {
          console.error('Failed to load search index fallback.');
          searchIndex = [];
          isIndexLoading = false;
          flushCallbacks(searchIndex);
        };
        document.head.appendChild(script);
      });
  }

  function flushCallbacks(data) {
    while (indexLoadCallbacks.length > 0) {
      const cb = indexLoadCallbacks.shift();
      try { cb(data); } catch (e) { console.error(e); }
    }
  }

  // Relevance Scoring Engine
  function rankRecords(records, query, currentPage) {
    const rawQuery = query.trim();
    if (rawQuery.length < 2) return [];

    const q = rawQuery.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return [];

    const scoredResults = [];

    for (let i = 0; i < records.length; i++) {
      const item = records[i];
      const pageTitle = (item.pageTitle || '').toLowerCase();
      const sectionTitle = (item.sectionTitle || '').toLowerCase();
      const content = (item.content || '').toLowerCase();

      let score = 0;

      // 1. Exact Page Title Match
      if (pageTitle === q) {
        score += 150;
      } else if (pageTitle.startsWith(q)) {
        score += 85;
      } else if (pageTitle.includes(q)) {
        score += 55;
      }

      // 2. Exact Section Heading Match
      if (sectionTitle === q) {
        score += 130;
      } else if (sectionTitle.startsWith(q)) {
        score += 75;
      } else if (sectionTitle.includes(q)) {
        score += 50;
      }

      // 3. Multi-word checks in section title
      let allWordsInHeading = true;
      let someWordsInHeading = 0;
      for (let w = 0; w < words.length; w++) {
        if (sectionTitle.includes(words[w])) {
          score += 18;
          someWordsInHeading++;
        } else {
          allWordsInHeading = false;
        }
      }
      if (allWordsInHeading && words.length > 1) {
        score += 45;
      }

      // 4. Exact phrase match in content
      if (content.includes(q)) {
        score += 35;
      }

      // 5. Individual word matches in content
      let contentHits = 0;
      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        if (content.includes(word)) {
          contentHits++;
          score += 6;
          // Word boundary check
          try {
            const boundaryRegex = new RegExp('\\b' + escapeRegExp(word) + '\\b', 'i');
            if (boundaryRegex.test(content)) {
              score += 6;
            }
          } catch (_) {}
        }
      }

      // Discard if multi-word query and neither heading nor content has reasonable match
      if (words.length > 1 && contentHits === 0 && someWordsInHeading === 0) {
        continue;
      }

      if (score <= 0) continue;

      // Tie-breaker: prefer current page when scores are close
      if (item.url && item.url.startsWith(currentPage)) {
        score += 2;
      }

      scoredResults.push({ item, score });
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);

    // Return top 8 results
    return scoredResults.slice(0, 8).map(res => res.item);
  }

  // Safe DOM Snippet Highlighting (Prevents XSS completely)
  function createSnippetElement(content, queryWords) {
    const snippetEl = document.createElement('p');
    snippetEl.className = 'search-result-snippet';

    if (!content) {
      snippetEl.textContent = '';
      return snippetEl;
    }

    const lowerContent = content.toLowerCase();
    let bestIndex = -1;

    // Find earliest match of any query word
    for (let i = 0; i < queryWords.length; i++) {
      const idx = lowerContent.indexOf(queryWords[i].toLowerCase());
      if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
        bestIndex = idx;
      }
    }

    let start = 0;
    let end = content.length;

    if (bestIndex !== -1) {
      start = Math.max(0, bestIndex - 40);
      end = Math.min(content.length, bestIndex + 120);
    } else {
      end = Math.min(content.length, 140);
    }

    let snippetText = content.substring(start, end).trim();
    if (start > 0) snippetText = '...' + snippetText;
    if (end < content.length) snippetText = snippetText + '...';

    // Safely highlight query terms using DOM elements
    if (queryWords.length === 0) {
      snippetEl.textContent = snippetText;
      return snippetEl;
    }

    try {
      const escapedWords = queryWords.map(escapeRegExp).filter(w => w.length > 0).join('|');
      if (!escapedWords) {
        snippetEl.textContent = snippetText;
        return snippetEl;
      }

      const regex = new RegExp('(' + escapedWords + ')', 'gi');
      const parts = snippetText.split(regex);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (regex.test(part)) {
          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = part;
          snippetEl.appendChild(mark);
        } else {
          snippetEl.appendChild(document.createTextNode(part));
        }
      }
    } catch (_) {
      snippetEl.textContent = snippetText;
    }

    return snippetEl;
  }

  // In-Page Highlighting Engine
  function clearPageHighlights() {
    document.querySelectorAll('mark.sthiros-search-match').forEach(m => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      }
    });
    document.querySelectorAll('.search-target-highlight').forEach(el => {
      el.classList.remove('search-target-highlight');
    });
  }

  function highlightInElement(container, query) {
    if (!container || !query) return;
    const rawTerms = query.trim().split(/\s+/).filter(t => t.length >= 2);
    if (rawTerms.length === 0) return;

    const terms = [query.trim(), ...rawTerms];
    const uniqueTerms = Array.from(new Set(terms.map(t => t.toLowerCase())))
      .sort((a, b) => b.length - a.length);

    const escaped = uniqueTerms.map(escapeRegExp).join('|');
    if (!escaped) return;
    const regex = new RegExp('(' + escaped + ')', 'gi');

    function walk(node) {
      if (!node) return;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'MARK', 'HEADER', 'FOOTER', 'NAV'].includes(node.nodeName)) return;
      if (node.closest && (
        node.closest('.site-header') ||
        node.closest('.menu-overlay') ||
        node.closest('.site-footer') ||
        node.closest('.site-search-dropdown')
      )) return;

      if (node.nodeType === 3) {
        const text = node.nodeValue;
        if (!text || !text.trim()) return;

        regex.lastIndex = 0;
        if (regex.test(text)) {
          regex.lastIndex = 0;
          const frag = document.createDocumentFragment();
          let lastIdx = 0;
          let match;
          while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIdx) {
              frag.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
            }
            const mark = document.createElement('mark');
            mark.className = 'sthiros-search-match is-active';
            mark.textContent = match[0];
            frag.appendChild(mark);
            lastIdx = regex.lastIndex;
          }
          if (lastIdx < text.length) {
            frag.appendChild(document.createTextNode(text.substring(lastIdx)));
          }
          if (node.parentNode) {
            node.parentNode.replaceChild(frag, node);
          }
        }
      } else if (node.nodeType === 1 && node.childNodes && !(node.tagName === 'SELECT' || node.tagName === 'TEXTAREA')) {
        const children = Array.from(node.childNodes);
        for (let i = 0; i < children.length; i++) {
          walk(children[i]);
        }
      }
    }

    walk(container);
  }

  function scrollTargetIntoExactView(targetEl, firstMatch) {
    if (!targetEl && !firstMatch) return;

    const lenisInstance = window.lenis || (typeof lenis !== 'undefined' ? lenis : null);

    function refreshLayout() {
      if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
      }
      if (lenisInstance && typeof lenisInstance.resize === 'function') {
        lenisInstance.resize();
      }
    }

    refreshLayout();

    let dest = targetEl || firstMatch;
    let offset = window.innerWidth <= 768 ? -75 : -85;

    if (dest.tagName !== 'SECTION' && firstMatch) {
      const parentCard = firstMatch.closest('.expert-card, .team-card, .problem-item, .vm-card, .rcs-card');
      if (parentCard) {
        dest = parentCard;
        offset = window.innerWidth <= 768 ? -80 : -95;
      }
    }

    function doScroll(immediate = false) {
      refreshLayout();

      if (lenisInstance && typeof lenisInstance.scrollTo === 'function') {
        lenisInstance.scrollTo(dest, {
          offset: offset,
          immediate: immediate,
          duration: immediate ? 0 : 0.9,
          lock: false
        });
      } else {
        const y = dest.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: Math.max(0, y), behavior: immediate ? 'auto' : 'smooth' });
      }
    }

    doScroll(false);

    setTimeout(() => {
      refreshLayout();
      const rect = dest.getBoundingClientRect();
      if (Math.abs(rect.top - Math.abs(offset)) > 35) {
        doScroll(false);
      }
    }, 450);

    setTimeout(() => {
      refreshLayout();
      const rect = dest.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.7) {
        doScroll(false);
      }
    }, 950);
  }

  function highlightTargetResult(anchor, query) {
    clearPageHighlights();
    if (!query) return;

    let targetEl = null;
    if (anchor) {
      try {
        targetEl = document.getElementById(anchor) ||
          document.querySelector('.' + CSS.escape(anchor)) ||
          document.querySelector(`[name="${anchor}"]`);
      } catch (_) {
        targetEl = document.getElementById(anchor) || document.querySelector(`[name="${anchor}"]`);
      }
    }

    if (targetEl) {
      let parent = targetEl.parentElement;
      while (parent && parent !== document.body) {
        if (parent.classList) {
          if (parent.classList.contains('problem-item') ||
              parent.classList.contains('team-card') ||
              parent.classList.contains('vm-card')) {
            parent.classList.add('active');
          }
          if (parent.classList.contains('problems-container') && parent.id) {
            const tabBtn = document.querySelector(`.segment-btn[data-target="${parent.id}"]`);
            if (tabBtn && !tabBtn.classList.contains('active')) {
              tabBtn.click();
            }
          }
        }
        if (parent.tagName === 'DETAILS') {
          parent.setAttribute('open', '');
        }
        parent = parent.parentElement;
      }

      if (targetEl.classList.contains('problem-item') || targetEl.classList.contains('team-card')) {
        targetEl.classList.add('active');
      }

      targetEl.classList.add('search-target-highlight');
      highlightInElement(targetEl, query);
    } else {
      const mainEl = document.querySelector('main') || document.body;
      highlightInElement(mainEl, query);
    }

    const firstMatch = document.querySelector('mark.sthiros-search-match');

    if (firstMatch) {
      const expertCard = firstMatch.closest('.expert-card');
      if (expertCard) {
        expertCard.classList.add('search-target-highlight');
        if (typeof expertCard.click === 'function') {
          expertCard.click();
        }
      }
      const teamCard = firstMatch.closest('.team-card');
      if (teamCard) {
        teamCard.classList.add('active');
        teamCard.classList.add('search-target-highlight');
      }
      const problemItem = firstMatch.closest('.problem-item');
      if (problemItem) {
        problemItem.classList.add('active');
        problemItem.classList.add('search-target-highlight');
      }
    }

    scrollTargetIntoExactView(targetEl, firstMatch);

    setTimeout(() => {
      document.querySelectorAll('.search-target-highlight').forEach(el => {
        el.classList.remove('search-target-highlight');
      });
    }, 7000);
  }

  function clearAllSearchState() {
    try {
      sessionStorage.removeItem('sthiros_search_highlight');
    } catch (_) {}
    try {
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        let changed = false;
        if (url.searchParams.has('searchHighlight')) {
          url.searchParams.delete('searchHighlight');
          changed = true;
        }
        if (url.searchParams.has('q')) {
          url.searchParams.delete('q');
          changed = true;
        }
        if (changed) {
          const cleanSearch = url.searchParams.toString();
          const cleanUrl = url.pathname + (cleanSearch ? '?' + cleanSearch : '') + url.hash;
          window.history.replaceState(null, '', cleanUrl);
        }
      }
    } catch (_) {}
  }

  // Smooth scroll to anchor on current page
  function navigateToSection(targetUrl, query) {
    const currentPage = getCurrentPageName();
    const [targetPage, anchor] = targetUrl.split('#');

    // Close any open mobile drawer
    const overlay = document.getElementById('menuOverlay');
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      const lenisInstance = window.lenis || (typeof lenis !== 'undefined' ? lenis : null);
      if (lenisInstance) lenisInstance.start();
      const menuContent = overlay.querySelector('.menu-content');
      if (menuContent) menuContent.classList.remove('search-active');
    }

    if (query) {
      try {
        sessionStorage.setItem('sthiros_search_highlight', query);
      } catch (_) {}
    }

    // If on the same page
    if (!targetPage || targetPage === currentPage) {
      if (anchor) {
        history.pushState(null, '', '#' + anchor);
        highlightTargetResult(anchor, query);
        return;
      } else {
        if (query) {
          highlightTargetResult(null, query);
        }
        return;
      }
    }

    // Navigating to target page
    const sep = targetPage.includes('?') ? '&' : '?';
    const targetWithHighlight = targetPage +
      (query ? `${sep}searchHighlight=${encodeURIComponent(query)}` : '') +
      (anchor ? '#' + anchor : '');
    window.location.href = targetWithHighlight;
  }

  // Initialize Search Instance (works for both Desktop and Mobile containers)
  function setupSearchComponent(inputEl, btnEl, containerEl) {
    if (!inputEl || !containerEl) return;

    // Accessibility attributes
    inputEl.setAttribute('role', 'combobox');
    inputEl.setAttribute('aria-autocomplete', 'list');
    inputEl.setAttribute('aria-expanded', 'false');
    inputEl.setAttribute('autocomplete', 'off');

    const isMobileSearch = containerEl.classList.contains('mobile-menu-search');
    const menuContent = isMobileSearch ? containerEl.closest('.menu-content') : null;
    const menuOverlay = isMobileSearch ? containerEl.closest('.menu-overlay') : null;

    function activateMobileSearch() {
      if (isMobileSearch && menuContent && window.innerWidth <= 1024) {
        menuContent.classList.add('search-active');
        if (menuOverlay) {
          menuOverlay.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }

    function deactivateMobileSearch() {
      if (isMobileSearch && menuContent) {
        menuContent.classList.remove('search-active');
      }
    }

    // Container-scoped clear button
    let clearBtn = containerEl.querySelector('.header-search-clear');
    if (!clearBtn && btnEl) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'header-search-clear';
      clearBtn.setAttribute('aria-label', 'Clear search');
      clearBtn.innerHTML = '&#x2715;';
      clearBtn.style.display = 'none';
      containerEl.insertBefore(clearBtn, btnEl);
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        inputEl.value = '';
        clearBtn.style.display = 'none';
        closeDropdown();
        clearPageHighlights();
        clearAllSearchState();
        document.querySelectorAll('.header-search-input, .mobile-menu-search-input').forEach(inp => {
          if (inp !== inputEl && inp.value !== '') inp.value = '';
        });
        document.querySelectorAll('.header-search-clear').forEach(cb => {
          if (cb !== clearBtn) cb.style.display = 'none';
        });
        inputEl.focus();
      });
    }

    // Create or select Dropdown container
    let dropdown = containerEl.querySelector('.site-search-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'site-search-dropdown';
      dropdown.setAttribute('role', 'listbox');
      dropdown.setAttribute('aria-label', 'Search results');
      dropdown.setAttribute('data-lenis-prevent', 'true');
      containerEl.appendChild(dropdown);
    } else {
      dropdown.setAttribute('data-lenis-prevent', 'true');
    }

    // Prevent Lenis from intercepting dropdown scroll & ensure direct wheel scroll
    dropdown.addEventListener('wheel', (e) => {
      e.stopPropagation();
      const atTop = dropdown.scrollTop === 0 && e.deltaY < 0;
      const atBottom = dropdown.scrollHeight - dropdown.scrollTop <= dropdown.clientHeight + 1 && e.deltaY > 0;
      if (!atTop && !atBottom) {
        dropdown.scrollTop += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    dropdown.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });

    let activeResultIndex = -1;
    let currentResults = [];
    let debounceTimer = null;

    function openDropdown() {
      dropdown.classList.add('is-open');
      inputEl.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      dropdown.classList.remove('is-open');
      inputEl.setAttribute('aria-expanded', 'false');
      activeResultIndex = -1;
      updateActiveItem();
    }

    function updateActiveItem() {
      const items = dropdown.querySelectorAll('.search-result-item');
      items.forEach((item, idx) => {
        if (idx === activeResultIndex) {
          item.classList.add('is-selected');
          item.setAttribute('aria-selected', 'true');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('is-selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
    }

    function renderResults(results, query) {
      dropdown.textContent = '';
      currentResults = results;
      activeResultIndex = -1;

      const words = query.trim().split(/\s+/).filter(w => w.length > 0);
      const currentPage = getCurrentPageName();

      if (results.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'search-empty-state';
        emptyEl.textContent = `No matching results found for "${query}"`;
        dropdown.appendChild(emptyEl);
        openDropdown();
        return;
      }

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const [targetPage] = res.url.split('#');
        const isCurrentPage = (!targetPage || targetPage === currentPage);

        const itemEl = document.createElement('div');
        itemEl.className = 'search-result-item' + (isCurrentPage ? ' is-current-page' : '');
        itemEl.setAttribute('role', 'option');
        itemEl.setAttribute('aria-selected', 'false');
        itemEl.setAttribute('tabindex', '-1');

        // Header: Title & Page Badge
        const headerEl = document.createElement('div');
        headerEl.className = 'search-result-header';

        const titleEl = document.createElement('h4');
        titleEl.className = 'search-result-title';
        titleEl.textContent = res.sectionTitle || res.pageTitle;
        headerEl.appendChild(titleEl);

        const badgeEl = document.createElement('span');
        badgeEl.className = 'search-result-badge' + (isCurrentPage ? ' is-current-page-badge' : '');
        let badgeText = res.pageTitle.split('—')[0].split('-')[0].trim();
        badgeEl.textContent = isCurrentPage ? `${badgeText} • THIS PAGE` : badgeText;
        headerEl.appendChild(badgeEl);

        itemEl.appendChild(headerEl);

        // Snippet with safe query highlighting
        const snippetEl = createSnippetElement(res.content, words);
        itemEl.appendChild(snippetEl);

        // Path breadcrumb
        const pathEl = document.createElement('div');
        pathEl.className = 'search-result-path';
        pathEl.textContent = res.url;
        itemEl.appendChild(pathEl);

        // Click Handler
        itemEl.addEventListener('click', (e) => {
          e.preventDefault();
          closeDropdown();
          deactivateMobileSearch();
          navigateToSection(res.url, query);
        });

        dropdown.appendChild(itemEl);
      }

      openDropdown();
    }

    // Input Event with Debounce
    inputEl.addEventListener('input', (e) => {
      const val = e.target.value;
      const query = val.trim();
      if (clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';

      if (query.length === 0) {
        clearAllSearchState();
        clearPageHighlights();
        closeDropdown();
        document.querySelectorAll('.header-search-input, .mobile-menu-search-input').forEach(inp => {
          if (inp !== inputEl && inp.value !== '') inp.value = '';
        });
        document.querySelectorAll('.header-search-clear').forEach(cb => {
          if (cb !== clearBtn) cb.style.display = 'none';
        });
        return;
      }

      activateMobileSearch();

      clearTimeout(debounceTimer);
      if (query.length < 2) {
        closeDropdown();
        return;
      }

      debounceTimer = setTimeout(() => {
        loadSearchIndex((index) => {
          const currentPage = getCurrentPageName();
          const results = rankRecords(index, query, currentPage);
          renderResults(results, query);
        });
      }, 200);
    });

    // Preload index on input focus
    inputEl.addEventListener('focus', () => {
      activateMobileSearch();
      loadSearchIndex();
      if (inputEl.value.trim().length >= 2) {
        openDropdown();
      }
    });

    inputEl.addEventListener('click', () => {
      activateMobileSearch();
    });

    containerEl.addEventListener('click', (e) => {
      activateMobileSearch();
      if (e.target !== inputEl && !e.target.closest('.search-result-item') && !e.target.closest('.header-search-clear')) {
        inputEl.focus();
      }
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        if (!containerEl.contains(document.activeElement)) {
          if (!dropdown.classList.contains('is-open') || inputEl.value.trim() === '') {
            closeDropdown();
            deactivateMobileSearch();
          }
        }
      }, 200);
    });

    // Keyboard Navigation
    inputEl.addEventListener('keydown', (e) => {
      if (!dropdown.classList.contains('is-open')) {
        if (e.key === 'Enter' && inputEl.value.trim().length >= 2) {
          e.preventDefault();
          loadSearchIndex((index) => {
            const results = rankRecords(index, inputEl.value.trim(), getCurrentPageName());
            if (results.length > 0) {
              deactivateMobileSearch();
              navigateToSection(results[0].url, inputEl.value.trim());
            }
          });
        }
        return;
      }

      const items = dropdown.querySelectorAll('.search-result-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeResultIndex = (activeResultIndex + 1) % items.length;
        updateActiveItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeResultIndex = activeResultIndex <= 0 ? items.length - 1 : activeResultIndex - 1;
        updateActiveItem();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentQuery = inputEl.value.trim();
        if (activeResultIndex >= 0 && currentResults[activeResultIndex]) {
          closeDropdown();
          deactivateMobileSearch();
          navigateToSection(currentResults[activeResultIndex].url, currentQuery);
        } else if (currentResults.length > 0) {
          closeDropdown();
          deactivateMobileSearch();
          navigateToSection(currentResults[0].url, currentQuery);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        inputEl.blur();
        deactivateMobileSearch();
      }
    });

    // Search button click
    if (btnEl) {
      btnEl.addEventListener('click', (e) => {
        e.preventDefault();
        const query = inputEl.value.trim();
        if (query.length >= 2) {
          loadSearchIndex((index) => {
            const results = rankRecords(index, query, getCurrentPageName());
            if (results.length > 0) {
              closeDropdown();
              deactivateMobileSearch();
              navigateToSection(results[0].url, query);
            }
          });
        }
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!containerEl.contains(e.target)) {
        closeDropdown();
        deactivateMobileSearch();
      }
    });

    if (isMobileSearch) {
      window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
          deactivateMobileSearch();
        }
      });
    }
  }

  function checkUrlSearchHighlight() {
    const urlParams = new URLSearchParams(window.location.search);
    let query = urlParams.get('searchHighlight') || urlParams.get('q');
    if (!query) {
      try {
        query = sessionStorage.getItem('sthiros_search_highlight');
      } catch (_) {}
    }
    // Always clear session storage once checked
    try {
      sessionStorage.removeItem('sthiros_search_highlight');
    } catch (_) {}

    const hash = window.location.hash ? window.location.hash.substring(1) : null;

    if (query) {
      const desktopInput = document.querySelector('.header-search-input');
      const mobileInput = document.querySelector('.mobile-menu-search-input');
      if (desktopInput && !desktopInput.value) desktopInput.value = query;
      if (mobileInput && !mobileInput.value) mobileInput.value = query;

      document.querySelectorAll('.header-search-clear').forEach(cb => cb.style.display = 'block');

      // Clean query parameter from URL address bar without reloading
      clearAllSearchState();

      // If preloader is active, immediately dismiss it so user arrives directly at target section
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.remove();
        document.body.classList.remove('loading');
        if (typeof triggerBoot === 'function') {
          triggerBoot();
        }
      }

      const runHighlight = () => {
        highlightTargetResult(hash, query);
      };

      if (document.readyState === 'complete') {
        setTimeout(runHighlight, 120);
      } else {
        window.addEventListener('load', () => setTimeout(runHighlight, 120), { once: true });
        setTimeout(runHighlight, 450);
      }
    }
  }

  // Initialize on DOM Ready
  function init() {
    // 1. Desktop Header Search
    const desktopInput = document.querySelector('.header-search-input');
    const desktopBtn = document.querySelector('.header-search-btn');
    const desktopContainer = document.querySelector('.header-search');
    if (desktopInput && desktopContainer) {
      setupSearchComponent(desktopInput, desktopBtn, desktopContainer);
    }

    // 2. Mobile Drawer Search
    const mobileInput = document.querySelector('.mobile-menu-search-input');
    const mobileBtn = document.querySelector('.mobile-menu-search-btn');
    const mobileContainer = document.querySelector('.mobile-menu-search');
    if (mobileInput && mobileContainer) {
      setupSearchComponent(mobileInput, mobileBtn, mobileContainer);
    }

    // 3. Highlight check from URL
    checkUrlSearchHighlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
