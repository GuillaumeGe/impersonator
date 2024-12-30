import * as crypto from 'crypto';
import * as fs from 'fs';
import {User} from './types/User';
import {UserToken} from './types/UserToken';

const MAX_TOKENS_PER_USER = 3;  // Maximum number of refresh tokens a user can have
const TOKEN_EXPIRATION_TIMEOUT = 1 * 3600 * 1000; // 1 hour

function hashPassword(password: string, salt: any): string {
    const hash = crypto.createHmac('sha256', salt) // Using HMAC with SHA-256
        .update(password)  // Update the hash with the password
        .digest('hex');    // Get the resulting hash in hexadecimal format
    return hash;
}

export class AuthrizationService {
    protected userTokenList: Map<string, UserToken[]> = new Map();
    protected salt = crypto.randomBytes(16).toString('hex');  // Generate a random salt

    public checkToken(token: UserToken): boolean {
        return true;
    }

    public authorize(username: string, password: string): UserToken | undefined {
        const users: User[] = JSON.parse(fs.readFileSync("./credentials.json", 'utf8')).users as User[];
        if (users !== undefined) {
            let currentUser: User | undefined = undefined;

            for (const user of users) {
                if (user.name === username && user.password === password) {
                    currentUser = user;
                    break;
                }
            }

            if (currentUser !== undefined) {    
                if (this.userTokenList[username] !== undefined) {
                    if (this.userTokenList[username].length + 1 > MAX_TOKENS_PER_USER) {
                        this.revokeOldestTokenForUser(currentUser);
                    }
                } else {
                    this.userTokenList[username] = [];
                }

                return this.registerToken(currentUser);
            }
        }
        
        return undefined;
    }

    private registerToken(user: User): UserToken {
        const token = hashPassword(user.name + user.password, crypt.randomBytes(16).toString('hex'));

        const generatonDate = new Date();
        const expirationDate = new Date(generatonDate.getTime() + TOKEN_EXPIRATION_TIMEOUT);

        const timeoutID = setTimeout(() => {
            const index = this.userTokenList[user.name].findIndex((entry: UserToken) => entry.accessToken === token);
            if (index !== -1) {
                this.userTokenList[user.name].splice(index, 1);
                console.log(`'${token}' for user '${user.name}' has expired`);
            }
        }, TOKEN_EXPIRATION_TIMEOUT)

        const userToken : UserToken = {
            accessToken: token,
            refreshToken: "",
            generationDate: generatonDate,
            expirationDate: expirationDate,
            role: user.role,
            expirationTimeoutID: timeoutID
        };

        this.userTokenList[user.name].push(userToken);

        console.log(`Created token '${token}' for user '${user.name}'`);

        return userToken;
    }

    private revokeOldestTokenForUser = (user: User) => {
        const tokenToRemove = this.userTokenList[user.name].shift();
        console.log(`Revoked token '${tokenToRemove.accessToken}' for user '${user.name}'`);
        clearTimeout(tokenToRemove.expirationTimeoutID);
    }
}