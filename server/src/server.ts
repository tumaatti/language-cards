import express = require('express');
import session = require('express-session');
import cookieParser = require('cookie-parser');
import sqlite = require('sqlite3');
import mostCommonWords = require('thousand-most-common-words');
import { Request, Response } from 'express';

import { hashPassword, checkPassword } from './hashPassword';

declare module 'express-session' {
    interface SessionData {
        username: string
        loggedin: boolean
    }
}

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
app.use(cookieParser());
app.use(session({
    secret: 'vewy big secwet',
    resave: false,
    saveUninitialized: true,
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
                    req.session.username = username;
                    req.session.loggedin = true;
                    res.json({'login': 'success', 'username': username});
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
    res.send('session destroyed');
});

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


app.listen(port, function() {
    console.log(`localhost:${port}`);
});
