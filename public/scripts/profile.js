(async () => {
    console.log("macros =", macros);
    
    await customElements.whenDefined("circle-progress");

    if (!macros) return;

    const caloriesPct  = Math.min((macros.calories / 2500) * 100, 100);
    const protPct      = Math.min((macros.prot / 180) * 100, 100);
    const glucidesPct  = Math.min((macros.glucides / 250) * 100, 100);
    const lipidesPct   = Math.min((macros.lipides / 80) * 100, 100);

    document.getElementById("calories-circle").setAttribute("value", caloriesPct);
    document.getElementById("proteines-circle").setAttribute("value", protPct);
    document.getElementById("glucides-circle").setAttribute("value", glucidesPct);
    document.getElementById("lipides-circle").setAttribute("value", lipidesPct);
})();

