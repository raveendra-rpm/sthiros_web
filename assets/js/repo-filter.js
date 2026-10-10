/**
 * Sthiros - Repository Page Interactive Filtering & Slider System
 * - Location: Rendered inside the "Find what you're looking for" section (under search bar)
 * - Behavior: Inactive until Type == "Case Study"
 * - Multi-criteria filters: Service, Who We Serve, Search Input
 * - Bottom Arrows: ONLY visible when filtered cards count > 3
 * - Click on card: Opens exact PDF in a new tab
 */

(function () {
    'use strict';

    // Filter State
    const filterState = {
        type: null, // null until 'Case Study' is chosen
        service: 'ALL',
        industry: 'ALL',
        searchQuery: ''
    };

    let currentIndex = 0;
    let currentMatches = [];

    // Helper: Escape HTML strings
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // DOM Elements
    let resultsWrapper, viewport, slider, nav, btnPrev, btnNext, searchInput, searchContainer;

    function initFilterSystem() {
        resultsWrapper = document.getElementById('repo-filter-results-wrapper');
        viewport = document.getElementById('repo-filter-viewport');
        slider = document.getElementById('repo-filter-slider');
        nav = document.getElementById('repo-filter-nav');
        btnPrev = document.getElementById('repo-filter-btn-prev');
        btnNext = document.getElementById('repo-filter-btn-next');
        searchInput = document.querySelector('.repo-search-input');
        searchContainer = document.querySelector('.repo-filter-search');

        if (!resultsWrapper || !slider) return;

        setupDropdownListeners();
        setupSearchInput();
        setupSliderNavigation();
        setupResizeListener();
    }

    // 1. Dropdown Item Listeners
    function setupDropdownListeners() {
        const filterItems = document.querySelectorAll('.repo-filter-item');

        filterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const parentDropdown = item.closest('.repo-filter-dropdown');
                if (!parentDropdown) return;

                const text = item.textContent.trim();
                const dropdownId = parentDropdown.id;

                if (dropdownId === 'dropdown-type') {
                    handleTypeSelection(text);
                } else if (dropdownId === 'dropdown-service') {
                    handleServiceSelection(text);
                } else if (dropdownId === 'dropdown-industry') {
                    handleIndustrySelection(text);
                }
            });
        });
    }

    // Type Selection Handler
    // RULE: "type me jab tak mera case study select nhi hoga tab tak ye kuchh bhi work nhi karega"
    function handleTypeSelection(text) {
        const isCaseStudy = text.toLowerCase().includes('case study');
        const filterSection = document.querySelector('.repo-filter-section');

        if (isCaseStudy) {
            filterState.type = 'Case Study';
            if (filterSection) filterSection.classList.add('has-cards');
            resultsWrapper.style.display = 'block';
            resultsWrapper.style.opacity = '0';
            setTimeout(() => {
                resultsWrapper.style.opacity = '1';
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            }, 50);
            applyFilters();
        } else {
            filterState.type = text;
            if (filterSection) filterSection.classList.remove('has-cards');
            resultsWrapper.style.display = 'none';
            if (window.ScrollTrigger) {
                setTimeout(() => ScrollTrigger.refresh(), 50);
            }
        }
    }

    // Service Selection Handler
    function handleServiceSelection(text) {
        if (filterState.type !== 'Case Study') return;

        if (text.toLowerCase().includes('all')) {
            filterState.service = 'ALL';
        } else {
            filterState.service = text;
        }
        applyFilters();
    }

    // Who We Serve Selection Handler
    function handleIndustrySelection(text) {
        if (filterState.type !== 'Case Study') return;

        if (text.toLowerCase().includes('all')) {
            filterState.industry = 'ALL';
        } else {
            filterState.industry = text;
        }
        applyFilters();
    }

    // 2. Search Input & Icon Handler
    function setupSearchInput() {
        if (!searchInput) return;

        let debounceTimer;
        const triggerSearch = () => {
            if (filterState.type !== 'Case Study') return;
            filterState.searchQuery = searchInput.value.trim().toLowerCase();
            applyFilters();
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(triggerSearch, 150);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceTimer);
                triggerSearch();
            }
        });

        if (searchContainer) {
            const searchIcon = searchContainer.querySelector('svg');
            if (searchIcon) {
                searchIcon.style.cursor = 'pointer';
                searchIcon.addEventListener('click', () => {
                    clearTimeout(debounceTimer);
                    triggerSearch();
                });
            }
        }
    }

    // Reset Filters Helper
    function resetAllFilters() {
        filterState.service = 'ALL';
        filterState.industry = 'ALL';
        filterState.searchQuery = '';

        const serviceLabel = document.querySelector('#dropdown-service .repo-filter-label');
        if (serviceLabel) serviceLabel.textContent = 'Service';

        const industryLabel = document.querySelector('#dropdown-industry .repo-filter-label');
        if (industryLabel) industryLabel.textContent = 'Who We Serve';

        if (searchInput) searchInput.value = '';

        applyFilters();
    }

    // 3. Main Filtering Engine
    function applyFilters() {
        if (filterState.type !== 'Case Study') {
            resultsWrapper.style.display = 'none';
            return;
        }

        if (typeof STHIROS_CASE_STUDIES === 'undefined' || !Array.isArray(STHIROS_CASE_STUDIES)) {
            console.warn('STHIROS_CASE_STUDIES dataset not found.');
            return;
        }

        // Filter master dataset
        currentMatches = STHIROS_CASE_STUDIES.filter(cs => {
            // Service match
            if (filterState.service !== 'ALL') {
                if (cs.service.toLowerCase() !== filterState.service.toLowerCase()) {
                    return false;
                }
            }

            // Industry match
            if (filterState.industry !== 'ALL') {
                const csInd = (cs.industry || '').toLowerCase();
                const filterInd = filterState.industry.toLowerCase();
                if (csInd !== filterInd && !csInd.includes(filterInd) && !filterInd.includes(csInd)) {
                    return false;
                }
            }

            // Search query match
            if (filterState.searchQuery) {
                const q = filterState.searchQuery;
                const inTitle = (cs.title || '').toLowerCase().includes(q);
                const inDesc = (cs.desc || '').toLowerCase().includes(q);
                const inSrv = (cs.service || '').toLowerCase().includes(q);
                const inInd = (cs.industry || '').toLowerCase().includes(q);

                if (!inTitle && !inDesc && !inSrv && !inInd) {
                    return false;
                }
            }

            return true;
        });

        // Reset slide index
        currentIndex = 0;

        // Render Cards & update UI
        renderCards();
        updateSliderLayout();
    }

    // 4. Render Cards in Slider
    function renderCards() {
        slider.innerHTML = '';

        if (currentMatches.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'repo-filter-empty-state';
            emptyEl.innerHTML = `
                <h3>No case studies found</h3>
                <p>There are no case studies matching your current filter criteria.</p>
                <button type="button" class="repo-filter-reset-action">Show All Case Studies</button>
            `;
            const btn = emptyEl.querySelector('.repo-filter-reset-action');
            if (btn) btn.addEventListener('click', resetAllFilters);

            slider.appendChild(emptyEl);
            if (nav) nav.style.display = 'none';
            slider.classList.add('centered-cards');
            slider.style.transform = 'none';
            return;
        }

        // Build HTML for each card (exact match with "Work that speaks for itself" style)
        currentMatches.forEach(cs => {
            const cardEl = document.createElement('div');
            cardEl.className = 'rcs-card sthiros-glow-card';
            cardEl.style.cursor = 'pointer';

            // Safe click navigation directly to the verified PDF
            cardEl.addEventListener('click', () => {
                window.open(encodeURI(cs.pdf), '_blank');
            });

            cardEl.innerHTML = `
                <img src="${cs.bgImg}" class="rcs-bg" alt="Case Study">
                <div class="rcs-overlay"></div>
                <img src="assets/images/servicesinnpage/card_glow effect_sthiros.png" class="sthiros-hover-glow-effect" alt="">
                <div class="rcs-content">
                    <div class="rcs-text">
                        <p class="rcs-desc">${escapeHtml(cs.desc)}</p>
                    </div>
                    <div class="rcs-arrow-container">
                        <img src="assets/images/repositorypage/arrowwhite.png" class="rcs-arrow-normal" alt="Arrow">
                        <img src="assets/images/repositorypage/arrowred.png" class="rcs-arrow-hover" alt="Arrow">
                    </div>
                </div>
            `;

            slider.appendChild(cardEl);
        });
    }

    // 5. Slider Sizing & Navigation Layout
    // CRITICAL RULE: "mera arrow icon tab show hoga jab mera three se jyada card rhe"
    function updateSliderLayout() {
        if (!viewport || !slider) return;

        const totalCards = currentMatches.length;

        // When 0 cards
        if (totalCards === 0) {
            if (nav) nav.style.display = 'none';
            slider.style.transform = 'none';
            return;
        }

        const isMobile = window.innerWidth <= 768;
        const gap = isMobile ? 20 : 40;
        const viewportWidth = viewport.clientWidth - (isMobile ? 40 : 80);

        // Desktop visible cards = 3, Mobile = 1
        const visibleCount = isMobile ? 1 : 3;
        const cardWidth = isMobile ? viewportWidth : Math.floor((viewportWidth - (gap * 2)) / 3);

        const cards = Array.from(slider.children);
        cards.forEach(card => {
            if (card.classList.contains('rcs-card')) {
                card.style.flex = `0 0 ${cardWidth}px`;
                card.style.width = `${cardWidth}px`;
            }
        });

        // ARROW RULE CHECK:
        // Arrow ONLY shows if totalCards > 3 (or > 1 on mobile)
        if (totalCards > visibleCount) {
            if (nav) nav.style.display = 'flex';
            slider.classList.remove('centered-cards');
            slider.style.justifyContent = 'flex-start';
            slider.style.width = 'max-content';
        } else {
            // Less than or equal to 3 cards: Hide arrows & center
            if (nav) nav.style.display = 'none';
            slider.classList.add('centered-cards');
            slider.style.transform = 'none';
            slider.style.width = '100%';
            if (window.ScrollTrigger) {
                setTimeout(() => ScrollTrigger.refresh(), 50);
            }
            return;
        }

        // Apply slide position
        const maxIndex = Math.max(0, totalCards - visibleCount);
        if (currentIndex > maxIndex) currentIndex = maxIndex;

        const moveAmount = currentIndex * (cardWidth + gap);
        slider.style.transform = `translateX(-${moveAmount}px)`;

        // Update button states
        if (btnPrev) {
            btnPrev.style.opacity = currentIndex === 0 ? '0.35' : '1';
            btnPrev.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
        }
        if (btnNext) {
            btnNext.style.opacity = currentIndex >= maxIndex ? '0.35' : '1';
            btnNext.style.pointerEvents = currentIndex >= maxIndex ? 'none' : 'auto';
        }

        if (window.ScrollTrigger) {
            setTimeout(() => ScrollTrigger.refresh(), 50);
        }
    }

    // 6. Navigation Button Clicks
    function setupSliderNavigation() {
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const isMobile = window.innerWidth <= 768;
                const visibleCount = isMobile ? 1 : 3;
                const maxIndex = Math.max(0, currentMatches.length - visibleCount);

                if (currentIndex < maxIndex) {
                    currentIndex++;
                    updateSliderLayout();
                }
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateSliderLayout();
                }
            });
        }
    }

    // 7. Resize Listener
    function setupResizeListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateSliderLayout();
            }, 100);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFilterSystem);
    } else {
        initFilterSystem();
    }

})();
