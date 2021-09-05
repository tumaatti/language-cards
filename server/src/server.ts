import express = require('express');
import sqlite = require('sqlite3');
import { Request, Response } from 'express';

import { hashPassword } from './hashPassword';

interface WordsDatabaseRow {
    rank: number;
    targetWord: string;
    englishWord: string;
}

interface UserAnswer {
    rank: number;
    targetWord: string;
    englishWord: string;
    correct: boolean;
}

interface UserDatabaseRow {
    rank: number;
    targetWord: string;
    englishWord: string;
    succesRate: number;
}

const app = express();
app.use(express.json());

const port = 6969;
const db = new sqlite.Database('language-cards.db');

app.post('/addUser', function(req: Request, res: Response) {
    const username = req.body.username;
    const password = hashPassword(String(req.body.password));

    let checkUserQuery = `SELECT username FROM users WHERE username=?`;
    db.get(checkUserQuery, [username], function(err: Error, userDatabaseRow:  UserDatabaseRow) {
        if (err) {
            res.status(400).json({'error': err.message});
        } else if (userDatabaseRow !== undefined) {
            res.status(400).json({'error': 'username in use'});
        } else {
            let insertUserQuery =
                `INSERT INTO users VALUES("${username}", "${password.hash}", "${password.salt}", "${password.iterations}")`
            db.run(insertUserQuery, function(err: Error) {
                if (err) {
                    res.status(400).json({'error': err.message});
                } else {
                    res.send('OK');
                }
            });
        }
    })
});

app.get('/', (_: Request, res: Response) => {
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
