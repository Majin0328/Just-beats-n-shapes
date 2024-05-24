window.onload = function () {
    setTimeout(function () {
        document.getElementById('onload').style.display = 'none';
        document.body.classList.remove('hidden');
    }, 3000); // 3000 milisegundos = 3 segundos
};

const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// Obtiene las dimensiones de la pantalla actual
const window_height = window.innerHeight * .80;
const window_width = window.innerWidth * .80;

// script.js
let lastX = 0;
let lastY = 0;
let positions = [];

const trails = [
    document.getElementById('trail1'),
    document.getElementById('trail2'),
    document.getElementById('trail3')
];

document.addEventListener('mousemove', function (e) {
    const customCursor = document.getElementById('customCursor');

    // Calcular la dirección del movimiento
    const deltaX = e.pageX - lastX;
    const deltaY = e.pageY - lastY;

    // Calcular el ángulo de inclinación
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    // Mover el cursor
    customCursor.style.left = e.pageX + 'px';
    customCursor.style.top = e.pageY + 'px';
    customCursor.style.transform = `rotate(${angle}deg)`;

    // Actualizar las últimas posiciones
    lastX = e.pageX;
    lastY = e.pageY;

    // Guardar la posición actual
    positions.push({ x: e.pageX, y: e.pageY });

    // Limitar el tamaño del array de posiciones
    if (positions.length > 20) {
        positions.shift();
    }

    // Mover los puntos de la estela con retraso
    trails.forEach((trail, index) => {
        const pos = positions[positions.length - (index * 7) - 1];
        if (pos) {
            trail.style.left = pos.x + 'px';
            trail.style.top = pos.y + 'px';
            trail.style.transform = `rotate(${angle}deg)`;
        }
    });
});

canvas.style.background = "black";

let mouseX = 0;
let mouseY = 0;

let score = 0;
let level = 1;
let maxScore = localStorage.getItem('maxScore') || 0;
let gameOver = false;  // Flag to check if the game is over
let scoreInterval; // Variable para almacenar el intervalo del puntaje

// Función para actualizar el puntaje cada segundo
function updateScore() {
    scoreInterval = setInterval(function () {
        if (!gameOver) { // Solo aumentar el puntaje si no hay game over
            score += 10;
            
        }
    }, 1000);
}

updateScore();

// Función para dibujar el puntaje en el lienzo
function drawScore(context) {
    context.font = "20px Arial";
    context.fillStyle = "#fff";
    context.fillText("Score: " + score, window_width - 150, 50);
    context.fillText("Max Score: " + maxScore, window_width - 150, 80);
}

canvas.height = window_height;
canvas.width = window_width;

function xyMouse(event) {
    let rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
}

function drawMousePosition(context) {
    context.font = "20px Arial";
    context.fillStyle = "#fff";
    context.fillText("x: " + mouseX.toFixed(2) + " y: " + mouseY.toFixed(2), window_width - 200, 20);
}

// Agregar el tiempo de inicio del juego
let startTime = Date.now();

function drawGameTime(context) {
    const elapsedTime = Date.now() - startTime;
    const seconds = (elapsedTime / 1000).toFixed(2);
    context.font = "20px Arial";
    context.fillStyle = "#fff";
    context.fillText("Time " + seconds + "s", window_width - 150, 20);
}

class Circle {
    constructor(x, y, radius, color, speed, dx, dy) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.dx = dx;
        this.dy = dy;
    }

    draw(context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
        context.fill();
        context.closePath();
    }

    update(context) {
        this.posX += this.dx * this.speed;
        this.posY += this.dy * this.speed;

        this.draw(context);
    }

    isOutOfBounds() {
        return (
            this.posX + this.radius < -this.radius || // Fuera por la izquierda
            this.posX - this.radius > window_width + this.radius || // Fuera por la derecha
            this.posY + this.radius < -this.radius || // Fuera por arriba
            this.posY - this.radius > window_height + this.radius // Fuera por abajo
        );
    }
}

function getDistance(posX1, posY1, posX2, posY2) {
    return Math.sqrt(Math.pow((posX2 - posX1), 2) + Math.pow((posY2 - posY1), 2));
}

let miCirculos = [];

// Ángulos de las 5 direcciones (patrón de estrella)
const directionsEstrella = [
    { dx: 0, dy: -1 },   // Arriba
    { dx: 0.951, dy: -0.309 },  // Arriba derecha
    { dx: 0.588, dy: 0.809 },   // Abajo derecha
    { dx: -0.588, dy: 0.809 },  // Abajo izquierda
    { dx: -0.951, dy: -0.309 }  // Arriba izquierda
];

const directionsOctagono = [
    { dx: 1, dy: 0 },           // Derecha
    { dx: 0.707, dy: -0.707 },  // Arriba derecha
    { dx: 0, dy: -1 },          // Arriba
    { dx: -0.707, dy: -0.707 }, // Arriba izquierda
    { dx: -1, dy: 0 },          // Izquierda
    { dx: -0.707, dy: 0.707 },  // Abajo izquierda
    { dx: 0, dy: 1 },           // Abajo
    { dx: 0.707, dy: 0.707 }    // Abajo derecha
];

const directionsTriangulo = [
    { dx: 0.5, dy: -0.866 },  // Arriba derecha
    { dx: -1, dy: 0 },        // Izquierda
    { dx: 0.5, dy: 0.866 }    // Abajo derecha
];

const directionsCuadrado = [
    { dx: 1, dy: 0 },  // Derecha
    { dx: 0, dy: 1 },  // Abajo
    { dx: -1, dy: 0 }, // Izquierda
    { dx: 0, dy: -1 }  // Arriba
];

const directionsHexagono = [
    { dx: 1, dy: 0 },           // Derecha
    { dx: 0.5, dy: -0.866 },    // Arriba derecha
    { dx: -0.5, dy: -0.866 },   // Arriba izquierda
    { dx: -1, dy: 0 },
// Izquierda
{ dx: -0.5, dy: 0.866 },    // Abajo izquierda
{ dx: 0.5, dy: 0.866 }      // Abajo derecha
];

// Tiempo de espera entre la aparición de cada grupo de círculos (en milisegundos)
const intervaloAparicion = 2000; // 2 segundos por defecto
const intervaloAparicion1s = 1000; // 1 segundo por defecto

function createCirclesGroup(x, y, radius = 50, speed = 8) {
for (let i = 0; i < directionsEstrella.length; i++) {
    let direction = directionsEstrella[i];
    let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy);
    miCirculos.push(miCirculo);
}
flashScreen();
}

function createCirclesGroup1(x, y, radius = 20, speed = 8) {
for (let i = 0; i < directionsOctagono.length; i++) {
    let direction = directionsOctagono[i];
    let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy);
    miCirculos.push(miCirculo);
}
flashScreen();
}

function createCirclesGroup2(x, y, radius = 60, speed = 8) {
for (let i = 0; i < directionsTriangulo.length; i++) {
    let direction = directionsTriangulo[i];
    let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy);
    miCirculos.push(miCirculo);
}
flashScreen();
}

function createCirclesGroup3(x, y, radius = 30, speed = 8) {
for (let i = 0; i < directionsHexagono.length; i++) {
    let direction = directionsHexagono[i];
    let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy);
    miCirculos.push(miCirculo);
}
flashScreen();
}

function initializeCircles() {
const offset = 50;
const offset1 = 100;

// Generar primer grupo
createCirclesGroup(window_width / 2, offset, 10, 10);
setTimeout(() => createCirclesGroup1(window_width / 3, offset1, 30, 10), intervaloAparicion); 
setTimeout(() => createCirclesGroup2(window_width / 4, offset1, 15, 10), intervaloAparicion * 2); 
setTimeout(() => createCirclesGroup3(window_width / 5, offset1, 25, 10), intervaloAparicion * 3); 

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 0 * intervaloAparicion); // Medio

setTimeout(() => {
    createCirclesGroup1(offset, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup1(window_width - offset, offset); // Esquina superior derecha
}, 1 * intervaloAparicion);
createCirclesGroup2(window_width / 2, window_height / 2); // Medio
    setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2), 5 * intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup2(3 * window_width / 4, window_height / 2), 6 * intervaloAparicion); // Derecha

    // Crear grupos en las esquinas movidos un poco hacia adentro
    
    setTimeout(() => {
        createCirclesGroup2(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup2(window_width - offset, offset); // Esquina superior derecha
    }, 7 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup2(offset, offset); // Esquina superior izquierda
        createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 8 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 4, window_height / 2), 9* intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup(3 * window_width / 4, window_height / 2), 9 * intervaloAparicion); // Derecha

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 10 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup1(offset1, offset); // Esquina superior izquierda
        createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 11 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 12 * intervaloAparicion); // Medio

    setTimeout(() => {
        createCirclesGroup3(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
    }, 13 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup1(offset, offset); // Esquina superior izquierda
        createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 14 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 4, window_height / 2), 15* intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup(3 * window_width / 4, window_height / 2), 16 * intervaloAparicion); // Derecha

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 17 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup(offset1, offset); // Esquina superior izquierda
        createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 18 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 25 * intervaloAparicion); // Medio

    setTimeout(() => {
        createCirclesGroup(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 19 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup(offset, offset); // Esquina superior izquierda
        createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 20 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 4, window_height / 2), 21 * intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup(3 * window_width / 4, window_height / 2), 22 * intervaloAparicion); // Derecha

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 23 * intervaloAparicion);

    setTimeout(() => {
        createCirclesGroup(offset1, offset); // Esquina superior izquierda
        createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 24 * intervaloAparicion);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 26 * intervaloAparicion); // Medio

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 42 * intervaloAparicion1s);

    setTimeout(() => {
        createCirclesGroup(offset1, offset); // Esquina superior izquierda
        createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 43 * intervaloAparicion1s);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 54 * intervaloAparicion1s); // Medio

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 55 * intervaloAparicion1s);

    setTimeout(() => {
        createCirclesGroup2(offset1, offset); // Esquina superior izquierda
        createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 56 * intervaloAparicion1s);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 58 * intervaloAparicion1s); // Medio

    setTimeout(() => {
        createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
    }, 60 * intervaloAparicion1s);

    setTimeout(() => {
        createCirclesGroup1(offset1, offset); // Esquina superior izquierda
        createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 61 * intervaloAparicion1s);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 62 * intervaloAparicion1s); // Medio

    setTimeout(() => {
        createCirclesGroup1(offset1, offset); // Esquina superior izquierda
        createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 62 * intervaloAparicion1s);

    setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), 63 * intervaloAparicion1s); // Medio

    setTimeout(() => {
        createCirclesGroup1(offset1, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup1(window_width - offset, offset); // Esquina superior derecha
    }, 64 * intervaloAparicion1s);

    setTimeout(() => {
        createCirclesGroup1(offset1, offset); // Esquina superior izquierda
        createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 65 * intervaloAparicion1s);

    setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 66 * intervaloAparicion1s); // Medio
}

initializeCircles();

canvas.addEventListener("click", function(event) {
const mouseX = event.clientX;
const mouseY = event.clientY;

for (let i = miCirculos.length - 1; i >= 0; i--) {
    const circulo = miCirculos[i];
    const distanciaAlCentro = getDistance(mouseX, mouseY, circulo.posX, circulo.posY);
        if (distanciaAlCentro <= circulo.radius) {
            miCirculos.splice(i, 1);
            ctx.clearRect(0, 0, window_width, window_height);
            miCirculos.forEach(circulo => circulo.draw(ctx));
            break;
        }
    }
});

let updateCircles = function () {
    if (gameOver) {
        clearInterval(scoreInterval); // Detener el intervalo de puntaje cuando hay game over
        ctx.clearRect(0, 0, window_width, window_height);
        ctx.font = "50px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Game Over", window_width / 2 - 150, window_height / 2);

        // Añadir el botón de recarga
        const reloadButton = document.createElement('button');
        reloadButton.innerHTML = "TRY AGAIN";
        reloadButton.style.position = 'absolute';
        reloadButton.style.left = (window_width / 2 + 50) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.top = (window_height / 2 + 200) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.padding = '10px 20px';
        reloadButton.style.fontSize = '20px';
        reloadButton.style.backgroundColor = 'white';
        reloadButton.style.color = 'black';
        reloadButton.style.border = 'none';
        reloadButton.style.borderRadius = '5px';
        reloadButton.style.cursor = 'pointer';
        document.body.appendChild(reloadButton);

        reloadButton.addEventListener('click', function() {
            location.reload();
        });

        // Actualizar el max score si es necesario
        if (score > maxScore) {
            maxScore = score;
            localStorage.setItem('maxScore', maxScore);
        }

        stopAudio();  // Detener la música cuando el juego termine
        return; // Detiene el juego
    }

    requestAnimationFrame(updateCircles);
    ctx.clearRect(0, 0, window_width, window_height);

    drawGameTime(ctx); // Dibujar el tiempo de juego
    drawScore(ctx); // Dibujar el puntaje

    for (let i = miCirculos.length - 1; i >= 0; i--) {
        let circulo = miCirculos[i];
        circulo.update(ctx);

        // Verificar colisión con el cursor
        const distanciaAlCursor = getDistance(mouseX, mouseY, circulo.posX, circulo.posY);
        if (distanciaAlCursor <= circulo.radius) {
            gameOver = true;
        }

        // Eliminar el círculo si sale de los límites
        if (circulo.isOutOfBounds()) {
            miCirculos.splice(i, 1);
        }
    }

    miCirculos.forEach(circulo => circulo.draw(ctx));
};

function playAudio() {
    const audio = document.getElementById("Chronos");
    audio.play();
    audio.loop = true;  // Asegurar que el audio esté en loop
}

function stopAudio() {
    const audio = document.getElementById("Chronos");
    audio.pause();
    audio.currentTime = 0; // Reiniciar el audio
}

updateCircles();
playAudio();  // Iniciar la música cuando se carga la página

canvas.addEventListener("mousemove", xyMouse);

canvas.addEventListener("click", function(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    console.log(`Clic en X: ${mouseX}, Y: ${mouseY}`);
});

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateCircles() {
    const centerX = window_width / 2;
    const centerY = window_height / 2;
    const radius = 10;
    const speed = 2;
    const color = "red";
    const directions = [directionsEstrella, directionsOctagono, directionsTriangulo, directionsCuadrado, directionsHexagono];
    const selectedPattern = directions[Math.floor(Math.random() * directions.length)];

    selectedPattern.forEach(direction => {
        const circle = new Circle(centerX, centerY, radius, color, speed, direction.dx, direction.dy);
        miCirculos.push(circle);
    });
}

function flashScreen() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = 0.15;
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = 9999;

    document.body.appendChild(flash);

    setTimeout(() => {
        flash.style.transition = 'opacity 0.5s';
        flash.style.opacity = 0;
        flash.addEventListener('transitionend', () => {
            document.body.removeChild(flash);
        });
    }, 100);
}

