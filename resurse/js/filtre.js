document.addEventListener("DOMContentLoaded", function() {
    let btnFiltrare = document.getElementById("btn_filtrare");
    let btnSortAsc = document.getElementById("btn_sort_asc");
    let btnSortDesc = document.getElementById("btn_sort_desc");
    let btnCalc = document.getElementById("btn_calc");

    let rngPret = document.getElementById("i_pret");
    let valCurent = document.getElementById("val_curent");

    if (!btnFiltrare) return;

    let btnReset = document.getElementById("btn_reset");

    // Update live la valoarea din input range
    rngPret.oninput = function() {
        valCurent.innerHTML = this.value;
    }

    let iDescriere = document.getElementById("i_descriere");

    // Validare live (daca scrie intre 1 si 2 caractere e eroare, minim e 3)
    iDescriere.addEventListener("input", function() {
        let valoare = this.value.trim();
        if (valoare.length > 0 && valoare.length < 3) {
            this.classList.add("is-invalid"); // Adauga rosu (Bootstrap invalid state)
        } else {
            this.classList.remove("is-invalid"); // Revine la normal daca e gol sau >= 3
        }
    });

    // Algoritm Distanta Levenshtein (pentru greseala de maxim 2 litere)
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

    let containarProduse = document.querySelector(".grid-produse");
    let articoleInitiale = Array.from(document.querySelectorAll(".produs"));

    // --- FILTRAREA ---
    btnFiltrare.onclick = function() {
        let valNume = document.getElementById("i_nume").value.toLowerCase().trim();
        let valPret = parseFloat(rngPret.value);
        let valCuloare = document.getElementById("i_culoare").value.toLowerCase().trim();
        let valRgb = document.querySelector("input[name='rad_rgb']:checked").value;
        let valDesc = document.getElementById("i_descriere").value.toLowerCase().trim();
        let valSubcat = document.getElementById("i_subcat").value;

        if (iDescriere.classList.contains("is-invalid")) {
            alert("Eroare: Descrierea trebuie să aibă minim 3 caractere!");
            return; // Oprește filtrarea
        }

        // Validare: Nu permitem cifre in inputul de text pentru nume
        if(valNume.match(/[0-9]/)) {
            alert("Eroare: Numele nu poate conține cifre!");
            document.getElementById("i_nume").style.borderColor = "red";
            return;
        } else {
            document.getElementById("i_nume").style.borderColor = "";
        }

        let checkPorturi = document.querySelectorAll(".chk-port");

        for(let art of articoleInitiale) {
            art.style.display = "none"; // Ascundem default

            let numeArt = art.dataset.nume.toLowerCase();
            let pretArt = parseFloat(art.dataset.pret);
            let culArt = art.dataset.culoare.toLowerCase();
            let rgbArt = art.dataset.rgb;
            let descArt = art.querySelector(".descriere-produs").textContent.toLowerCase();
            let subcatArt = art.dataset.subcat;
            let porturiArt = art.dataset.porturi;

            // 1. Conditie Nume (cu Levenshtein)
            let condNume = false;
            if(valNume === "") {
                condNume = true;
            } else {
                let cuvinteNume = numeArt.split(" ");
                for(let cuv of cuvinteNume) {
                    if(distantaLevenshtein(valNume, cuv) <= 2 || cuv.includes(valNume)) {
                        condNume = true;
                        break;
                    }
                }
            }

            // Restul conditiilor
            let condPret = pretArt <= valPret;
            let condCul = (valCuloare === "" || culArt === valCuloare);
            let condRgb = (valRgb === "toate" || rgbArt === valRgb);
            let condDesc = (valDesc === "" || descArt.includes(valDesc));
            let condSubcat = (valSubcat === "toate" || subcatArt === valSubcat);

            // Filtru strict: Checkbox + Radio
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

            // Daca trece de TOATE filtrele, il afisam
            if(condNume && condPret && condCul && condRgb && condDesc && condSubcat && condComplex) {
                art.style.display = "block";
            }
        }
    }

    // --- SORTAREA DUBLA ---
    function sorteaza(semn) {
        let articoleCurente = Array.from(containarProduse.querySelectorAll(".produs"));

        articoleCurente.sort(function(a, b) {
            // Cheia 1: Raportul Putere / Pret
            let raportA = parseFloat(a.dataset.putere) / parseFloat(a.dataset.pret);
            let raportB = parseFloat(b.dataset.putere) / parseFloat(b.dataset.pret);

            if(Math.abs(raportA - raportB) < 0.0001) { // Daca sunt egale
                // Cheia 2: Subcategoria (alfabetic)
                return semn * a.dataset.subcat.localeCompare(b.dataset.subcat);
            }
            return semn * (raportA - raportB);
        });

        // Reatasam in DOM in noua ordine
        for(let art of articoleCurente) {
            containarProduse.appendChild(art);
        }
    }

    btnSortAsc.onclick = () => sorteaza(1);
    btnSortDesc.onclick = () => sorteaza(-1);

    // --- CALCULARE (Div care dispare in 2 sec) ---
    btnCalc.onclick = function() {
        let suma = 0;
        let numarProduse = 0;
        for(let art of articoleInitiale) {
            if(art.style.display !== "none") {
                suma += parseFloat(art.dataset.pret);
                numarProduse++;
            }
        }

        let divInfo = document.createElement("div");
        divInfo.innerHTML = `Valoare afișată: <b>${suma} RON</b> (${numarProduse} produse)`;
        divInfo.style.cssText = "position:fixed; bottom:20px; right:20px; padding:15px; background:var(--color-primary); color:black; border-radius:8px; z-index:9999; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";

        document.body.appendChild(divInfo);

        // Dispari dupa 2 secunde (2000 ms)
        setTimeout(() => divInfo.remove(), 2000);
    }

    // --- RESETARE ---
    btnReset.onclick = function() {
        if(confirm("Ești sigur că vrei să resetezi toate filtrele?")) {
            // Reset inputuri
            document.getElementById("i_nume").value = "";
            document.getElementById("i_nume").style.borderColor = "";
            rngPret.value = 10000;
            valCurent.innerHTML = "10000";
            document.getElementById("i_culoare").value = "";
            document.querySelector("input[name='rad_rgb'][value='toate']").checked = true;
            document.getElementById("i_descriere").value = "";
            document.getElementById("i_subcat").value = "toate";

            let checkPorturi = document.querySelectorAll(".chk-port");
            for(let chk of checkPorturi) chk.checked = false;
            document.querySelector("input[name='rad_hdmi'][value='are']").checked = true;
            document.querySelector("input[name='rad_dp'][value='are']").checked = true;
            document.querySelector("input[name='rad_usb'][value='are']").checked = true;

            // Aratam toate produsele si punem in ordinea initiala
            for(let art of articoleInitiale) {
                art.style.display = "block";
                containarProduse.appendChild(art);
            }
        }
    }
});