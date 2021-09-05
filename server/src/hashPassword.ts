import cr = require('crypto');

interface Hash {
    salt: string;
    iterations: number;
    hash: string;
}


export function hashPassword(password: string): Hash {
    const salt = cr.randomBytes(16).toString('hex');
    const iterations = 10000;
    const keylen = 64;
    const digest = 'sha256';
    const hash = cr.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return {
        salt: salt,
        iterations: iterations,
        hash: hash,
    }
}


export function checkPassword(password: string, salt: string): string {
    const hash = cr.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex')
    return hash
}
