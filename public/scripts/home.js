const foods = window.FOODS || []; // window makes the transfer of data from ejs to js
const searchInput = document.querySelector(".input");
const tbody = document.querySelector("tbody");

function tokken (text){
    return text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean); 
    //Remove all characters that are not letters or spaces. ^ means not, \s means space, /g  means all and not the first one
    //Split by space, tab, /n.
    //Remove empty string
}

function tfScore(word, doc) {
    if (doc.length === 0) {
        return 0;
    }
    let count = 0;
    for (let i = 0; i < doc.length; i++) {
        if (doc[i].startsWith(word)) {
            count++;
        }
    }
    return Math.log(1+(count/doc.length));
}

function idfScore(word, docs) {
    let docsWithWord = 0;
    for (let i = 0; i < docs.length; i++) {
        if (docs[i].some(w => w.startsWith(word))) {
            docsWithWord++;
        }
    }
    // Avoids division by 0
    if (docsWithWord === 0) {
        return Math.log(docs.length); //It doesn t return 0, bc the word is important
    }
    return Math.log(docs.length / docsWithWord);
}

function tfIdfScore(words, doc, docs) {
    let score = 0;
    words.forEach(word => {
        const tf = tfScore(word, doc);
        const idf = idfScore(word, docs);
        score += tf * idf;
    });
    return score;
}

function renderTable(data) {
    tbody.innerHTML = ""; //remove all existing rows
    // show no result when no result
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">Aucun résultat.</td> 
            </tr>
        `;
        return;
    }
    data.forEach(food => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${food.description}</td>
            <td>${food.proteine}</td>
            <td>${food.user}</td>
            <td>${food.date ? food.date.split("T")[0] : "N/A"}</td>
        `; // date look like "2024-10-12T00:00:00.000Z", so it remove things after the T

        tbody.appendChild(tr);
    });
}

searchInput.addEventListener("input", () => {
    let search = searchInput.value.trim(); // trim removes extra space at the end and beginning
    if (search === "") {
        renderTable(foods); //render the full table
        return; // stop the fonction
    }

    search = tokken(search);

    if (search.length > 20) {
        searchInput.value = search.substring(0, 20);
        return;
    }

    const docs = foods.map(f => // map loops over every element of an array
        tokken(f.description)
    );

    let scores = [];
    for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        const doc = docs[i];
        const score = tfIdfScore(search, doc, docs);
        const foodWithScore = {
            description: food.description,
            proteine: food.proteine,
            user: food.user,
            date: food.date,
            score: score
        };
    scores.push(foodWithScore);
    }
    scores = scores.filter(f => f.score > 0).sort((a, b) => b.score - a.score);
    renderTable(scores);
    
});

renderTable(foods);