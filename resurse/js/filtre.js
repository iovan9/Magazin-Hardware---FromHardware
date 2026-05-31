document.addEventListener("DOMContentLoaded", function() {
    let btnSortAsc = document.getElementById("btn_sort_asc");
    let btnSortDesc = document.getElementById("btn_sort_desc");
    let btnCalc = document.getElementById("btn_calc");
    let btnReset = document.getElementById("btn_reset");
    let btnFiltrare = document.getElementById("btn_filtrare"); // Il tinem doar pentru resetare

    let rngPret = document.getElementById("i_pret");
    let valCurent = document.getElementById("val_curent");
    let mesajLipsa = document.getElementById("mesaj-lipsa");
    let counterProduse = document.getElementById("counter-produse");
    let iDescriere = document.getElementById("i_descriere");

    if (!document.querySelector(".grid-produse")) return;

    let containarProduse = document.querySelector(".grid-produse");
    let articoleInitiale = Array.from(document.querySelectorAll(".produs"));

    // BONUS 14: Gaseste cel mai ieftin produs din fiecare categorie
    function marcheazaCeleMaiIeftine() {
        let categoriiPretMinim = {};

        // Gasim pretul minim per categorie
        for(let art of articoleInitiale) {
            let cat = art.dataset.categorie;
            let pret = parseFloat(art.dataset.pret);

            if(!categoriiPretMinim[cat] || pret < categoriiPretMinim[cat].pret) {
                categoriiPretMinim[cat] = { pret: pret, element: art };
            }
        }

        // Adaugam un badge vizual
        for(let cat in categoriiPretMinim) {
            let badge = document.createElement("div");
            badge.innerHTML = "🏆 CEL MAI IEFTIN: " + cat.replace(/_/g, ' ');
            badge.style.cssText = "background: #ffc107; color: #000; padding: 5px 10px; border-radius: 5px; font-weight: bold; margin-top: 10px; display: inline-block;";
            categoriiPretMinim[cat].element.querySelector(".coloana-dreapta").appendChild(badge);
        }
    }
    marcheazaCeleMaiIeftine();

    // BONUS 7: Functie pentru eliminarea diacriticelor
    function eliminaDiacritice(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    // Levenshtein
    function distantaLevenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        let matrice = [];
        for (let i = 0; i <= b.length; i++) { matrice[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrice[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrice[i][j] = matrice[i - 1][j - 1];
                } else {
                    matrice[i][j] = Math.min(matrice[i - 1][j - 1] + 1, Math.min(matrice[i][j - 1] + 1, matrice[i - 1][j] + 1));
                }
            }
        }
        return matrice[b.length][a.length];
    }

    // FUNCTIA CENTRALA DE FILTRARE
    function aplicaFiltre() {
        // Preluam valorile si eliminam diacriticele pentru text
        let valNume = eliminaDiacritice(document.getElementById("i_nume").value.toLowerCase().trim());
        let valPret = parseFloat(rngPret.value);
        let valCuloare = eliminaDiacritice(document.getElementById("i_culoare").value.toLowerCase().trim());
        let valRgb = document.querySelector("input[name='rad_rgb']:checked").value;
        let valDesc = eliminaDiacritice(iDescriere.value.toLowerCase().trim());
        let valSubcat = document.getElementById("i_subcat").value;

        // Validare Nume (fara cifre)
        if(valNume.match(/[0-9]/)) {
            document.getElementById("i_nume").classList.add("is-invalid");
            return;
        } else {
            document.getElementById("i_nume").classList.remove("is-invalid");
        }

        let checkPorturi = document.querySelectorAll(".chk-port");
        let numarAfisate = 0;

        for(let art of articoleInitiale) {
            art.style.display = "none";

            // Eliminam diacriticele si din datele produselor pentru a compara corect
            let numeArt = eliminaDiacritice(art.dataset.nume.toLowerCase());
            let pretArt = parseFloat(art.dataset.pret);
            let culArt = eliminaDiacritice(art.dataset.culoare.toLowerCase());
            let rgbArt = art.dataset.rgb;
            let descArt = eliminaDiacritice(art.querySelector(".descriere-produs").textContent.toLowerCase());
            let subcatArt = art.dataset.subcat;
            let porturiArt = art.dataset.porturi;

            let condNume = false;
            if(valNume === "") {
                condNume = true;
            } else {
                let cuvinteNume = numeArt.split(" ");
                for(let cuv of cuvinteNume) {
                    if(distantaLevenshtein(valNume, cuv) <= 2 || cuv.includes(valNume)) {
                        condNume = true; break;
                    }
                }
            }

            let condPret = pretArt <= valPret;
            let condCul = (valCuloare === "" || culArt === valCuloare);
            let condRgb = (valRgb === "toate" || rgbArt === valRgb);
            let condDesc = (valDesc === "" || descArt.includes(valDesc));
            let condSubcat = (valSubcat === "toate" || subcatArt === valSubcat);

            let condComplex = true;
            for(let chk of checkPorturi) {
                if(chk.checked) {
                    let radioName = chk.value === "HDMI" ? "rad_hdmi" : (chk.value === "DisplayPort" ? "rad_dp" : "rad_usb");
                    let tipFiltru = document.querySelector(`input[name='${radioName}']:checked`).value;
                    let arePortul = porturiArt.includes(chk.value);

                    if(tipFiltru === "are" && !arePortul) condComplex = false;
                    if(tipFiltru === "nu" && arePortul) condComplex = false;
                }
            }

            if(condNume && condPret && condCul && condRgb && condDesc && condSubcat && condComplex && !iDescriere.classList.contains("is-invalid")) {
                art.style.display = "block";
                numarAfisate++;
            }
        }

        // BONUS 3 & 15: Actualizam contorul si aratam mesajul daca e cazul
        counterProduse.innerHTML = numarAfisate;
        if(numarAfisate === 0) {
            mesajLipsa.style.display = "block";
        } else {
            mesajLipsa.style.display = "none";
        }
    }

    // BONUS 4: Atasam functia aplicaFiltre pe evenimentele de input/change (Filtrare Live)
    document.getElementById("i_nume").addEventListener("input", aplicaFiltre);
    document.getElementById("i_culoare").addEventListener("change", aplicaFiltre);
    document.getElementById("i_subcat").addEventListener("change", aplicaFiltre);

    document.querySelectorAll("input[name='rad_rgb']").forEach(r => r.addEventListener("change", aplicaFiltre));
    document.querySelectorAll(".chk-port").forEach(c => c.addEventListener("change", aplicaFiltre));
    document.querySelectorAll("input[type='radio'][name^='rad_']").forEach(r => r.addEventListener("change", aplicaFiltre));

    rngPret.addEventListener("input", function() {
        valCurent.innerHTML = this.value;
        aplicaFiltre();
    });

    iDescriere.addEventListener("input", function() {
        let valoare = this.value.trim();
        if (valoare.length > 0 && valoare.length < 3) {
            this.classList.add("is-invalid");
        } else {
            this.classList.remove("is-invalid");
        }
        aplicaFiltre();
    });

    // Ascundem butonul vechi de filtrare, ca nu mai e nevoie de el la onchange
    if(btnFiltrare) btnFiltrare.style.display = "none";

    // --- SORTARE (neschimbat) ---
    function sorteaza(semn) {
        let articoleCurente = Array.from(containarProduse.querySelectorAll(".produs"));
        articoleCurente.sort(function(a, b) {
            let raportA = parseFloat(a.dataset.putere) / parseFloat(a.dataset.pret);
            let raportB = parseFloat(b.dataset.putere) / parseFloat(b.dataset.pret);
            if(Math.abs(raportA - raportB) < 0.0001) return semn * a.dataset.subcat.localeCompare(b.dataset.subcat);
            return semn * (raportA - raportB);
        });
        for(let art of articoleCurente) containarProduse.appendChild(art);
    }
    btnSortAsc.onclick = () => sorteaza(1);
    btnSortDesc.onclick = () => sorteaza(-1);

    // --- CALCULARE (neschimbat) ---
    btnCalc.onclick = function() {
        let suma = 0, numar = 0;
        for(let art of articoleInitiale) {
            if(art.style.display !== "none") { suma += parseFloat(art.dataset.pret); numar++; }
        }
        let divInfo = document.createElement("div");
        divInfo.innerHTML = `Valoare afișată: <b>${suma} RON</b> (${numar} produse)`;
        divInfo.style.cssText = "position:fixed; bottom:20px; right:20px; padding:15px; background:var(--color-primary); color:white; border-radius:8px; z-index:9999;";
        document.body.appendChild(divInfo);
        setTimeout(() => divInfo.remove(), 2000);
    }

    // --- RESETARE ---
    btnReset.onclick = function() {
        if(confirm("Esti sigur ca vrei sa resetezi toate filtrele?")) {
            document.getElementById("i_nume").value = "";
            document.getElementById("i_nume").classList.remove("is-invalid");
            rngPret.value = rngPret.max; valCurent.innerHTML = rngPret.max;
            document.getElementById("i_culoare").value = "";
            document.querySelector("input[name='rad_rgb'][value='toate']").checked = true;
            document.getElementById("i_descriere").value = "";
            document.getElementById("i_subcat").value = "toate";
            document.querySelectorAll(".chk-port").forEach(c => c.checked = false);

            // Re-aplica filtrarea pentru a reseta ecranul
            aplicaFiltre();

            // Re-atasam in ordinea initiala
            for(let art of articoleInitiale) containarProduse.appendChild(art);
        }
    }
});