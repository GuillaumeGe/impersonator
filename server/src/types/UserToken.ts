export interface UserToken {
    accessToken: string,
    refreshToken: string,
    expirationTimeoutID: NodeJS.Timeout
    expirationDate: Date,
    generationDate: Date
    role: string,
}