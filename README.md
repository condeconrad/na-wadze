# Na Wadze

Fikcyjny serwis z rankingami produktów i oceną ważoną. Projekt studencki na zajęcia z analityki internetowej.
Oceny i opisy produktów są przykładowe i nie pochodzą z testów.

## Publikacja na GitHub Pages (bezpłatnie)

1. Zaloguj się na github.com i utwórz nowe repozytorium o nazwie `na-wadze`, widoczność Public.
2. Na stronie repozytorium wybierz "uploading an existing file" i przeciągnij całą zawartość tego folderu
   (pliki .html, sitemap.xml oraz foldery `assets` i `rankingi`). Zatwierdź przyciskiem "Commit changes".
3. Wejdź w Settings > Pages. W polu Source wybierz "Deploy from a branch", gałąź `main`, folder `/ (root)`. Zapisz.
4. Po około minucie strona działa pod adresem `https://condeconrad.github.io/na-wadze/`.
5. W pliku `sitemap.xml` zamień `condeconrad` na swój login GitHub.

Nazwa repozytorium musi brzmieć `na-wadze`, bo korzysta z niej strona błędu 404 i mapa witryny.

## Instalacja Google Tag Manager (Temat 3)

Otwórz `assets/js/tracking.js` i w pierwszej linii kodu zamień `GTM-XXXXXXX` na identyfikator swojego kontenera.
Plik jest ładowany na każdej podstronie, więc kontener pojawi się wszędzie po jednej zmianie.
Identyfikator GA4 (`G-...`) podajesz w tagu Google wewnątrz GTM, nie w kodzie strony.

Strona ma baner zgody. Dopóki nie klikniesz "Zgadzam się na analitykę", GA4 nie pokaże Cię w raporcie
czasu rzeczywistego ani w DebugView.

## Zdarzenia w warstwie danych

| Zdarzenie | Kiedy | Parametry |
| --- | --- | --- |
| `ranking_view` | lista produktów pojawiła się na ekranie | `items_count` |
| `weights_change` | zmiana wagi kryterium | `criterion`, `weight_value` |
| `weights_reset` | przywrócenie wag domyślnych | brak |
| `product_details_open` | rozwinięcie oceny i cen produktu | `product_id`, `product_name`, `rank_position`, `weights_customized` |
| `affiliate_click` | kliknięcie w link do sklepu | `product_id`, `product_name`, `rank_position`, `shop`, `weights_customized` |
| `generate_lead` | zapis na newsletter (strona z podziękowaniem) | `lead_type`, `last_ranking_id` |
| `consent_choice` | decyzja w banerze zgody | `consent_analytics` |

Każda strona ustawia też `page_type`, a strony rankingów dodatkowo `ranking_id` i `ranking_name`.

Podgląd zdarzeń bez GTM: dopisz `?debug=1` do adresu strony. Wyłączenie: `?debug=0`.
