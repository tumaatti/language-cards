export interface WordsTableRow {
    rank: number;
    targetWord: string;
    englishWord: string;
}

/*
export interface UserAnswer {
    rank: number;
    targetWord: string;
    englishWord: string;
    correct: boolean;
}
*/

export interface IndividualUserDatabaseRow {
    // language: string; TODO
    rank: number;
    targetWord: string;
    englishWord: string;
    tries: number;
    correctTries: number;
    failureRate: number;
}

export interface UsersTableRow {
    username: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
}

