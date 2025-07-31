function printExtractedFields(fields) {
    console.log(`
${colors.cyan}${colors.bright}📋 CAMPI ISO8583 ESTRATTI:${colors.reset}`);
    console.log(`${colors.blue}┌${'─'.repeat(50)}┐${colors.reset}`);
    
    fields.forEach((field, index) => {
        const isLast = index === fields.length - 1;
        const fieldName = field.name.padEnd(3);
        const fieldContent = field.content.length > 35 ? 
            field.content.substring(0, 32) + '...' : 
            field.content;
        
        console.log(`${colors.blue}│${colors.reset} ${colors.yellow}F${fieldName}${colors.reset} ${colors.magenta}→${colors.reset} ${colors.white}${fieldContent}${colors.reset}${' '.repeat(Math.max(0, 40 - fieldContent.length))} ${colors.blue}│${colors.reset}`);
        
        if (!isLast) {
            console.log(`${colors.blue}├${'─'.repeat(50)}┤${colors.reset}`);
        }
    });
    
    console.log(`${colors.blue}└${'─'.repeat(50)}┘${colors.reset}`);
    console.log(`${colors.green}${colors.bright}✨ Totale campi estratti: ${fields.length}${colors.reset}
`);
}
// Colori ANSI per il terminale
const colors = {
    reset: '[0m',
    bright: '[1m',
    dim: '[2m',
    red: '[31m',
    green: '[32m',
    yellow: '[33m',
    blue: '[34m',
    magenta: '[35m',
    cyan: '[36m',
    white: '[37m',
    bgGreen: '[42m',
    bgRed: '[41m',
    bgYellow: '[43m',
    bgBlue: '[44m'
};

// Funzioni di utilità per la stampa colorata
function printSuccess(message) {
    console.log(`${colors.green}${colors.bright}✅ ${message}${colors.reset}`);
}

function printError(message) {
    console.log(`${colors.red}${colors.bright}❌ ${message}${colors.reset}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}${colors.bright}⚠️  ${message}${colors.reset}`);
}

function printInfo(message) {
    console.log(`${colors.cyan}${colors.bright}ℹ️  ${message}${colors.reset}`);
}

function printHeader(title) {
    const border = '═'.repeat(60);
    const padding = Math.max(0, 58 - title.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    
    console.log(`${colors.blue}${colors.bright}╔${border}╗${colors.reset}`);
    console.log(`${colors.blue}${colors.bright}║${colors.bgBlue}${colors.white}${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}${colors.reset}${colors.blue}${colors.bright}║${colors.reset}`);
    console.log(`${colors.blue}${colors.bright}╚${border}╝${colors.reset}`);
}

module.exports = {
    printExtractedFields,
    colors,
    printSuccess,
    printError,
    printWarning,
    printInfo,
    printHeader
};