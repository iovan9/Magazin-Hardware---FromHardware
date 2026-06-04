class Produs {
    constructor({ id, nume, descriere, imagine, categorie, subcategorie, pret, putere_w, data_adaugare, culoare, porturi, iluminare_rgb } = {}) {
        this.id = id;
        this.nume = nume;
        this.descriere = descriere;
        this.pret = pret;
        this.putere_w = putere_w;
        this.categorie = categorie;
        this.subcategorie = subcategorie;
        this.iluminare_rgb = iluminare_rgb;
        this.porturi = porturi;
        this.culoare = culoare;
        this.imagine = imagine;
        this.data_adaugare = data_adaugare;
    }
}

module.exports = Produs;