# Jenduv blog

Jednoduchy osobni blog, ktery bezi na GitHub Pages. Stranku muzes upravovat v HTML, CSS a JavaScriptu. Google prihlaseni a ukladani prispevku zajistuje Firebase.

## Co uz stranka umi

- Zobrazit verejne prispevky vsem navstevnikum.
- Prihlasit autora pres Google ucet.
- Ulozit prispevky jako verejne, jen pro vybrane kamarady nebo soukrome.
- Zobrazit autorovi jeho soukrome prispevky a kamaradum ty, ktere jim autor povolil.
- Spravovat kamarady pomoci jejich Firebase ID.

## 1. Spusteni webu na GitHubu

1. Otevri repozitar na GitHubu a klikni na **Settings**.
2. V menu otevri **Pages**.
3. V casti **Build and deployment** vyber **Deploy from a branch**.
4. Jako branch vyber `main`, slozku `/(root)` a uloz nastaveni.
5. Za chvili bude web na adrese `https://svpudik.github.io/jenda-web/`.

Web na teto adrese bude verejne dostupny. Soukromy repozitar muze pro GitHub Pages vyzadovat tarif, ktery tuto moznost podporuje; pripadne se rodic muze rozhodnout repozitar zverejnit. Ve verejnem repozitari uvidi kazdy i vsechny zdrojove soubory. Nikdy sem neukladej hesla, adresu, telefon ani nic, co nechces ukazat vsem.

## 2. Zapnuti Google prihlaseni a blogu

Tuhle cast nastav s rodicem. Firebase je sluzba, ktera webu poskytne prihlaseni a databazi. Jeji bezplatne limity a podminky se mohou menit.

1. Rodic vytvori projekt na [Firebase Console](https://console.firebase.google.com/) a prida webovou aplikaci.
2. V nastaveni webove aplikace zkopiruje konfiguraci Firebase do souboru `firebase-config.js`. Jde o verejnou konfiguraci webu, ne o heslo. Do souboru nikdy nedavej soukromy klic ani heslo.
3. Ve Firebase Console otevri **Authentication > Sign-in method** a zapni **Google**.
4. V **Authentication > Settings > Authorized domains** pridej domenu `TVUJ-UCET.github.io`.
5. Vytvor databazi **Firestore Database**.
6. V casti **Firestore Database > Rules** vloz obsah souboru `firestore.rules` a klikni na **Publish**.
7. Pockej, az se zmena souboru `firebase-config.js` nahraje na GitHub Pages, a obnov web.

Dokud neni konfigurace doplnena a databaze nastavena, prihlaseni ani ukladani prispevku nebudou fungovat. Nezverejnuj konfiguracni klice sluzeb, ktere nejsou urcene pro web.

## 3. Jak pridat kamarada

1. Prihlas se na web tlacitkem **Prihlasit pres Google**.
2. V casti **Muj ucet** zkopiruj svoje Firebase ID a posli ho kamaradovi. ID samo o sobe neni heslo, ale posilej ho jen lidem, ktere znas.
3. Kamarad se musi na webu alespon jednou prihlasit pres Google a poslat ti sve Firebase ID.
4. V casti **Kamaradi** vloz jeho ID. Od te chvile mu muzes povolit sve prispevky pro kamarady.

Prispevek oznaceny **Soukromy** uvidis jen ty. **Kamaradi** ho uvidi jen prihlaseni lide, ktere mas v seznamu kamaradu v okamziku vytvoreni prispevku. **Verejny** uvidi kazdy. Prispevky pro kamarady nejsou sifrovane; pro osobni a citlive informace blog nepouzivej.

## 4. Jak upravovat stranku

Nejjednodussi zpusob je upravovat soubory primo na GitHubu:

1. Otevri soubor, ktery chces zmenit, a klikni na ikonu tuzky.
2. Zmen text nebo kod. Napriklad uvodni nadpis najdes v `index.html`.
3. Klikni na **Commit changes**. Po chvilce se zmena objevi na webu.

Soubory projektu:

- `index.html` obsahuje obsah a rozlozeni stranky.
- `style.css` urcuje barvy, pismo a vzhled.
- `main.js` obsahuje prihlaseni, ukladani a zobrazovani prispevku.
- `firebase-config.js` spojuje web s Firebase projektem.
- `firestore.rules` urcuje, kdo smi cist a menit prispevky.

Zkus nejdriv zmenit nadpis, barvu v `style.css` nebo text tlacitka. Kdyz se neco rozbije, muzes v historii souboru na GitHubu vratit predchozi verzi.

## Bezpecnostni poznamky

- GitHub Pages hostuje verejne soubory. Soukrome prispevky se proto ukladaji do Firestore, ne do souboru v repozitari.
- Firebase pravidla kontroluji pristup i na serveru. Schovani tlacitka na strance samo o sobe zabezpeceni neni.
- Rodic by mel zkontrolovat pravidla Firestore, nastaveni uctu a pripadna upozorneni na spotrebu sluzby.
- Tento projekt je ucici se ukazka, ne sluzba pro ukladani citlivych nebo dulezitych informaci.