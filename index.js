class TheBigWord {
    constructor(words) {
        this.words = words;
    }

    get rndWord() {
        return this.words[this.rndNum()]
    }

    rndNum() {
        return Math.floor(Math.random() * 1000) - 1;
    }
}

const keyCodes = {
    enter: 13,
    // space:
}

let newWord;
let words;

function showWord(language, word) {
    document.getElementById(`${language}-word`).innerHTML = word;
}

function hideWord(language) {
    document.getElementById(`${language}-word`).innerHTML = "";
}

function isWordHidden(language) {
    return document.getElementById(`${language}-word`).innerHTML === ""
}

function getNewWord() {
    return words.rndWord
}

function ggGoNext() {
    if (answered === false) {
        showWord('french', newWord.targetWord);
        answered = true;
    } else {
        newWord = getNewWord();
        showWord('english', newWord.englishWord);
        hideWord('french');
        answered = false;
        guessString = "";
    }
}

function isLetter(char) {
    return char.length === 1 && char.match(/[a-z]/i)
}

fetch('https://raw.githubusercontent.com/SMenigat/thousand-most-common-words/master/words/fr.json')
    .then((res) => res.json())
    .then((res) => {
        words = new TheBigWord(res.words);
        newWord = words.rndWord;
        showWord('english', newWord.englishWord);
    });

let guessString = "";
let answered = false;

document.addEventListener('keydown', (event) => {
    console.log(event);
    if (event.key === 'Enter') {
        ggGoNext();
    } else if (isLetter(event.key) || event.code === 'Space') {
        guessString = guessString + event.key;
        showWord('french', guessString);
    } else if (event.code === 'Backspace') {
        guessString = guessString.slice(0, -1);
        showWord('french', guessString);
    }
});

document.addEventListener('touchstart', () => {
    ggGoNext();
});
