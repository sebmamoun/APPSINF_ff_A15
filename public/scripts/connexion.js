let loginSwitchButton = document.getElementById("login-switch");
let loginSection = document.querySelector(".login");

loginSwitchButton.addEventListener("click", () => {
    loginSection.classList.toggle("hidden");
});