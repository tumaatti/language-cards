// TODO: for some async reasons this cannot do this whole thing on one run. the script needs to be
// run twice to create the db, table and populate the data. I'm too stupid at the moment to figure
// it out

import sqlite = require('sqlite3');
import request = require('request');

import { Database } from 'sqlite3';

interface TableName {
    name: string;
}

interface Word {
    rank: number;
    targetWord: string;
    englishWord: string;
}

async function createDatabase(databaseName: string): Promise<Database> {
    return new sqlite.Database(databaseName, function(err: Error) {
        if (err) {
            throw err;
        }
        console.log('connection aquired');
    })
}

async function checkIfTableExistsAndCreate(db: Database, tableName: string) {
    let checkIfTableExistsQuery = `SELECT name FROM sqlite_master WHERE type="table" AND name="${tableName}"`;
    db.all(checkIfTableExistsQuery, [], function(err: Error, tableNames: TableName[]) {
        if (err) {
            throw err;
        }
        console.log('tableName: ', tableNames);
        if (tableNames.length === 0) {
            let createNewTable = `CREATE TABLE "${tableName}" ("rank" INTEGER, "targetWord" TEXT, "englishWord" TEXT)`;
            db.run(createNewTable, function(err: Error) {
                if (err) {
                    throw err;
                }
                console.log('new table created');
            });
        };
    });
}

async function getDataAndWriteToTable(databaseName: string, tableName: string, url: string): Promise<number> {
    let db = await createDatabase(databaseName);
    // check if table exists
    let query = `SELECT * FROM "${tableName}"`
    db.all(query, function(err: Error, data: any) {
        if (err) {
            throw err;
        }
        if (data.length !== 0) {
            console.log('table has data in it');
            db.close()
            process.exit(1);
        }
    });

    request(url, function(err: Error, res, body: string) {
        if (!err && res.statusCode === 200) {
            let bodyJson = JSON.parse(body);
            for (let i = 0; i < bodyJson.words.length; i++) {
                let w = bodyJson.words[i];
                let word: Word = {
                    rank: w.rank,
                    targetWord: w.targetWord,
                    englishWord: w.englishWord,
                };
                let insertWordsToDatabase = `INSERT INTO "${tableName}" VALUES(${word.rank}, "${word.targetWord}", "${word.englishWord}")`;
                db.run(insertWordsToDatabase, function(err: Error) {
                    if (err) {
                        throw err;
                    }
                });
            }
        } db.close()
    });
    return 0
}

async function getWords() {
    let databaseName = 'language-cards.db';
    let tableName = 'words-fr';
    let db = await createDatabase(databaseName);
    await checkIfTableExistsAndCreate(db, tableName);
    db.close();
    let url = 'https://raw.githubusercontent.com/SMenigat/thousand-most-common-words/master/words/fr.json'
    await getDataAndWriteToTable(databaseName, tableName, url);
}

getWords();

