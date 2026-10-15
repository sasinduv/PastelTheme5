(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. Reveal on scroll ---------- */
    var revealEls = document.querySelectorAll('[data-reveal], .pl-title');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-in');
            // remove the stagger delay afterwards so hover effects feel instant
            setTimeout(function () { e.target.style.setProperty('--d', '0s'); }, 1400);
            io.unobserve(e.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    /* ---------- 2. Stat counters ---------- */
    var counters = document.querySelectorAll('[data-count]');
    var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = null;
            function tick(t) {
                if (!t0) t0 = t;
                var p = Math.min((t - t0) / 1800, 1), eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(end * eased) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            }
            if (!reduce) requestAnimationFrame(tick);
            cio.unobserve(el);
        });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });

    /* ---------- 3. Hero parallax (scroll + mouse) ---------- */
    var hero = document.getElementById('plHero');
    var layers = hero ? hero.querySelectorAll('.pl-layer[data-speed]') : [];
    var mx = 0, my = 0, ticking = false;

    function paintParallax() {
        var sy = Math.min(window.scrollY, hero.offsetHeight);
        layers.forEach(function (l) {
            var s = parseFloat(l.dataset.speed);
            l.style.setProperty('--px', (mx * s * 220) + 'px');
            l.style.setProperty('--py', (sy * s * 1.6 + my * s * 120) + 'px');
        });
        ticking = false;
    }
    function requestPaint() { if (!ticking) { ticking = true; requestAnimationFrame(paintParallax); } }

    if (hero && !reduce) {
        window.addEventListener('scroll', requestPaint, { passive: true });
        hero.addEventListener('mousemove', function (e) {
            var r = hero.getBoundingClientRect();
            mx = (e.clientX - r.left) / r.width - 0.5;
            my = (e.clientY - r.top) / r.height - 0.5;
            requestPaint();
        });
        hero.addEventListener('mouseleave', function () { mx = my = 0; requestPaint(); });
    }

    /* ---------- 4. Scroll progress bar ---------- */
    var bar = document.getElementById('plProgress');
    window.addEventListener('scroll', function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (bar && h > 0) bar.style.width = (window.scrollY / h * 100) + '%';
    }, { passive: true });

    /* ---------- 5. Generic carousel (modules + testimonials) ---------- */
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
        var items = root.querySelectorAll('.pl-item');
        var n = items.length, cur = Math.floor(n / 2), half = Math.floor(n / 2), timer;
        if (root.classList.contains('pl-tlist')) cur = 0;

        var dotsBox = root.dataset.dots ? document.querySelector(root.dataset.dots) : null;
        var dots = [];
        if (dotsBox) {
            items.forEach(function (_, i) {
                var b = document.createElement('button');
                b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                b.addEventListener('click', function () { go(i); restart(); });
                dotsBox.appendChild(b); dots.push(b);
            });
        }

        function render() {
            items.forEach(function (el, i) {
                var o = ((i - cur + n + half) % n) - half;
                el.style.setProperty('--o', o);
                el.style.setProperty('--a', Math.abs(o));
                el.style.setProperty('--s', o === 0 ? 1.08 : 0.9);
                el.classList.toggle('is-active', o === 0);
            });
            dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
        }
        function go(i) { cur = (i + n) % n; render(); }
        function restart() {
            clearInterval(timer);
            var t = +root.dataset.auto;
            if (t && !reduce) timer = setInterval(function () { go(cur + 1); }, t);
        }

        // click a side card to bring it forward
        items.forEach(function (el, i) {
            el.addEventListener('click', function (e) {
                if (i !== cur) { e.preventDefault(); go(i); restart(); }
            });
        });

        // swipe / drag
        var sx = null;
        root.addEventListener('pointerdown', function (e) { sx = e.clientX; });
        root.addEventListener('pointerup', function (e) {
            if (sx === null) return;
            var dx = e.clientX - sx; sx = null;
            if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
        });
        root.addEventListener('mouseenter', function () { clearInterval(timer); });
        root.addEventListener('mouseleave', restart);

        render(); restart();
    });
})();