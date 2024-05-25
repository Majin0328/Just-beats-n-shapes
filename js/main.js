const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// Obtiene las dimensiones de la pantalla actual
const window_height = window.innerHeight * 0.80;
const window_width = window.innerWidth * 0.80;

let lastX = 0;
let lastY = 0;
let positions = [];

var imagen = new Image();
imagen.src = 'img/background1.jpg'; // Reemplaza esto con la ruta a tu imagen de fondo

imagen.onload = function () {
    ctx.drawImage(imagen, 0, 0, window_width, window_height); // Dibujar la imagen de fondo cuando se haya cargado
};

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

let mouseX = 0;
let mouseY = 0;

let score = 0;
let level = 1;
let maxScore = localStorage.getItem('maxScore') || 0;
let gameOver = false;  // Flag to check if the game is over
let YouWin = false;
let scoreInterval; // Variable para almacenar el intervalo del puntaje

function activateGameOverAfterTimeLimit() {
    setTimeout(function() {
        gameOver=true;
        YouWin = true;
    }, 85000); // 50 segundos expresados en milisegundos
}
// Al inicio del juego, después de inicializar todo
activateGameOverAfterTimeLimit();
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
    constructor(x, y, radius, color, speed, dx, dy, image) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.dx = dx;
        this.dy = dy;
        this.image = image;
    }

    draw(context) {
        context.beginPath();
        if (this.image) {
            context.drawImage(this.image, this.posX - this.radius, this.posY - this.radius, this.radius * 2, this.radius * 2);
        } else {
            context.fillStyle = this.color;
            context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
            context.fill();
        }
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

class Square {
    constructor(x, y, size, image) {
        this.posX = x;
        this.posY = y;
        this.size = size;
        this.image = image;
        this.opacity = 0; // Inicialmente invisible
        this.appearing = true; // Estado de aparición
        this.disappearing = false; // Estado de desaparición
        this.creationTime = Date.now(); // Tiempo de creación
    }

    draw(context) {
        context.globalAlpha = this.opacity;
        context.drawImage(this.image, this.posX, this.posY, this.size, this.size);
        context.globalAlpha = 1.0; // Resetear la opacidad a 1
    }

    update(context) {
        // Manejar la animación de aparición y desaparición
        if (this.appearing) {
            this.opacity += 0.05;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.appearing = false;
            }
        } else if (this.disappearing) {
            this.opacity -= 0.05;
            if (this.opacity <= 0) {
                this.opacity = 0;
                this.disappearing = false;
            }
        }

        // Verificar si han pasado 3 segundos para desaparecer
        if (Date.now() - this.creationTime >= 3000) {
            this.disappearing = true;
        }

        this.draw(context);
    }

    containsPoint(x, y) {
        return x > this.posX && x < this.posX + this.size && y > this.posY && y < this.posY + this.size;
    }

    isFullyTransparent() {
        return this.opacity <= 0;
    }
}

function getDistance(posX1, posY1, posX2, posY2) {
    return Math.sqrt(Math.pow((posX2 - posX1), 2) + Math.pow((posY2 - posY1), 2));
}

let miCirculos = [];
let miCuadrados = [];

// Ángulos de las 5 direcciones (patrón de estrella)
const directionsEstrella = [
    { dx: 0, dy: -1 }, // Arriba
    { dx: 0.951, dy: -0.309 }, // Arriba derecha
    { dx: 0.588, dy: 0.809 }, // Abajo derecha
    { dx: -0.588, dy: 0.809 }, // Abajo izquierda
    { dx: -0.951, dy: -0.309 } // Arriba izquierda
];

const directionsOctagono = [
    { dx: 1, dy: 0 }, // Derecha
    { dx: 0.707, dy: -0.707 }, // Arriba derecha
    { dx: 0, dy: -1 }, // Arriba
    { dx: -0.707, dy: -0.707 }, // Arriba izquierda
    { dx: -1, dy: 0 }, // Izquierda
    { dx: -0.707, dy: 0.707 }, // Abajo izquierda
    { dx: 0, dy: 1 }, // Abajo
    { dx: 0.707, dy: 0.707 } // Abajo derecha
];

const directionsTriangulo = [
    { dx: 0.5, dy: -0.866 }, // Arriba derecha
    { dx: -1, dy: 0 }, // Izquierda
    { dx: 0.5, dy: 0.866 } // Abajo derecha
];

const directionsCuadrado = [
    { dx: 1, dy: 0 }, // Derecha
    { dx: 0, dy: 1 }, // Abajo
    { dx: -1, dy: 0 }, // Izquierda
    { dx: 0, dy: -1 } // Arriba
];

const directionsHexagono = [
    { dx: 1, dy: 0 }, // Derecha
    { dx: 0.5, dy: -0.866 }, // Arriba derecha
    { dx: -0.5, dy: -0.866 }, // Arriba izquierda
    { dx: -1, dy: 0 },
    // Izquierda
    { dx: -0.5, dy: 0.866 }, // Abajo izquierda
    { dx: 0.5, dy: 0.866 } // Abajo derecha
];


const intervaloAparicion = 2000; // 2 segundos por defecto
const intervaloAparicion1s = 1000; // 1 segundo por defecto

function createCirclesGroup(x, y, radius = 50, speed = 8) {
    for (let i = 0; i < directionsEstrella.length; i++) {
        let direction = directionsEstrella[i];
        let img = new Image();
        img.src = 'img/Enemy2.png'; // Reemplaza 'ruta_de_tu_imagen1.jpg' con la ruta real de tu imagen
        let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy, img);
        miCirculos.push(miCirculo);
    }
    flashScreen();
}

    function createCirclesGroup1(x, y, radius = 20, speed = 8) {
        for (let i = 0; i < directionsOctagono.length; i++) {
            let direction = directionsOctagono[i];
            let img = new Image();
            img.src = 'img/Enemy.png'; // Reemplaza 'ruta_de_tu_imagen2.jpg' con la ruta real de tu imagen
            let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy, img);
            miCirculos.push(miCirculo);
        }
        flashScreen();
    }
    
    function createCirclesGroup2(x, y, radius = 60, speed = 8) {
        for (let i = 0; i < directionsTriangulo.length; i++) {
            let direction = directionsTriangulo[i];
            let img = new Image();
            img.src = 'img/Enemy.png'; // Reemplaza 'ruta_de_tu_imagen3.jpg' con la ruta real de tu imagen
            let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy, img);
            miCirculos.push(miCirculo);
        }
        flashScreen();
    }
    
    function createCirclesGroup3(x, y, radius = 30, speed = 8) {
        for (let i = 0; i < directionsHexagono.length; i++) {
            let direction = directionsHexagono[i];
            let img = new Image();
            img.src = 'img/Enemy4.png'; // Reemplaza 'ruta_de_tu_imagen4.jpg' con la ruta real de tu imagen
            let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy, img);
            miCirculos.push(miCirculo);
        }
        flashScreen();
    }
    
    function createCirclesGroup4(x, y, radius = 30, speed = 8) {
        for (let i = 0; i < directionsCuadrado.length; i++) {
            let direction = directionsCuadrado[i];
            let img = new Image();
            img.src = 'img/Enemy6.png'; // Reemplaza 'ruta_de_tu_imagen4.jpg' con la ruta real de tu imagen
            let miCirculo = new Circle(x, y, radius, "red", speed, direction.dx, direction.dy, img);
            miCirculos.push(miCirculo);
        }
        flashScreen();
    }


function createSquare() {
    const x = Math.random() * (window_width - 25);
    const y = Math.random() * (window_height - 25);
    const img = new Image();
    img.src = 'img/cube.png'; // Ruta de la imagen del cuadrado
    const square = new Square(x, y, 50, img);
    miCuadrados.push(square);
}

function initializeCircles() {
    const offset = 100;
    const offset1 = 200;
    setTimeout(() => {
        createCirclesGroup2(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup2(window_width - offset, offset); // Esquina superior derecha
    }, 1 * intervaloAparicion);
    createCirclesGroup(window_width / 2, window_height / 2); // Medio
    setTimeout(() => createCirclesGroup(window_width / 4, window_height / 2), 1 * intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup(3 * window_width / 4, window_height / 2), 2 * intervaloAparicion); // Derecha

    setTimeout(() => {
        createCirclesGroup1(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup1(window_width - offset, offset); // Esquina superior derecha
    }, 3 * intervaloAparicion);
    setTimeout(() => {
        createCirclesGroup4(offset, offset); // Esquina superior izquierda
        createCirclesGroup4(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 4 * intervaloAparicion);
    createCirclesGroup(window_width / 2, window_height / 2); // Medio
    setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2), 5 * intervaloAparicion); // Izquierda
    setTimeout(() => createCirclesGroup2(3 * window_width / 4, window_height / 2), 6 * intervaloAparicion); // Derecha

    // Crear grupos en las esquinas movidos un poco hacia adentro

    setTimeout(() => {
        createCirclesGroup2(offset, window_height - offset); // Esquina inferior izquierda
        createCirclesGroup2(window_width - offset, offset); // Esquina superior derecha
    }, 7 * intervaloAparicion);
    setTimeout(() => {
        createCirclesGroup(offset, offset); // Esquina superior izquierda
        createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
    }, 8 * intervaloAparicion);

setTimeout(() => {
    createCirclesGroup3(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
}, 10 * intervaloAparicion);

setTimeout(() => {
    createCirclesGroup4(offset1, offset); // Esquina superior izquierda
    createCirclesGroup4(window_width - offset, window_height - offset); // Esquina inferior derecha
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
    createCirclesGroup3(offset1, offset); // Esquina superior izquierda
    createCirclesGroup3(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 18 * intervaloAparicion);

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 25 * intervaloAparicion); // Medio

setTimeout(() => {
    createCirclesGroup3(offset, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
}, 19 * intervaloAparicion);

setTimeout(() => {
    createCirclesGroup4(offset, offset); // Esquina superior izquierda
    createCirclesGroup4(window_width - offset, window_height - offset); // Esquina inferior derecha
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

setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), 25 * intervaloAparicion); // Medio
setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), 26 * intervaloAparicion); // Medio

setTimeout(() => {
    createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
}, 42 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup(offset1, offset); // Esquina superior izquierda
    createCirclesGroup(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 43 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 44); 
setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 44.1); 
setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 44.2); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion *44.3); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.4); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.5); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.6); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.7); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.8); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 44.9); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 45); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 45.1); 

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
    createCirclesGroup2(offset1, offset); // Esquina superior izquierda
    createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 61 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 62 * intervaloAparicion1s); // Medio

setTimeout(() => {
    createCirclesGroup3(offset1, offset); // Esquina superior izquierda
    createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 62 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), 63 * intervaloAparicion1s); // Medio

setTimeout(() => {
    createCirclesGroup2(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
}, 64 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup1(offset1, offset); // Esquina superior izquierda
    createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 65 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 66 * intervaloAparicion1s); // Medio

setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 34); 
setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 34.1); 
setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), intervaloAparicion * 34.2); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.3); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.4); 
setTimeout(() => createCirclesGroup2(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.5); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.6); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.7); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.8); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 34.9); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 35); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 35.1); 

setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 35.2); 
setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 35.3); 
setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 35.4); 
setTimeout(() => createCirclesGroup2(window_width *.75, window_height / 2, 15, 10), intervaloAparicion * 35.5); 
setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 35.6); 
setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 35.7); 
setTimeout(() => createCirclesGroup3(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 35.8); 
setTimeout(() => createCirclesGroup3(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 35.9); 
setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 36); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 36.1); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 36.2); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 36.3); //72.6 segundos

setTimeout(() => {
    createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
}, 73 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup2(offset1, offset); // Esquina superior izquierda
    createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 73.5 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 74 * intervaloAparicion1s); // Medio

setTimeout(() => {
    createCirclesGroup(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup(window_width - offset, offset); // Esquina superior derecha
}, 74.5 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup2(offset1, offset); // Esquina superior izquierda
    createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 75 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2), 62 * intervaloAparicion1s); // Medio

setTimeout(() => {
    createCirclesGroup3(offset1, offset); // Esquina superior izquierda
    createCirclesGroup2(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 75.5 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup1(window_width / 2, window_height / 2), 63 * intervaloAparicion1s); // Medio

setTimeout(() => {
    createCirclesGroup2(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
}, 76 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup1(offset1, offset); // Esquina superior izquierda
    createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 76.5 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 39); 
setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 39.1); 
setTimeout(() => createCirclesGroup1(window_width *.75, window_height / 2), intervaloAparicion * 39.2); 
setTimeout(() => createCirclesGroup2(window_width *.75, window_height / 2, 15, 10), intervaloAparicion * 39.3); 

setTimeout(() => {
    createCirclesGroup2(offset1, window_height - offset); // Esquina inferior izquierda
    createCirclesGroup3(window_width - offset, offset); // Esquina superior derecha
}, 79 * intervaloAparicion1s);

setTimeout(() => {
    createCirclesGroup1(offset1, offset); // Esquina superior izquierda
    createCirclesGroup1(window_width - offset, window_height - offset); // Esquina inferior derecha
}, 79.5 * intervaloAparicion1s);

setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 40); 
setTimeout(() => createCirclesGroup2(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 40.1); 
setTimeout(() => createCirclesGroup3(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 40.2); 
setTimeout(() => createCirclesGroup3(window_width / 4, window_height / 2, 15, 10), intervaloAparicion * 40.3); 

setTimeout(() => createCirclesGroup3(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 40.4); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 40.5); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 40.6); 
setTimeout(() => createCirclesGroup(window_width / 2, window_height / 2, 15, 10), intervaloAparicion * 40.7); 



}

// Inicializar cuadrados cada cierto tiempo
setInterval(createSquare, 3000);

initializeCircles();

canvas.addEventListener("click", function (event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    for (let i = miCirculos.length - 1; i >= 0; i--) {
        const circulo = miCirculos[i];
        const distanciaAlCentro = getDistance(mouseX, mouseY, circulo.posX, circulo.posY);
        if (distanciaAlCentro <= circulo.radius) {
            miCirculos.splice(i, 1);
            ctx.clearRect(0, 0, window_width, window_height);
            ctx.drawImage(imagen, 0, 0, window_width, window_height); // Redibujar la imagen de fondo
            miCirculos.forEach(circulo => circulo.draw(ctx));
            break;
        }
    }
});

let updateCircles = function () {

    if (gameOver) {
        clearInterval(scoreInterval); // Detener el intervalo de puntaje cuando hay game over
        ctx.clearRect(0, 0, window_width, window_height);
        ctx.drawImage(imagen, 0, 0, window_width, window_height); // Redibujar la imagen de fondo
        ctx.font = "50px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Game Over", window_width / 2 - 150, window_height / 2);

        // Añadir el botón de recarga
        const reloadButton = document.createElement('button');
        reloadButton.innerHTML = "TRY AGAIN";
        reloadButton.style.position = 'absolute';
        reloadButton.style.left = (window_width / 2 + 50) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.top = (window_height / 2 + 220) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.padding = '10px 20px';
        reloadButton.style.fontSize = '20px';
        reloadButton.style.backgroundColor = 'white';
        reloadButton.style.color = 'black';
        reloadButton.style.border = 'none';
        reloadButton.style.borderRadius = '5px';
        reloadButton.style.cursor = 'pointer';
        document.body.appendChild(reloadButton);

        reloadButton.addEventListener('click', function () {
            location.reload();
        });
        if (YouWin) {
            clearInterval(scoreInterval); // Detener el intervalo de puntaje cuando hay game over
        ctx.clearRect(0, 0, window_width, window_height);
        ctx.drawImage(imagen, 0, 0, window_width, window_height); // Redibujar la imagen de fondo
        ctx.font = "50px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText("You Win", window_width / 2 - 110, window_height / 2);

        // Añadir el botón de recarga
        const reloadButton = document.createElement('button');
        reloadButton.innerHTML = "TRY AGAIN";
        reloadButton.style.position = 'absolute';
        reloadButton.style.left = (window_width / 2 + 50) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.top = (window_height / 2 + 220) + 'px'; // Ajustar la posición según sea necesario
        reloadButton.style.padding = '10px 20px';
        reloadButton.style.fontSize = '20px';
        reloadButton.style.backgroundColor = 'white';
        reloadButton.style.color = 'black';
        reloadButton.style.border = 'none';
        reloadButton.style.borderRadius = '5px';
        reloadButton.style.cursor = 'pointer';
        document.body.appendChild(reloadButton);

        reloadButton.addEventListener('click', function () {
            location.reload();
        });
        }
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
    ctx.drawImage(imagen, 0, 0, window_width, window_height); // Redibujar la imagen de fondo

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

    for (let i = miCuadrados.length - 1; i >= 0; i--) {
        let square = miCuadrados[i];
        square.update(ctx);

        // Verificar colisión con el cursor
        if (square.containsPoint(mouseX, mouseY)) {
            score += 50;
            miCuadrados.splice(i, 1);
        }

        // Eliminar el cuadrado si es completamente transparente
        if (square.isFullyTransparent()) {
            miCuadrados.splice(i, 1);
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

canvas.addEventListener("click", function (event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    console.log(`Clic en X: ${mouseX}, Y: ${mouseY}`);
});

/*function resetMaxScore() {
    maxScore = 0;
    localStorage.setItem('maxScore', maxScore);
}
resetMaxScore();*/

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
