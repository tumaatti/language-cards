import cookieParser = require('cookie-parser');
import express = require('express');
import mostCommonWords = require('thousand-most-common-words');
import session = require('express-session');
import sqlite = require('sqlite3');

import { Request, Response } from 'express';
import { hashPassword, checkPassword, Hash } from './hashPassword';

declare module 'express-session' {
    interface SessionData {
        username: string
        loggedin: boolean
    }
}

interface WordsTableRow {
    rank: number;
    targetWord: string;
    englishWord: string;
}

/*
interface UserAnswer {
    rank: number;
    targetWord: string;
    englishWord: string;
    correct: boolean;
}
*/

interface IndividualUserDatabaseRow {
    rank: number;
    targetWord: string;
    englishWord: string;
    tries: number;
    correctTries: number;
    successRate: number;
}

interface UsersTableRow {
    username: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'vewy big secwet',
    resave: false,
    saveUninitialized: true,
}));

const port = 6969;
const db = new sqlite.Database('language-cards.db');

function getRandomNumber(max: number) {
    return Math.floor(Math.random() * max);
}

function getWeightedRandomRow(array: IndividualUserDatabaseRow[]): IndividualUserDatabaseRow {
    let totalLength = 0;
    for (let i = 0; i < array.length; i++) {
        totalLength += array[i].successRate;
    }
    const rnd = getRandomNumber(totalLength);
    let tmp = 0;
    for (let i = 0; i < array.length; i++) {
        tmp += array[i].successRate;
        if (rnd <= tmp) {
            return array[i];
        }
    }
}

function addUserToUsersTable(username: string, password: Hash) {
    let insertUser = `INSERT INTO users VALUES("${username}", "${password.hash}", "${password.salt}", "${password.iterations}")`;

    db.run(insertUser, function(err: Error) {
        if (err) {
            console.log(err.message);
        }
    });
}


function createAndPopulateUserTable(res: Response, username: string) {
    // TODO: maybe add langauge to table row to separate languages
    let createNewUserTable = `CREATE TABLE "${username}" ("rank" INTEGER, "targetWord" TEXT, "englishWord" TEXT, "tries" INTEGER, "correctTries" INTEGER, "successRate" INTEGER)`;

    db.run(createNewUserTable, function(err: Error) {
        if (err) {
            console.log(err.message);
        } else {
            const words = mostCommonWords.getWordsByLanguageCode('fr');
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                let populateTable = `INSERT INTO ${username} VALUES("${word.rank}", "${word.targetWord}", "${word.englishWord}", 0, 0, 100)`;
                db.run(populateTable, function(err: Error) {
                    if (err) {
                        console.log(err.message);
                    }
                });
            };
        };
    });
}

app.post('/addUser', async function(req: Request, res: Response) {
    /* request POST
     * {
     *  "username": "username",
     *  "password": "asdf"
     * }
     */

    const username = req.body.username;
    const password = hashPassword(String(req.body.password));

    const checkUserQuery = `SELECT username FROM users WHERE username=?`;
    db.get(checkUserQuery, [username], function(err: Error, userDatabaseRow: UsersTableRow) {
        if (err) {
            res.status(400).json({'error': err.message});
        } else if (userDatabaseRow !== undefined) {
            res.status(400).json({'error': 'username in use'});
        } else {
            addUserToUsersTable(username, password);
            createAndPopulateUserTable(res, username);
            res.json({'status': 'OK'});
        }
    });
});

app.post('/login', function(req: Request, res: Response) {
    /* request POST
     * {
     *  "username": "username",
     *  "password": "asdf"
     * }
     */

    const username = req.body.username;
    const password = req.body.password;

    let checkUsersQuery = `SELECT username, passwordHash, passwordSalt FROM users WHERE username=?`
    db.get(checkUsersQuery, [username], function(err: Error, row: UsersTableRow) {
        if (err) res.status(400).json({'error': err.message});
        else if (row === undefined) res.status(400).json({'error': 'user not found'});
        else {
            const hash = checkPassword(password, row.passwordSalt);
            if (hash === row.passwordHash) {
                req.session.regenerate(function() {
                    req.session.username = username;
                    req.session.loggedin = true;
                    res.redirect('/');
                });
            }
        }
    });
});

app.get('/checkLoggedin', function(req: Request, res: Response) {
    res.json({'logged in as:': req.session.username, 'loggedin': req.session.loggedin});
});

app.get('/logout', function(req: Request, res: Response) {
    req.session.destroy(function(err: Error) {
        if (err) res.status(400).json({'error': err.message});
    });
    res.redirect('/');
});

app.post('/', function(_: Request, res: Response) {
    res.json({'penispenis': 'penispenis'});
});

app.get('/', function(req: Request, res: Response) {
    let rnd = getRandomNumber(1000);
    if (!req.session.loggedin) {
        let q = `SELECT * FROM "words-fr" WHERE rank=${rnd}`;
        db.get(q, function(err: Error, row: WordsTableRow) {
            if (err) res.status(400).json({"error": err.message});
            else {
                res.json({
                    "message": "success",
                    "data": row
                });
            }
        });
        return 0
    }
    // user is logged in
    let getAllUserWords = `SELECT * FROM "${req.session.username}"`
    db.all(getAllUserWords, function(err: Error, rows: IndividualUserDatabaseRow[]) {
        if (err) {
            res.status(400).json({'error': err.message});
        } else {
            console.log(getWeightedRandomRow(rows));
            res.json({'row': getWeightedRandomRow(rows)});
            // res.json({'row': getWeightedRandomRow(rows)});
        }
    });

});


app.listen(port, function() {
    console.log(`http://localhost:${port}`);
})
