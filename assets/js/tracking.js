/*
  Na Wadze – konfiguracja pomiaru
  --------------------------------
  Ten plik jest ładowany jako pierwszy skrypt w <head> na KAŻDEJ podstronie,
  więc pełni rolę wspólnego szablonu: kontener GTM instalujesz w jednym miejscu.

  TEMAT 3, KROK 6:
  wklej poniżej identyfikator swojego kontenera Google Tag Manager (GTM-...),
  zapisz plik i wgraj go do repozytorium. Dopóki zostaje wartość GTM-XXXXXXX,
  kontener się nie ładuje, a zdarzenia trafiają tylko do warstwy danych.

  Uwaga: tutaj wpisujesz identyfikator kontenera GTM-..., a NIE identyfikator
  pomiaru GA4 (G-...). Identyfikator G-... podajesz w tagu Google wewnątrz GTM.
*/
var NW_GTM_ID = 'GTM-XXXXXXX';

/* 1. Warstwa danych i funkcja gtag (potrzebna do trybu zgody). */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

/* 2. Tryb zgody (Consent Mode v2): domyślnie wszystko odrzucone.
      Baner na stronie zmienia analytics_storage na "granted" po akceptacji. */
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});

(function () {
  var stored = null;
  try { stored = window.localStorage.getItem('nw_consent'); } catch (e) { /* brak dostępu do pamięci */ }
  if (stored === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
})();

/* 3. Standardowy fragment kontenera GTM (część wklejana do <head>).
      Uruchamia się dopiero po wpisaniu prawdziwego identyfikatora. */
if (/^GTM-[A-Z0-9]+$/.test(NW_GTM_ID) && NW_GTM_ID !== 'GTM-XXXXXXX') {
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', NW_GTM_ID);
}
