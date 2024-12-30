export function generateID(): string {
    return 'yxxxAxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function pickRandomElements<T>(array: T[], x: number): T[] {
    // Create a copy of the original array to avoid modifying it
    const copyArray = array.slice();
    const randomElements = [];

    // Pick x random elements
    for (let i = 0; i < x; i++) {
        // Generate a random index within the range of the copyArray length
        const randomIndex = Math.floor(Math.random() * copyArray.length);
        
        // Remove the selected element from the copyArray and add it to the result
        randomElements.push(copyArray.splice(randomIndex, 1)[0]);
    }

    return randomElements;
}