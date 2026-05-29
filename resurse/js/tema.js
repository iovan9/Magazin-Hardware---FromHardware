document.addEventListener("DOMContentLoaded", function() {
    const btnTema = document.getElementById("btn-tema");
    const iconTema = document.getElementById("icon-tema");

    // PLASA DE SIGURANȚĂ:
    if (!btnTema || !iconTema) return;

    // Citim tema din memorie (implicit dark)
    const temaCurenta = localStorage.getItem("tema") || "dark";

    if (temaCurenta === "light") {
        document.body.classList.add("light-theme");
        btnTema.checked = true;
        iconTema.classList.replace("fa-moon", "fa-sun");
    }

    // La apasarea pe switch
    btnTema.addEventListener("change", function() {
        if (this.checked) {
            document.body.classList.add("light-theme");
            localStorage.setItem("tema", "light");
            iconTema.classList.replace("fa-moon", "fa-sun");
        } else {
            document.body.classList.remove("light-theme");
            localStorage.setItem("tema", "dark");
            iconTema.classList.replace("fa-sun", "fa-moon");
        }
    });
});