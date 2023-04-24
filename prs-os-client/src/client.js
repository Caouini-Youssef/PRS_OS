
function connect() {
    document.getElementById('connected').classList.replace('bg-red-600', 'bg-emerald-500');
    let address = document.getElementById('address').value;
    window.functions.connect(address);
}


function closeSocket() {
    window.functions.close();
}


function makeMove(move) {
    console.log(move);
    window.functions.makeMove(move);
}