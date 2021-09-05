import sqlite = require('sqlite3');

import { Database } from 'sqlite3';

interface TableName {
    name: string;
}

async function checkIfTableExistsAndCreate(db: Database, tableName: string) {
    let checkIfTableExistsQuery = `SELECT name FROM sqlite_master WHERE type="table" AND name="${tableName}"`;
    db.all(checkIfTableExistsQuery, [], function(err: Error, tableNames: TableName[]) {
        if (err) {
            throw err;
        }
        console.log('tableName: ', tableNames);
        if (tableNames.length === 0) {
            let createNewTable = `CREATE TABLE "${tableName}" ("username" TEXT, "passwordHash" TEXT, "passwordSalt" TEXT, "passwordIterations" TEXT)`;
            db.run(createNewTable, function(err: Error) {
                if (err) {
                    throw err;
                }
                console.log('new table created');
            });
        };
    });
}

async function createUserTable() {
    let databaseName = 'language-cards.db';
    let tableName = 'users';
    let db = new sqlite.Database(databaseName);
    await checkIfTableExistsAndCreate(db, tableName);
    db.close();
}

createUserTable();
