const buttonSwitchRegister = document.getElementById("login-switch");
const buttonSwitchLogin = document.getElementById("register-switch");

const sectionLogin = document.querySelector("section.login");
const sectionRegister = document.querySelector("section.register");

function showLogin() {
  sectionLogin.style.display = "flex";
  sectionRegister.style.display = "none";
}

function showRegister() {
  sectionLogin.style.display = "none";
  sectionRegister.style.display = "flex";
}

showLogin();

buttonSwitchRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showRegister();
});

buttonSwitchLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});