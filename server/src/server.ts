import express = require('express');
import session = require('express-session');
import sqlite = require('sqlite3');
import mostCommonWords = require('thousand-most-common-words');
import { Request, Response } from 'express';

import { hashPassword, checkPassword } from './hashPassword';

interface WordsDatabaseRow {
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

interface IndividualUserDatabaseRow {
    rank: number;
    targetWord: string;
    englishWord: string;
    succesRate: number;
}
*/

interface UserDatabaseRow {
    username: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
}

const app = express();
app.use(express.json());
app.use(session({
    secret: 'vewy big secwet',
    resave: false,
    saveUninitialized: false
}));

const port = 6969;
const db = new sqlite.Database('language-cards.db');

app.post('/addUser', function(req: Request, res: Response) {
    /* request POST
     * {
     *  "username": "username",
     *  "password": "asdf"
     * }
     */

    const username = req.body.username;
    const password = hashPassword(String(req.body.password));

    let checkUserQuery = `SELECT username FROM users WHERE username=?`;
    db.get(checkUserQuery, [username], function(err: Error, userDatabaseRow: UserDatabaseRow) {
        if (err) {
            res.status(400).json({'error': err.message});
        } else if (userDatabaseRow !== undefined) {
            res.status(400).json({'error': 'username in use'});
        } else {
            let insertUserQuery =
                `INSERT INTO users VALUES("${username}", "${password.hash}", "${password.salt}", "${password.iterations}")`
            db.run(insertUserQuery, function(err: Error) {
                if (err) res.status(400).json({'error': err.message});
                else res.send('OK');
            });

            let createNewTable = `CREATE TABLE "${username}" ("rank" INTEGER, "targetWord" TEXT, "englishWord" TEXT, "successRate" INTEGER)`;
            db.run(createNewTable, function(err: Error) {
                if (err) res.status(400).json({'error': err.message});
            });

            const words = mostCommonWords.getWordsByLanguageCode('fr');
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                let populateTable = `INSERT INTO ${username} VALUES("${word.rank}", "${word.targetWord}", "${word.englishWord}", 0)`
                db.run(populateTable, function(err: Error) {
                    if (err) res.status(400).json({'error': err.message});
                    else res.send('OK');
                });
            }
        }
    })
});

// TODO: this needs to be checked if this really works -- i have my doupts
// https://github.com/expressjs/express/blob/06d11755c99fe4c1cddf8b889a687448b568472d/examples/auth/index.js#L73
// maybe some documentation how to check for signed in user?
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
    db.get(checkUsersQuery, [username], function(err: Error, row: UserDatabaseRow) {
        if (err) {
            res.status(400).json({'error': err.message});
        } else if (row === undefined) {
            res.status(400).json({'error': 'user not found'});
        } else {
            const hash = checkPassword(password, row.passwordSalt);
            if (hash === row.passwordHash) {
                req.session.regenerate(function() {
                    res.json({'login': 'success', 'username': username});
                });
            }
        }
    });
});

// TODO: Logout

app.get('/', function(_: Request, res: Response) {
    let q = `SELECT * FROM "words-fr"`;
    db.all(q, function(err: Error, rows: WordsDatabaseRow[]) {
        if (err) {
            res.status(400).json({"error": err.message});
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});


app.listen(port, () => {
    console.log('localhost:', port);
});
