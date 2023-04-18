const func = async () => {
    const response = await window.functions.address();
    document.getElementById('address').value = response.address + ':' +response.port;

}
func();

function resetGame() {
    let boxes = document.getElementsByClassName('box');
    Array.from(boxes).forEach((box) => {
        box.classList.remove('bg-[url(\'img/rock.svg\')]', 'bg-[url(\'img/paper.svg\')]', 'bg-[url(\'img/scissors.svg\')]', 'bg-contain',  'bg-center', 'bg-no-repeat', 'bg-origin-content', 'p-1', 'bg-amber-600', 'bg-red-600', 'bg-emerald-500');
        box.classList.add('bg-neutral-100');
    });
}

function closeP1() {
    resetGame();
    window.functions.closeP1();
}

function closeP2() {
    resetGame();
    window.functions.closeP2();
}

function closeAll() {
    window.functions.closeAll();
}