document.addEventListener("DOMContentLoaded", function() {
    const leftbox = document.querySelector(".box1");
    const rightbox = document.querySelector(".box2");
    const HigherBtn = document.getElementById("higher");
    const LowerBtn = document.getElementById("lower");
    const scoreSpan = document.getElementById("score");


    function updateScore() {
        scoreSpan.textContent = window.score;
    }
    
   function updateBoxes() {
    leftbox.querySelector("h2").textContent = window.leftFood.name;
    leftbox.querySelector("p").textContent = `Protéine: ${window.leftFood.prot} g`;
    rightbox.querySelector("h2").textContent = window.rightFood.name;
   }

   async function getRandomFood() {
    const response = await fetch("/random-food");
    const data = await response.json();
    return { name: data.name, prot: data.prot };
    }
    
    //isHigher est true si on clique sur "Plus" et false si on clique sur "Moins"

    //si bonne réponse, on incrémente le score et on met à jour les boîtes
    //et on remplace la boîte de gauche par celle de droite et on génère une nouvelle boîte de droite
    
    //si mauvaise réponse, on affiche le score et on réinitialise le jeu
    async function handleGuess(isHigher) {
        const correct = (isHigher && window.leftFood.prot > window.rightFood.prot) ||
                        (!isHigher && window.leftFood.prot < window.rightFood.prot);
        if (correct) {
            window.score++;
            updateScore();
            const newRight = await getRandomFood();
            window.leftFood = window.rightFood;
            window.rightFood = newRight;
            updateBoxes();
        } else {
            alert(`Game Over! Votre score est de ${window.score}!`);
            window.score = 0;
            updateScore();
            const newLeft = await getRandomFood();
            const newRight = await getRandomFood();
            window.leftFood = newLeft;
            window.rightFood = newRight;
            updateBoxes();
        }
    }
    HigherBtn.addEventListener("click", () => handleGuess(true));
    LowerBtn.addEventListener("click", () => handleGuess(false));
    updateBoxes();
    updateScore();
});
