let correctAnswers = 0; // Contador de respuestas correctas
let questionCount = 0; // Contador de preguntas hechas hoy

// Función para decodificar entidades HTML
function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}
        
// Función para cambiar de vistas
function showView(viewId) {
    document.getElementById('inicio').classList.add('hidden');
    document.getElementById('quiz').classList.add('hidden');
    document.getElementById('resumen').classList.add('hidden');
    document.getElementById('practica').classList.add('hidden');
    document.getElementById('final').classList.add('hidden');
            
    document.getElementById(viewId).classList.remove('hidden');
}
        
// Verificar y actualizar el conteo de preguntas por día
function checkQuestionLimit() {
    const today = new Date().toDateString(); // Fecha actual como string
    const storedData = localStorage.getItem('quizData');
    let data = storedData ? JSON.parse(storedData) : { date: '', count: 0 };
            
    if (data.date !== today) {
        // Nuevo día, resetear conteo
        data.date = today;
        data.count = 0;
        localStorage.setItem('quizData', JSON.stringify(data));
    }
            
    questionCount = data.count;
    return questionCount < 10;
}
        
// Obtener y mostrar una pregunta
async function fetchQuestion() {
    if (!checkQuestionLimit()) {
        document.getElementById('error').textContent = 'Has alcanzado el límite de 10 preguntas por día.';
        document.getElementById('error').classList.remove('hidden');
        return;
    }
            
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1&category=18');
        const data = await response.json();
                
        if (data.response_code === 0) {
            const questionData = data.results[0];
            const question = decodeHtml(questionData.question); // Decodificar pregunta
            // const question = questionData.question; // La pregunta
            const correctAnswer = decodeHtml(questionData.correct_answer); // Decodificar respuesta correcta
            const incorrectAnswers = questionData.incorrect_answers.map(ans => decodeHtml(ans)); // Decodificar incorrectas
            // const correctAnswer = questionData.correct_answer; // Respuesta correcta
            // const incorrectAnswers = questionData.incorrect_answers; // Respuestas incorrectas
                    
            // Mezclar respuestas
            const answers = [...incorrectAnswers, correctAnswer];
            shuffleArray(answers); // Función para mezclar

            document.getElementById('loading').classList.add('hidden');
            document.getElementById('question').textContent = question;
            document.getElementById('translateButton').classList.remove('hidden'); // Mostrar botón traducir
            document.getElementById('translation').classList.add('hidden'); // Ocultar traducción inicialmente
            document.getElementById('translation').textContent = ''; // Limpiar traducción
            
            const optionsDiv = document.getElementById('options');
            optionsDiv.innerHTML = ''; // Limpiar opciones previas
                    
            answers.forEach((answer, index) => {
                const button = document.createElement('button');
                button.textContent = answer; // Usar decode para caracteres especiales si es necesario
                button.onclick = () => handleAnswer(answer, correctAnswer, button);
                optionsDiv.appendChild(button);
            });
                    
            document.getElementById('message').textContent = ''; // Limpiar mensaje
            document.getElementById('nextButton').classList.add('hidden'); // Ocultar botón siguiente
        } else {
            throw new Error('Error al obtener la pregunta.');
        }
    } catch (error) {
        document.getElementById('error').textContent = 'Error al cargar la pregunta. Intenta de nuevo.';
        document.getElementById('error').classList.remove('hidden');
    }
}

// Manejar la respuesta del usuario
function handleAnswer(selectedAnswer, correctAnswer, button) {
    const buttons = document.querySelectorAll('#options button'); // Todos los botones
            
    buttons.forEach(btn => {
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct'); // Pintar de verde la correcta
        } else {
            btn.classList.add('incorrect'); // Opcional: Pintar incorrectas
        }
        btn.disabled = true; // Desactivar botones
    });
            
    if (selectedAnswer === correctAnswer) {
        document.getElementById('message').textContent = '¡Genial!';
        document.getElementById('message').style.color = '#00ff2b';
        correctAnswers++; // Incrementar contador
    } else {
        document.getElementById('message').textContent = 'Mal';
        document.getElementById('message').style.color = 'red';
    }
            
    document.getElementById('nextButton').classList.remove('hidden'); // Mostrar botón siguiente
    questionCount++; // Incrementar conteo de preguntas
    updateQuestionCount(); // Actualizar en localStorage
}
        
// Función para mezclar un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
        
// Actualizar conteo en localStorage
function updateQuestionCount() {
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem('quizData') || JSON.stringify({ date: today, count: 0 }));
    data.count = questionCount;
    localStorage.setItem('quizData', JSON.stringify(data));
}
        
// Botón Siguiente
document.getElementById('nextButton').onclick = () => {
    if (questionCount < 10) {
        fetchQuestion(); // Obtener siguiente pregunta
    } else {
        showView('resumen'); // Mostrar resumen
        document.getElementById('scoreMessage').textContent = `Respondiste correctamente ${correctAnswers} de 10 preguntas.`;
    }
};
        
// Botón Iniciar
document.getElementById('startButton').onclick = () => {
    showView('quiz');
    correctAnswers = 0; // Resetear contador
    fetchQuestion(); // Obtener primera pregunta
};

// Botón Traducir Pregunta
document.getElementById('translateButton').onclick = async () => {
    document.getElementById('loading-translation').classList.remove('hidden');
    const textToTranslate = document.getElementById('question').textContent;
    const encodedText = encodeURIComponent(textToTranslate);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`;
            
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            document.getElementById('loading-translation').classList.add('hidden');
            document.getElementById('translation').textContent = data.responseData.translatedText;
            document.getElementById('translation').classList.remove('hidden'); // Mostrar traducción
        } else {
            throw new Error('Traducción no disponible.');
        }
    } catch (error) {
        document.getElementById('translation').textContent = 'Error al traducir.';
        document.getElementById('translation').classList.remove('hidden');
    }
};

// Botón Traducir Frase
document.getElementById('translateQuote').onclick = async () => {
    document.getElementById('loading-translation-quote').classList.remove('hidden');
    const textToTranslate = document.getElementById('quoteText').textContent;
    const encodedText = encodeURIComponent(textToTranslate);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`;
            
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            document.getElementById('loading-translation-quote').classList.add('hidden');
            document.getElementById('translation-quote').textContent = data.responseData.translatedText;
            document.getElementById('translation-quote').classList.remove('hidden'); // Mostrar traducción
        } else {
            throw new Error('Traducción no disponible.');
        }
    } catch (error) {
        document.getElementById('translation').textContent = 'Error al traducir.';
        document.getElementById('translation').classList.remove('hidden');
    }
};
        
// Botón Aceptar en resumen
document.getElementById('acceptButton').onclick = async () => {
    showView('practica');
    try {
        const response = await fetch('https://newsapi.org/v2/top-headlines?category=technology&apiKey=3dffb2ae36ff4960a7bf05d5e352639e&pageSize=1');
        const data = await response.json();
        console.log('data: ', data);
        if (data.articles && data.articles.length > 0) {
            document.getElementById('newsText').textContent = data.articles[0].title + ': ' + data.articles[0].description;
            document.getElementById('newsContent').textContent = data.articles[0].content;
        } else {
            document.getElementById('newsText').textContent = 'No se pudo obtener un artículo.';
        }
    } catch (error) {
        document.getElementById('newsText').textContent = 'Error al cargar el artículo.';
    }
};
        
// Botón Finalizar clase
document.getElementById('finishButton').onclick = async () => {
    showView('final');
    try {
        const response = await fetch('https://api.quotable.io/random?tags=technology&minLength=10&maxLength=100');
        const data = await response.json();
        document.getElementById('loading-quote').classList.add('hidden');
        document.getElementById('quoteText').textContent = data.content;
        document.getElementById('author').textContent = data.author;
    } catch (error) {
        document.getElementById('quoteText').textContent = 'Error al cargar la frase.';
    }
};