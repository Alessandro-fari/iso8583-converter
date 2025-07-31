#!/usr/bin/env node


const fs = require('fs');
const path = require('path');
const {
    printExtractedFields,
    printSuccess,
    printError,
    printInfo,
    printHeader
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

// Funzione per creare la stringa XML per JMeter
function createJMeterXMLString(fields, timestamp) {
    let xmlString = `
             <nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler guiclass="TestBeanGUI" testclass="nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler" testname="Nuovo nome${timestamp}" enabled="true">
              <stringProp name="header"></stringProp>
              <stringProp name="responseCodeField">39</stringProp>
              <stringProp name="successResponseCode">000</stringProp>
              <intProp name="timeout">20000</intProp>
              <stringProp name="trailer"></stringProp>
              <collectionProp name="fields">`;
    
    // Aggiungi tutti i campi estratti
    fields.forEach((field, index) => {
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
function processTemplateFile(templatePath, newXMLString, outputPath) {
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
        printSuccess('FILE CREATO CON SUCCESSO');
        printInfo(`File di output: ${outputPath}`);
        
    } catch (error) {
        console.error('Errore durante l\'elaborazione del template:', error.message);
        process.exit(1);
    }
}

// Funzione principale
function main() {
    // Controllo argomenti da riga di comando
    if (process.argv.length < 3) {
        console.log('Uso: node iso-to-jmx-converter.js "testo del file da trasformare"');
        console.log('Esempio: node iso-to-jmx-converter.js "2025-07-31 13:03:16.399 INFO [GT-AXEPTA-RDR-65] - RX <Msg=1100> <F2=4895251000000009> <F3=000000>"');
        process.exit(1);
    }
    
    const inputText = process.argv[2];
    const timestamp = generateTimestamp();
    
    // console.log('Input ricevuto:', inputText);
    
    // Estrai i campi ISO8583
    const fields = parseISO8583Fields(inputText);
    printExtractedFields(fields);
    // console.log('\n Campi estratti:', fields);
    
    // Crea la stringa XML per JMeter
    const jmeterXMLString = createJMeterXMLString(fields, timestamp);
    // console.log('Stringa XML generata:');
    // console.log(jmeterXMLString);

    // Definisci i percorsi dei file
    const templatePath = './template/template.jmx'; // Il tuo file template
    const outputPath = `./output/output_${timestamp}.jmx`;
    
    // Controlla se il file template esiste
    if (!fs.existsSync(templatePath)) {
        console.error(`File template non trovato: ${templatePath}`);
        console.log('Crea un file template.jmx nella stessa directory dello script');
        process.exit(1);
    }
    
    // Processa il file template
    processTemplateFile(templatePath, jmeterXMLString, outputPath);
}

// Esegui la funzione principale
if (require.main === module) {
    main();
}