const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Cream conexiunea la baza de date
const pool = new Pool({
    user: 'user_magazin',
    host: 'localhost',
    database: 'FromHardware',
    password: 'ParolaMagazin123',
    port: 5432,
});

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

console.log("Calea folderului curent (__dirname):", __dirname);
console.log("Calea fisierului curent (__filename):", __filename);
console.log("Folder curent de lucru (process.cwd()):", process.cwd());

const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folder creat automat: ${folder}`);
    }
}

const sass = require('sass');

let obGlobal = {
    obErori: null,
    folderScss: path.join(__dirname, 'resurse', 'css'),
    folderCss: path.join(__dirname, 'resurse', 'css')
};

// 2. Funcția de compilare SCSS
function compileazaScss(caleScss, caleCss) {
    // Calculăm căile absolute
    let absoluteScss = path.isAbsolute(caleScss) ? caleScss : path.join(obGlobal.folderScss, caleScss);
    let absoluteCss;

    if (!caleCss) {
        // Dacă lipsește, luăm numele scss-ului și îi punem extensia .css
        let parsedPath = path.parse(absoluteScss);
        absoluteCss = path.join(obGlobal.folderCss, parsedPath.name + '.css');
    } else {
        absoluteCss = path.isAbsolute(caleCss) ? caleCss : path.join(obGlobal.folderCss, caleCss);
    }

    let backupFolder = path.join(__dirname, 'backup', 'resurse', 'css');
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true }); // Creăm folderele dacă nu există
    }

    if (fs.existsSync(absoluteCss)) {
        try {
            let parsedCssPath = path.parse(absoluteCss);
            // Adăugăm un timestamp în nume ca să nu suprascriem mereu același backup
            let timestamp = new Date().getTime();
            let backupFile = path.join(backupFolder, `${parsedCssPath.name}_${timestamp}.css`);

            fs.copyFileSync(absoluteCss, backupFile);
        } catch (err) {
            console.error("Eroare la copierea în backup:", err);
        }
    }

    try {
        let rezultat = sass.compile(absoluteScss);
        fs.writeFileSync(absoluteCss, rezultat.css);
        console.log(`[SCSS] Compilat cu succes: ${path.basename(absoluteCss)}`);
    } catch (err) {
        console.error("[SCSS] Eroare la compilare:", err.message);
    }
}

try {
    let fisiere = fs.readdirSync(obGlobal.folderScss);
    for (let fis of fisiere) {
        if (path.extname(fis) === '.scss') {
            compileazaScss(fis);
        }
    }
} catch (err) {
    console.error("Eroare la citirea folderului SCSS pentru compilarea inițială:", err);
}

fs.watch(obGlobal.folderScss, (event, filename) => {
    if (filename && path.extname(filename) === '.scss') {
        let absoluteScss = path.join(obGlobal.folderScss, filename);
        // Verificăm dacă fișierul încă există (ca să nu dea eroare dacă l-am șters)
        if (fs.existsSync(absoluteScss)) {
            console.log(`\n[Watch] Modificare detectată la ${filename}...`);
            compileazaScss(filename);
        }
    }
});


function initErori() {
    try {
        let dateJson = fs.readFileSync(path.join(__dirname, 'erori.json'), 'utf8');
        obGlobal.obErori = JSON.parse(dateJson);

        obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine);

        for (let eroare of obGlobal.obErori.info_erori) {
            eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
        }
    } catch (err) {
        console.error("Eroare la citirea erori.json:", err);
    }
}
initErori();

function verificaErori() {
    let continutFisier = "";
    try {
        continutFisier = fs.readFileSync(path.join(__dirname, 'erori.json'), 'utf8');
    } catch (e) {
        // Bonus A: Nu exista fisierul
        console.error("EROARE CRITICA (Bonus A): Fisierul erori.json nu exista sau nu poate fi citit!");
        process.exit();
    }

    // Bonus F: Verificare dubluri pe string (inainte de parsare)
    // Cautam daca stringul '"titlu":' sau '"text":' sau '"imagine":' apare de mai multe ori decat numarul total de obiecte
    let regexTitlu = /"titlu"\s*:/g;
    let numarTitluri = (continutFisier.match(regexTitlu) || []).length;
    // Avem 1 in eroare_default + 1 per fiecare eroare din info_erori.
    // Daca numarTitluri e mai mare decat (1 + obGlobal.obErori.info_erori.length), avem o dublura in fisier!
    if (obGlobal.obErori && numarTitluri > (1 + obGlobal.obErori.info_erori.length)) {
        console.error("EROARE (Bonus F): O proprietate (ex: titlu) apare de mai multe ori in acelasi obiect in JSON!");
    }

    const radacina = obGlobal.obErori;

    // Bonus B: Nu exista o proprietate principala
    if (!radacina.info_erori || !radacina.cale_baza || !radacina.eroare_default) {
        console.error("EROARE CRITICA (Bonus B): Lipsesc proprietati de baza in erori.json (info_erori, cale_baza sau eroare_default).");
        process.exit();
    }

    // Bonus C: Lipsesc detalii din eroare_default
    const ed = radacina.eroare_default;
    if (!ed.titlu || !ed.text || !ed.imagine) {
        console.error("EROARE CRITICA (Bonus C): eroare_default are proprietati lipsa (titlu, text sau imagine).");
        process.exit();
    }

    // Bonus D: Folderul din cale_baza nu exista fizic
    let caleFizicaBaza = path.join(__dirname, radacina.cale_baza);
    if (!fs.existsSync(caleFizicaBaza)) {
        console.error(`EROARE CRITICA (Bonus D): Folderul specificat in cale_baza (${radacina.cale_baza}) nu exista in sistemul de fisiere!`);
        process.exit();
    }

    // Bonus E: Nu exista imaginile asociate erorilor
    for (let i = 0; i < radacina.info_erori.length; i++) {
        let err = radacina.info_erori[i];
        let caleImagineEroare = path.join(__dirname, err.imagine);

        if (!fs.existsSync(caleImagineEroare)) {
            console.warn(`ATENTIE (Bonus E): Imaginea pentru eroarea ${err.identificator} lipseste. Setam imaginea default.`);
            // Modificam JSON-ul incalecand imaginea default (calea a fost deja convertita in initErori)
            radacina.info_erori[i].imagine = ed.imagine;
        }
    }

    // Bonus G: Identificatori duplicati
    let mapIdentificatori = {};
    for (let err of radacina.info_erori) {
        if (mapIdentificatori[err.identificator]) {
            mapIdentificatori[err.identificator].push(err);
        } else {
            mapIdentificatori[err.identificator] = [err];
        }
    }

    for (let key in mapIdentificatori) {
        if (mapIdentificatori[key].length > 1) {
            console.warn(`\nATENTIE (Bonus G): Avem multiple erori cu identificatorul ${key}! Proprietatile lor sunt:`);
            mapIdentificatori[key].forEach(clona => {
                console.log(` -> Titlu: "${clona.titlu}", Text: "${clona.text}"`);
            });
        }
    }

    console.log("Validare JSON Bonus finalizata.\n");
}

verificaErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find(e => e.identificator === identificator);
    let errDef = obGlobal.obErori.eroare_default;

    let dateEroare = {
        titlu: titlu || (eroare ? eroare.titlu : errDef.titlu),
        text: text || (eroare ? eroare.text : errDef.text),
        imagine: imagine || (eroare ? eroare.imagine : errDef.imagine)
    };

    if (eroare && eroare.status) {
        res.status(identificator);
    }

    res.render('pagini/eroare', dateEroare);
}

const sharp = require('sharp');

// Funcție pentru parsarea galeriei și generarea imaginilor mici
async function pregatesteGalerie() {
    let dateGalerie = [];
    try {
        let jsonGalerie = fs.readFileSync(path.join(__dirname, 'galerie.json'), 'utf8');
        let obGalerie = JSON.parse(jsonGalerie);

        let oraCurenta = new Date();
        let oraStr = oraCurenta.getHours().toString().padStart(2, '0') + ":" +
            oraCurenta.getMinutes().toString().padStart(2, '0');

        let imaginiFiltrate = obGalerie.imagini.filter(img => {
            let intervale = img.timp.split(',');
            for (let int of intervale) {
                let [start, end] = int.split('-');
                if (oraStr >= start.trim() && oraStr <= end.trim()) return true;
            }
            return false;
        });

        // Trunchiem la maxim 10 imagini
        imaginiFiltrate = imaginiFiltrate.slice(0, 10);

        // Procesăm cu Sharp
        let folderGalerie = path.join(__dirname, obGalerie.cale_galerie);

        for (let img of imaginiFiltrate) {
            let caleMare = path.join(folderGalerie, img.cale_imagine);
            let numeMic = 'mic-' + img.cale_imagine;
            let caleMica = path.join(folderGalerie, numeMic);

            // Verificăm dacă imaginea originală există pentru a evita erorile
            if (fs.existsSync(caleMare)) {
                // Dacă nu există varianta mică, o generăm (lățime 300px)
                if (!fs.existsSync(caleMica)) {
                    await sharp(caleMare).resize(300).toFile(caleMica);
                }

                // Salvăm căile pentru EJS
                dateGalerie.push({
                    ...img,
                    cale_relativa_mare: path.join(obGalerie.cale_galerie, img.cale_imagine).replace(/\\/g, '/'),
                    cale_relativa_mica: path.join(obGalerie.cale_galerie, numeMic).replace(/\\/g, '/')
                });
            }
        }
    } catch (err) {
        console.error("Eroare la procesarea galeriei:", err);
    }
    return dateGalerie;
}

// --- GENERARE DATE DINAMICE (BONUS 1) ---
async function initDateGlobale() {
    try {
        const rezCat = await pool.query("SELECT DISTINCT categorie FROM produse");
        app.locals.categorii = rezCat.rows.map(rand => rand.categorie);

        const rezPret = await pool.query("SELECT MIN(pret) as min, MAX(pret) as max FROM produse");
        app.locals.pretMin = rezPret.rows[0].min;
        app.locals.pretMax = rezPret.rows[0].max;

        const rezCulori = await pool.query("SELECT DISTINCT culoare FROM produse");
        app.locals.culori = rezCulori.rows.map(rand => rand.culoare);

        // EXTRA PENTRU A AJUNGE LA 0.5 PUNCTE:
        const rezSubcat = await pool.query("SELECT DISTINCT subcategorie FROM produse");
        app.locals.subcategorii = rezSubcat.rows.map(rand => rand.subcategorie);

        const rezLungimi = await pool.query("SELECT MAX(LENGTH(nume)) as max_nume, MAX(LENGTH(descriere)) as max_desc FROM produse");
        app.locals.numeMaxLen = rezLungimi.rows[0].max_nume;
        app.locals.descMaxLen = rezLungimi.rows[0].max_desc;

        const rezExemplu = await pool.query("SELECT nume FROM produse LIMIT 1");
        app.locals.numeExemplu = rezExemplu.rows.length > 0 ? rezExemplu.rows[0].nume : 'Componenta';

        console.log("Date dinamice incarcate (Bonus 1 complet):", app.locals.pretMin, app.locals.pretMax);
    } catch (err) {
        console.error("Eroare la extragerea datelor:", err);
    }
}
initDateGlobale();

// --- SISTEM DE OFERTE (BONUS 12) ---
const fisierOferte = path.join(__dirname, 'oferte.json');
if (!fs.existsSync(fisierOferte)) {
    fs.writeFileSync(fisierOferte, JSON.stringify({ oferte: [] }));
}

function genereazaOferta() {
    if (!app.locals.categorii || app.locals.categorii.length === 0) return;

    let dateOferte = { oferte: [] };
    try {
        dateOferte = JSON.parse(fs.readFileSync(fisierOferte, 'utf8'));
    } catch(e) {}

    // Alegem categorie random (diferita de ultima)
    let catNoua;
    do {
        catNoua = app.locals.categorii[Math.floor(Math.random() * app.locals.categorii.length)];
    } while (dateOferte.oferte.length > 0 && dateOferte.oferte[0].categorie === catNoua && app.locals.categorii.length > 1);

    let reduceri = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    let reducere = reduceri[Math.floor(Math.random() * reduceri.length)];

    let acum = new Date();
    // Oferta dureaza 60 de secunde pt prezentare
    let finalizare = new Date(acum.getTime() + 60000);

    let ofertaNoua = {
        categorie: catNoua,
        "data-incepere": acum.getTime(),
        "data-finalizare": finalizare.getTime(),
        reducere: reducere
    };

    dateOferte.oferte.unshift(ofertaNoua); // Punem oferta noua la inceput

    // Curatare oferte mai vechi de 5 minute (T2)
    let limitaT2 = acum.getTime() - 5 * 60000;
    dateOferte.oferte = dateOferte.oferte.filter(o => o["data-finalizare"] > limitaT2);

    fs.writeFileSync(fisierOferte, JSON.stringify(dateOferte));
    app.locals.oferta_activa = ofertaNoua;
}

setTimeout(genereazaOferta, 2000); // Generam prima oferta dupa 2 secunde
setInterval(genereazaOferta, 60000); // Regeneram la fiecare minut

app.get('/produse', async (req, res) => {
    let categorieCeruta = req.query.categorie; // Ce a dat click utilizatorul in meniu

    // Default: cerem toate produsele
    let querySQL = "SELECT * FROM produse";
    let valoriQuery = [];

    // Daca a selectat o categorie specifica (si nu e 'toate')
    if (categorieCeruta && categorieCeruta !== 'toate') {
        querySQL += " WHERE categorie = $1"; // $1 e o masura de securitate anti-hack
        valoriQuery.push(categorieCeruta);
    }

    try {
        const rezultat = await pool.query(querySQL, valoriQuery);
        // Trimitem datele catre viitorul fisier produse.ejs
        res.render('pagini/produse', { produse: rezultat.rows });
    } catch (err) {
        console.error("Eroare la extragerea produselor:", err);
        res.status(500).send("Eroare interna a serverului");
    }
});

// Middleware pentru a injecta galeria în orice request (cerința zice "când cere pagina")
app.use(async (req, res, next) => {
    res.locals.imaginiGalerie = await pregatesteGalerie();
    next();
});

app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon.ico'));
});

app.get('/resurse/*', (req, res, next) => {
    if (path.extname(req.path) === '') {
        return afisareEroare(res, 403);
    }
    next();
});

app.get('/*.ejs', (req, res) => {
    afisareEroare(res, 400);
});

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip: req.ip });
});

app.get('/*', (req, res) => {
    let pagina = req.params[0];

    res.render('pagini/' + pagina, { ip: req.ip }, function(err, html) {
        if (err) {
            if (err.message.startsWith('Failed to lookup view')) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res);
            }
        } else {
            res.send(html);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Serverul a pornit pe portul ${PORT}. Accesează http://localhost:${PORT}`);
});