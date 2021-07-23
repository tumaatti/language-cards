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
    if (isWordHidden('french')) {
        showWord('french', newWord.targetWord);
    } else {
        newWord = getNewWord();
        showWord('english', newWord.englishWord);
        hideWord('french');
    }
}

fetch('https://raw.githubusercontent.com/SMenigat/thousand-most-common-words/master/words/fr.json')
    .then((res) => res.json())
    .then((res) => {
        words = new TheBigWord(res.words);
        newWord = words.rndWord;
        showWord('english', newWord.englishWord);
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
