document.addEventListener("DOMContentLoaded", function() {
    const HigherBtn = document.getElementById("higher");
    const LowerBtn = document.getElementById("lower");

    HigherBtn.addEventListener("click", () => {
        alert("You clicked Higher!");
    });
    
    LowerBtn.addEventListener("click", () => {
        alert("You clicked Lower!");
    });
});