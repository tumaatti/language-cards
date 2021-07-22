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
    if (isWordHidden('english')) {
        showWord('english', newWord.englishWord);
    } else {
        newWord = getNewWord();
        showWord('french', newWord.targetWord);
        hideWord('english');
    }
}

fetch( 'https://raw.githubusercontent.com/SMenigat/thousand-most-common-words/master/words/fr.json')
    .then((res) => res.json())
    .then((res) => {
        words = new TheBigWord(res.words);
        newWord = words.rndWord;
        showWord('french', newWord.targetWord);
    });

document.addEventListener('keydown', (event) => {
    console.log(event);
    if (event.key === 'Enter') {
        ggGoNext();
    }
});

document.addEventListener('touchstart', () => {
    ggGoNext();
});
