document.addEventListener("DOMContentLoaded", function() {
    const box1 = document.getElementById("box1");
    const box2 = document.getElementById("box2");
    const box2Button = document.getElementById("box2-button");

    box2Button.addEventListener("click", function() {
        alert("You clicked on Box 2!");
    });
});