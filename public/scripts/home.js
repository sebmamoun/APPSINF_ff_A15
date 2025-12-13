const searchInput = document.querySelector('.search-container .input');
const table = document.getElementById('aliment-table');
const rows = table.getElementsByTagName('tr');

searchInput.addEventListener('input', () => {

    const filter = searchInput.value.toLowerCase();

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let match = false;

        for (let j = 0; j < cells.length; j++) {
            const text = cells[j].textContent.toLowerCase();

            if (text.includes(filter)) {
                match = true;
                break; 
                }
            }
        rows[i].style.display = match ? '' : 'none';
    }
});