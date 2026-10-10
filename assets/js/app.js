/*
  Na Wadze – logika strony i zdarzenia wysyłane do warstwy danych (dataLayer).

  Zdarzenia własne:
    ranking_view          lista produktów pojawiła się na ekranie
    weights_change        użytkownik zmienił wagę kryterium
    weights_reset         użytkownik przywrócił wagi domyślne
    product_details_open  użytkownik rozwinął ocenę i ceny produktu
    affiliate_click       kliknięcie w link do sklepu (makrokonwersja)
    generate_lead         zapis na newsletter (strona z podziękowaniem)
    consent_choice        decyzja w banerze zgody

  Do warstwy danych nie trafiają żadne dane osobowe: adres e-mail z formularza
  nie jest przekazywany ani w zdarzeniu, ani w adresie URL.
*/
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  /* Parametry zerowane przy każdym zdarzeniu, żeby wartości z poprzedniego
     zdarzenia nie "przykleiły się" do następnego (warstwa danych je pamięta). */
  var RESET = {
    product_id: undefined,
    product_name: undefined,
    rank_position: undefined,
    shop: undefined,
    criterion: undefined,
    weight_value: undefined,
    weights_customized: undefined,
    items_count: undefined,
    lead_type: undefined,
    last_ranking_id: undefined,
    consent_analytics: undefined
  };

  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  function getItem(kind, key) {
    try { var s = store(kind); return s ? s.getItem(key) : null; } catch (e) { return null; }
  }
  function setItem(kind, key, value) {
    try { var s = store(kind); if (s) { s.setItem(key, value); } } catch (e) { /* pamięć niedostępna */ }
  }
  function removeItem(kind, key) {
    try { var s = store(kind); if (s) { s.removeItem(key); } } catch (e) { /* pamięć niedostępna */ }
  }

  function track(name, params) {
    var payload = {};
    var key;
    for (key in RESET) { payload[key] = RESET[key]; }
    for (key in (params || {})) { payload[key] = params[key]; }
    payload.event = name;
    window.dataLayer.push(payload);
    debugLog(name, params || {});
  }

  /* ---------- Podgląd zdarzeń: dopisz ?debug=1 do adresu ---------- */

  var debugBox = null;
  function debugOn() {
    if (/[?&]debug=1/.test(window.location.search)) { setItem('sessionStorage', 'nw_debug', '1'); }
    if (/[?&]debug=0/.test(window.location.search)) { removeItem('sessionStorage', 'nw_debug'); }
    return getItem('sessionStorage', 'nw_debug') === '1';
  }
  function debugLog(name, params) {
    if (!debugBox) { return; }
    var row = document.createElement('div');
    var title = document.createElement('b');
    title.textContent = name;
    row.appendChild(title);
    row.appendChild(document.createTextNode(' ' + JSON.stringify(params)));
    debugBox.appendChild(row);
    debugBox.scrollTop = debugBox.scrollHeight;
  }
  if (debugOn()) {
    debugBox = document.createElement('aside');
    debugBox.className = 'debug';
    debugBox.setAttribute('aria-label', 'Podgląd zdarzeń');
    var head = document.createElement('strong');
    head.textContent = 'Zdarzenia w dataLayer (wyłącz: ?debug=0)';
    debugBox.appendChild(head);
    document.body.appendChild(debugBox);
  }

  /* ---------- Baner zgody ---------- */

  var consentBox = document.getElementById('consent');
  function consentChoice(value) {
    setItem('localStorage', 'nw_consent', value);
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: value });
    }
    track('consent_choice', { consent_analytics: value });
    if (consentBox) { consentBox.hidden = true; }
  }
  if (consentBox) {
    if (!getItem('localStorage', 'nw_consent')) { consentBox.hidden = false; }
    var accept = document.getElementById('consent-accept');
    var reject = document.getElementById('consent-reject');
    if (accept) { accept.addEventListener('click', function () { consentChoice('granted'); }); }
    if (reject) { reject.addEventListener('click', function () { consentChoice('denied'); }); }
    var reopen = document.getElementById('consent-open');
    if (reopen) { reopen.addEventListener('click', function () { consentBox.hidden = false; accept.focus(); }); }
  }

  /* ---------- Ranking: wagi, przeliczanie, zdarzenia ---------- */

  function fmt(value, digits) {
    return value.toFixed(digits).replace('.', ',');
  }

  var ranking = document.querySelector('[data-ranking]');
  if (ranking) {
    var rankingId = ranking.getAttribute('data-ranking');
    var list = document.getElementById('rank-list');
    var sliders = Array.prototype.slice.call(ranking.querySelectorAll('input[type="range"][data-criterion]'));
    var products = Array.prototype.slice.call(list.querySelectorAll('.product'));
    var stateLine = document.getElementById('weights-state');
    var resetButton = document.getElementById('weights-reset');
    var opened = {};

    setItem('sessionStorage', 'nw_last_ranking', rankingId);

    var shares = function () {
      var raw = sliders.map(function (s) { return Number(s.value); });
      var sum = raw.reduce(function (a, b) { return a + b; }, 0);
      if (sum === 0) { return raw.map(function () { return 1 / raw.length; }); }
      return raw.map(function (v) { return v / sum; });
    };
    var customized = function () {
      return sliders.some(function (s) { return s.value !== s.getAttribute('data-default'); });
    };
    var positionOf = function (item) {
      return Array.prototype.indexOf.call(list.children, item) + 1;
    };

    var recalc = function () {
      var w = shares();
      sliders.forEach(function (s, i) {
        var out = document.getElementById('o-' + s.getAttribute('data-criterion'));
        if (out) { out.textContent = Math.round(w[i] * 100) + '%'; }
      });
      products.forEach(function (item) {
        var scores = item.getAttribute('data-scores').split(',').map(Number);
        var total = 0;
        var segments = item.querySelectorAll('.bar span');
        var rows = item.querySelectorAll('.breakdown tbody tr');
        scores.forEach(function (score, i) {
          var part = score * w[i];
          total += part;
          if (segments[i]) { segments[i].style.width = (part * 10).toFixed(2) + '%'; }
          if (rows[i]) {
            rows[i].querySelector('[data-weight]').textContent = Math.round(w[i] * 100) + '%';
            rows[i].querySelector('[data-part]').textContent = fmt(part, 2);
          }
        });
        item.setAttribute('data-total', total.toFixed(4));
        item.querySelector('[data-total-out]').textContent = fmt(total, 2);
        var sumCell = item.querySelector('[data-sum]');
        if (sumCell) { sumCell.textContent = fmt(total, 2); }
        var compareCell = document.querySelector('[data-total-for="' + item.getAttribute('data-product-id') + '"]');
        if (compareCell) { compareCell.textContent = fmt(total, 2); }
      });
      products.slice().sort(function (a, b) {
        return Number(b.getAttribute('data-total')) - Number(a.getAttribute('data-total'));
      }).forEach(function (item, index) {
        list.appendChild(item);
        item.querySelector('.product-rank').textContent = index + 1;
        item.classList.toggle('is-first', index === 0);
      });
      if (stateLine) {
        var leader = list.children[0].getAttribute('data-product-name');
        stateLine.textContent = (customized() ? 'Twoje wagi. ' : 'Wagi domyślne. ') + 'Pierwsze miejsce: ' + leader + '.';
      }
      if (resetButton) { resetButton.disabled = !customized(); }
    };

    sliders.forEach(function (slider, i) {
      slider.addEventListener('input', recalc);
      slider.addEventListener('change', function () {
        track('weights_change', {
          criterion: slider.getAttribute('data-criterion'),
          weight_value: Math.round(shares()[i] * 100)
        });
      });
    });

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        sliders.forEach(function (s) { s.value = s.getAttribute('data-default'); });
        recalc();
        track('weights_reset', {});
      });
    }

    products.forEach(function (item) {
      var toggle = item.querySelector('.product-toggle');
      var details = item.querySelector('.product-details');
      var productId = item.getAttribute('data-product-id');
      var productName = item.getAttribute('data-product-name');

      toggle.addEventListener('click', function () {
        var open = details.hidden;
        details.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Ukryj ocenę i ceny' : 'Pokaż ocenę i ceny';
        if (open && !opened[productId]) {
          opened[productId] = true;
          track('product_details_open', {
            product_id: productId,
            product_name: productName,
            rank_position: positionOf(item),
            weights_customized: customized() ? 'yes' : 'no'
          });
        }
      });

      Array.prototype.forEach.call(item.querySelectorAll('a[data-shop]'), function (link) {
        link.addEventListener('click', function () {
          track('affiliate_click', {
            product_id: productId,
            product_name: productName,
            rank_position: positionOf(item),
            shop: link.getAttribute('data-shop'),
            weights_customized: customized() ? 'yes' : 'no'
          });
        });
      });
    });

    recalc();

    var seen = false;
    var announceView = function () {
      if (seen) { return; }
      seen = true;
      track('ranking_view', { items_count: products.length });
    };
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { announceView(); observer.disconnect(); }
        });
      }, { threshold: 0.15 });
      observer.observe(list);
    } else {
      announceView();
    }
  }

  /* ---------- Newsletter ---------- */

  var form = document.getElementById('newsletter-form');
  if (form) {
    var email = document.getElementById('nl-email');
    var agree = document.getElementById('nl-agree');
    var emailError = document.getElementById('nl-email-error');
    var agreeError = document.getElementById('nl-agree-error');

    form.addEventListener('submit', function (event) {
      /* Formularz nie jest wysyłany metodą GET ani POST: adres e-mail nie może
         trafić do adresu URL, bo GA4 zapisałby go w parametrze page_location. */
      event.preventDefault();
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var okAgree = agree.checked;
      emailError.hidden = okEmail;
      agreeError.hidden = okAgree;
      email.setAttribute('aria-invalid', okEmail ? 'false' : 'true');
      if (!okEmail) { email.focus(); return; }
      if (!okAgree) { agree.focus(); return; }
      setItem('sessionStorage', 'nw_lead', '1');
      window.location.href = form.getAttribute('data-thanks');
    });
  }

  if (document.body.getAttribute('data-page') === 'thanks') {
    /* Zdarzenie wysyłamy tylko raz, po prawdziwym wysłaniu formularza.
       Odświeżenie strony albo wejście z zakładki nie nalicza kolejnego leada. */
    if (getItem('sessionStorage', 'nw_lead') === '1') {
      removeItem('sessionStorage', 'nw_lead');
      track('generate_lead', {
        lead_type: 'newsletter',
        last_ranking_id: getItem('sessionStorage', 'nw_last_ranking') || '(brak)'
      });
    }
  }
})();
