const express = require('express');
const fs = require('fs');
const path = require('path');

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

let obGlobal = { obErori: null };

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