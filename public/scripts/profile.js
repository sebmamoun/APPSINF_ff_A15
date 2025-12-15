if (macros) {
    document.getElementById("calories-circle").value =
        Math.min((macros.calories / 2500) * 100, 100);

    document.getElementById("proteines-circle").value =
        Math.min((macros.prot / 180) * 100, 100);

    document.getElementById("glucides-circle").value =
        Math.min((macros.prot / 250) * 100, 100);

    document.getElementById("lipides-circle").value =
        Math.min((macros.prot / 80) * 100, 100);
}