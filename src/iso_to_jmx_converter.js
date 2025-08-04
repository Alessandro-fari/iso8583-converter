#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const {
    printExtractedFields,
    printSuccess,
    printError,
    printInfo,
    printHeader,
    printWarning
} = require('./util/log.js');

// Funzione per generare timestamp
function generateTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Funzione per estrarre i campi ISO8583 dal testo di input
function parseISO8583Fields(inputText) {
    const fields = [];
    
    // Estrai il messaggio type (Msg=1100)
    const msgMatch = inputText.match(/<Msg=(\d+)>/);
    if (msgMatch) {
        fields.push({
            name: "0",
            content: msgMatch[1]
        });
    }
    
    // Estrai tutti i campi F[numero]
    const fieldRegex = /<F(\d+)=([^>]+)>/g;
    let match;
    
    while ((match = fieldRegex.exec(inputText)) !== null) {
        const fieldNumber = match[1];
        const fieldValue = match[2];
        
        fields.push({
            name: fieldNumber,
            content: fieldValue
        });
    }
    
    return fields;
}

// Funzione per gestire i messaggi di reversal (1400/1401)
function processReversalMessage(originalFields, isReversal) {
    if (!isReversal) {
        return originalFields;
    }
    
    const processedFields = [...originalFields];
    
    // 1. Cambiare il message type da 1100 a 1400
    const msgField = processedFields.find(field => field.name === "0");
    if (msgField && msgField.content === "1100") {
        msgField.content = "1400";
    }
    
    // 2. Mantenere i valori originali di F37 e F38 (non sostituire con variabili JMeter)
    // Questo viene gestito più avanti nella logica di creazione XML
    
    // 3. Creare il campo 56 con la formula: msgcode(1100) + F11 + F12 + "05" + F32
    const f11 = processedFields.find(field => field.name === "11");
    const f12 = processedFields.find(field => field.name === "12");
    const f32 = processedFields.find(field => field.name === "32");
    
    if (f11 && f12 && f32) {
        const field56Value = "1100" + f11.content + f12.content + "05" + f32.content;
        
        // Rimuovi il campo 56 esistente se presente
        const existingF56Index = processedFields.findIndex(field => field.name === "56");
        if (existingF56Index !== -1) {
            processedFields.splice(existingF56Index, 1);
        }
        
        // Aggiungi il nuovo campo 56
        processedFields.push({
            name: "56",
            content: field56Value
        });
        
        printInfo(`Campo 56 generato per reversal: ${field56Value}`);
    } else {
        printError("Impossibile creare il campo 56: mancano i campi F11, F12 o F32");
    }
    
    return processedFields;
}

// Funzione per creare la stringa XML per JMeter
function createJMeterXMLString(fields, timestamp, isReversal = false) {
    let xmlString = `
             <nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler guiclass="TestBeanGUI" testclass="nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler" testname="NewTest-${timestamp}" enabled="true">
              <stringProp name="header"></stringProp>
              <stringProp name="responseCodeField">39</stringProp>
              <stringProp name="successResponseCode">000</stringProp>
              <intProp name="timeout">20000</intProp>
              <stringProp name="trailer"></stringProp>
              <collectionProp name="fields">`;
    
    // Aggiungi tutti i campi estratti
    fields.forEach((field, index) => {
        // Per i reversal, mantenere i valori originali di F37 e F38
        // Per i messaggi normali, sostituire F37 con variabili JMeter
        if (field.name == '37' && !isReversal) {
            field.content ='${JULIAN}${__time(HH)}${COUNT}';
        }
        xmlString += `
                <elementProp name="${field.name}" elementType="nz.co.breakpoint.jmeter.iso8583.MessageField" testname="${field.name}">
                  <stringProp name="content">${field.content}</stringProp>
                </elementProp>`;
    });
    
    // Chiudi la stringa XML
    xmlString += `
              </collectionProp>
              <stringProp name="configKey"></stringProp>
            </nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler>
            <hashTree/>`;
    
    return xmlString;
}

// Funzione per leggere il template e inserire la nuova stringa
function processTemplateFile(templatePath, newXMLString, outputPath, isReversal = false) {
    try {
        // Leggi il file template
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // Trova la posizione dove inserire la nuova stringa
        const searchPattern = '</nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler>\n            <hashTree/>';
        const insertPosition = templateContent.indexOf(searchPattern);
        
        if (insertPosition === -1) {
            throw new Error('Pattern non trovato nel file template');
        }
        
        // Calcola la posizione dopo il pattern
        const insertAfterPosition = insertPosition + searchPattern.length;
        
        // Crea il nuovo contenuto
        const newContent = templateContent.slice(0, insertAfterPosition) +
                          '\n' + newXMLString +
                          templateContent.slice(insertAfterPosition);
        
        // Scrivi il nuovo file
        fs.writeFileSync(outputPath, newContent, 'utf8');

        // Al posto dei tuoi console.log, usa:
        printHeader('CONVERSIONE COMPLETATA');
        console.log('');
        printSuccess('FILE CREATO CON SUCCESSO');
        printInfo(`File di output: ${outputPath}`);
        
        // Warning specifico per i messaggi di reversal riguardo F38
        if (isReversal) {
            console.log(''); // Riga vuota per separazione
            printWarning('PROMEMORIA REVERSAL: Aggiungi il campo F38 (Authorization Code) al test manualmente, campo presente nel 1110');
        }
        
    } catch (error) {
        console.error('Errore durante l\'elaborazione del template:', error.message);
        process.exit(1);
    }
}

// Funzione principale
function main() {
    const argv = yargs(hideBin(process.argv))
        .usage('Uso: $0 <testo-iso> [opzioni]')
        .command('$0 <isoText>', 'Converte un messaggio ISO8583 in formato JMX', (yargs) => {
            yargs.positional('isoText', {
                describe: 'Il testo del messaggio ISO8583 da convertire',
                type: 'string'
            });
        })
        .option('o', {
            alias: 'output',
            describe: 'Percorso del file JMX di output da aggiornare. Se non specificato, viene creato un nuovo file sotto C:\\Users\\<username>\\.iso8583-converter\\output\\',
            type: 'string'
        })
        .option('r', {
            alias: 'reversal',
            describe: 'Genera un messaggio di reversal (1400) invece di un messaggio normale (1100)',
            type: 'boolean',
            default: false
        })
        .help('h')
        .alias('h', 'help')
        .argv;

    const inputText = argv.isoText;
    if (!inputText) {
        yargs.showHelp();
        return;
    }
    
    const timestamp = generateTimestamp();
    const isReversal = argv.reversal;
    
    // Estrai i campi ISO8583
    let fields = parseISO8583Fields(inputText);
    
    // Processa per messaggi di reversal se richiesto
    if (isReversal) {
        printInfo("Generazione messaggio 1400");
        fields = processReversalMessage(fields, isReversal);
    }
    
    printExtractedFields(fields);
    
    // Crea la stringa XML per JMeter
    const jmeterXMLString = createJMeterXMLString(fields, timestamp, isReversal);

    // Definisci i percorsi dei file
    const homeDir = os.homedir();
    const outputDir = path.join(homeDir, '.iso8583-converter', 'output');
    const templatePath = path.join(__dirname, '..', 'template', 'template.jmx');
    
    let outputPath;
    if (argv.output) {
        outputPath = path.resolve(argv.output); // Usa il percorso fornito
    } else {
        // Crea la directory di output se non esiste
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        outputPath = path.join(outputDir, `output_${timestamp}.jmx`);
    }

    // Controlla se il file template esiste
    if (!fs.existsSync(templatePath)) {
        printError(`File template non trovato: ${templatePath}`);
        printInfo('Crea un file template.jmx nella directory \'template\' del progetto.');
        process.exit(1);
    }
    
    // Se il file di output esiste già (perché è stato passato con -o), lo usiamo come template
    const finalTemplatePath = fs.existsSync(outputPath) ? outputPath : templatePath;

    // Processa il file template
    processTemplateFile(finalTemplatePath, jmeterXMLString, outputPath, isReversal);
}

// Esegui la funzione principale
if (require.main === module) {
    main();
}

module.exports = {
    parseISO8583Fields,
    createJMeterXMLString,
    processTemplateFile,
    processReversalMessage
};