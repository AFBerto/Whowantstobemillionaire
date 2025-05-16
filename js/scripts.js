// Verificar carga inicial y registrar eventos
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, scripts.js ejecutado');

    // Verificar si Firebase está definido
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK no está cargado. Verifica los scripts en index.html.');
        return;
    }

    // Inicializar Firebase (actualiza con tu firebaseConfig después de crear el proyecto)
    const firebaseConfig = {
        // Añade aquí el firebaseConfig del nuevo proyecto (se generará al crear el proyecto en Firebase)
        apiKey: "TU_API_KEY",
        authDomain: "TU_AUTH_DOMAIN",
        projectId: "TU_PROJECT_ID",
        storageBucket: "TU_STORAGE_BUCKET",
        messagingSenderId: "TU_MESSAGING_SENDER_ID",
        appId: "TU_APP_ID",
        measurementId: "TU_MEASUREMENT_ID"
    };
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase inicializado');
    } catch (error) {
        console.error('Error al inicializar Firebase: ' + error);
        return;
    }

    // Inicializar Firestore
    window.db = firebase.firestore();
    console.log('Firestore inicializado');

    // Registrar evento para el botón de jugar
    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.addEventListener('click', startGame);
        console.log('Evento click registrado para playButton');
    } else {
        console.error('Elemento #playButton no encontrado');
    }
});

// Niveles de premios en orden (de menor a mayor)
const levels = [
    '500', '1k', '2k', '5k', '10k', '20k', '50k', '75k', '150k', '250k', '500k', '1M'
];

// Variables globales
let currentLevel = 0;
let currentQuestion = null;
let fiftyFiftyUsed = false;
let audienceUsed = false;

// Función para iniciar el juego
function startGame() {
    console.log('startGame ejecutado');
    // Ocultar pantalla inicial y mostrar pantalla principal
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';

    // Generar botones de progreso
    const progressButtonsContainer = document.querySelector('.progress-buttons');
    progressButtonsContainer.innerHTML = ''; // Limpiar contenedor
    levels.forEach(level => {
        const img = document.createElement('img');
        img.src = `images/${level}.png`;
        img.id = `level-${level}`;
        img.className = 'progress-button';
        img.alt = `Nivel ${level}`;
        progressButtonsContainer.appendChild(img);
    });

    // Registrar eventos para botones de opciones y comodines
    document.querySelectorAll('.option-button').forEach((button, index) => {
        button.addEventListener('click', () => checkAnswer(index));
    });
    document.getElementById('fifty-fifty').addEventListener('click', useFiftyFifty);
    document.getElementById('audience').addEventListener('click', useAudience);

    // Cargar la primera pregunta
    loadQuestion();
}

// Función para obtener una pregunta aleatoria desde Firestore
async function loadQuestion() {
    console.log('loadQuestion ejecutado para nivel: ' + levels[currentLevel]);
    try {
        const querySnapshot = await window.db
            .collection('MillionaireQuestions')
            .doc('level_' + levels[currentLevel])
            .collection('questions')
            .get();

        if (querySnapshot.empty) {
            console.error('No se encontraron preguntas para el nivel ' + levels[currentLevel]);
            document.getElementById('question-text').innerHTML = 'No hay preguntas disponibles para este nivel.';
            return;
        }

        const questions = querySnapshot.docs.map(doc => doc.data());
        currentQuestion = questions[Math.floor(Math.random() * questions.length)];

        // Mostrar pregunta y opciones
        document.getElementById('question-text').innerHTML = currentQuestion.question;
        currentQuestion.options.forEach((option, index) => {
            const button = document.getElementById('option-' + index);
            button.innerHTML = option;
            button.disabled = false;
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        });

        document.getElementById('feedback').innerHTML = '';
    } catch (error) {
        console.error('Error al cargar la pregunta: ' + error);
        document.getElementById('question-text').innerHTML = 'Error al cargar la pregunta.';
    }
}

// Función para verificar la respuesta
function checkAnswer(selectedIndex) {
    console.log('checkAnswer ejecutado con opción: ' + selectedIndex);
    const feedback = document.getElementById('feedback');

    if (selectedIndex === currentQuestion.correct) {
        feedback.innerHTML = '¡Correcto!';
        feedback.style.color = 'green';

        // Resaltar el nivel actual
        const levelButton = document.getElementById('level-' + levels[currentLevel]);
        levelButton.src = `images/${levels[currentLevel]}o.png`;

        // Avanzar al siguiente nivel
        currentLevel++;
        if (currentLevel < levels.length) {
            setTimeout(loadQuestion, 1000); // Cargar la siguiente pregunta después de 1 segundo
        } else {
            feedback.innerHTML = '¡Felicidades! Has ganado 1,000,000!';
            disableGame();
        }
    } else {
        feedback.innerHTML = 'Incorrecto. Juego terminado. Premio: ' + (currentLevel > 0 ? levels[currentLevel - 1] : '0');
        feedback.style.color = 'red';
        disableGame();
    }
}

// Función para usar el comodín 50/50
function useFiftyFifty() {
    if (fiftyFiftyUsed) {
        console.log('Comodín 50/50 ya usado');
        return;
    }
    fiftyFiftyUsed = true;
    document.getElementById('fifty-fifty').disabled = true;

    let incorrectOptions = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
    // Seleccionar dos opciones incorrectas aleatoriamente
    incorrectOptions = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    incorrectOptions.forEach(index => {
        const button = document.getElementById('option-' + index);
        button.disabled = true;
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });
    console.log('Comodín 50/50 usado');
}

// Función para usar el comodín del público
function useAudience() {
    if (audienceUsed) {
        console.log('Comodín del público ya usado');
        return;
    }
    audienceUsed = true;
    document.getElementById('audience').disabled = true;

    // Simular distribución de votos (80% para la correcta, 20% repartido entre las incorrectas)
    const votes = [20, 20, 20, 20];
    votes[currentQuestion.correct] = 80;
    const remaining = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
    remaining.forEach((_, i) => {
        votes[remaining[i]] = Math.floor(20 / remaining.length);
    });

    document.getElementById('feedback').innerHTML = `Votos del público: A: ${votes[0]}%, B: ${votes[1]}%, C: ${votes[2]}%, D: ${votes[3]}%`;
    console.log('Comodín del público usado');
}

// Función para deshabilitar el juego al finalizar
function disableGame() {
    document.querySelectorAll('.option-button').forEach(button => {
        button.disabled = true;
    });
    document.getElementById('fifty-fifty').disabled = true;
    document.getElementById('audience').disabled = true;
}
