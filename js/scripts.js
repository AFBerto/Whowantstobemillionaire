document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, scripts.js ejecutado');
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK no está cargado. Verifica los scripts en index.html.');
        return;
    }
    const firebaseConfig = {
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
    window.db = firebase.firestore();
    console.log('Firestore inicializado');
    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.addEventListener('click', startGame);
        console.log('Evento click registrado para playButton');
    } else {
        console.error('Elemento #playButton no encontrado');
    }
});
const levels = ['500', '1k', '2k', '5k', '10k', '20k', '50k', '75k', '150k', '250k', '500k', '1M'];
let currentLevel = 0;
let currentQuestion = null;
let fiftyFiftyUsed = false;
let audienceUsed = false;
let timerInterval = null;
function startGame() {
    console.log('startGame ejecutado');
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    const progressButtonsContainer = document.querySelector('.progress-buttons');
    progressButtonsContainer.innerHTML = '';
    levels.forEach(level => {
        const img = document.createElement('img');
        img.src = `images/${level}.png`;
        img.id = `level-${level}`;
        img.className = 'progress-button';
        img.alt = `Nivel ${level}`;
        progressButtonsContainer.appendChild(img);
    });
    document.getElementById('readyContainer').style.display = 'flex';
    document.getElementById('questionContainer').style.display = 'none';
    document.getElementById('timeout').style.display = 'none';
    const startGameButton = document.getElementById('startGameButton');
    if (startGameButton) {
        startGameButton.addEventListener('click', startQuestion);
        console.log('Evento click registrado para startGameButton');
    } else {
        console.error('Elemento #startGameButton no encontrado');
    }
}
function startQuestion() {
    console.log('startQuestion ejecutado');
    document.getElementById('readyContainer').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    document.getElementById('timeout').style.display = 'none';
    document.querySelectorAll('.option-button').forEach((button, index) => {
        button.addEventListener('click', () => checkAnswer(index));
    });
    document.getElementById('fifty-fifty').addEventListener('click', useFiftyFifty);
    document.getElementById('audience').addEventListener('click', useAudience);
    startTimer();
    loadQuestion();
}
function startTimer() {
    let timeLeft = 30;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = timeLeft;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            console.log('Tiempo agotado');
            document.getElementById('questionContainer').style.display = 'none';
            document.getElementById('timeout').style.display = 'block';
            disableGame();
        }
    }, 1000);
}
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
        document.getElementById('question-text').innerHTML = currentQuestion.question;
        currentQuestion.options.forEach((option, index) => {
            const button = document.getElementById('option-' + index);
            button.innerHTML = option;
            button.disabled = false;
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        });
        document.getElementById('question-amount').src = `images/${levels[currentLevel]}t.png`;
        document.getElementById('feedback').innerHTML = '';
    } catch (error) {
        console.error('Error al cargar la pregunta: ' + error);
        document.getElementById('question-text').innerHTML = 'Error al cargar la pregunta.';
    }
}
function checkAnswer(selectedIndex) {
    console.log('checkAnswer ejecutado con opción: ' + selectedIndex);
    const feedback = document.getElementById('feedback');
    if (selectedIndex === currentQuestion.correct) {
        feedback.innerHTML = '¡Correcto!';
        feedback.style.color = 'green';
        const levelButton = document.getElementById('level-' + levels[currentLevel]);
        levelButton.src = `images/${levels[currentLevel]}o.png`;
        currentLevel++;
        if (currentLevel < levels.length) {
            startTimer();
            setTimeout(loadQuestion, 1000);
        } else {
            feedback.innerHTML = '¡Felicidades! Has ganado 1,000,000!';
            clearInterval(timerInterval);
            disableGame();
        }
    } else {
        feedback.innerHTML = 'Incorrecto. Juego terminado. Premio: ' + (currentLevel > 0 ? levels[currentLevel - 1] : '0');
        feedback.style.color = 'red';
        clearInterval(timerInterval);
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('timeout').style.display = 'block';
        disableGame();
    }
}
function useFiftyFifty() {
    if (fiftyFiftyUsed) {
        console.log('Comodín 50/50 ya usado');
        return;
    }
    fiftyFiftyUsed = true;
    document.getElementById('fifty-fifty').disabled = true;
    let incorrectOptions = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
    incorrectOptions = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    incorrectOptions.forEach(index => {
        const button = document.getElementById('option-' + index);
        button.disabled = true;
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });
    console.log('Comodín 50/50 usado');
}
function useAudience() {
    if (audienceUsed) {
        console.log('Comodín del público ya usado');
        return;
    }
    audienceUsed = true;
    document.getElementById('audience').disabled = true;
    const votes = [20, 20, 20, 20];
    votes[currentQuestion.correct] = 80;
    const remaining = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
    remaining.forEach((_, i) => {
        votes[remaining[i]] = Math.floor(20 / remaining.length);
    });
    document.getElementById('feedback').innerHTML = `Votos del público: A: ${votes[0]}%, B: ${votes[1]}%, C: ${votes[2]}%, D: ${votes[3]}%`;
    console.log('Comodín del público usado');
}
function disableGame() {
    document.querySelectorAll('.option-button').forEach(button => {
        button.disabled = true;
    });
    document.getElementById('fifty-fifty').disabled = true;
    document.getElementById('audience').disabled = true;
}
