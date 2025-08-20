const {
    printInfo
} = require('./util/log.js');

// Funzione per gestire i messaggi template 1420
function process1420TemplateMessage(originalFields) {
    // Campi da includere nel template 1420
    const fieldsToInclude = ['2', '3', '4', '12', '24', '25', '28', '32', '33', '37', '38', '41', '42', '49', '56', '93', '94', '100','117'];
    
    const processedFields = [];
    
    // 1. Cambiare il message type a 1420
    processedFields.push({
        name: "0",
        content: "1420"
    });
    
    // 2. Aggiungere tutti i campi specificati dal 1100
    fieldsToInclude.forEach(fieldNum => {
        const originalField = originalFields.find(field => field.name === fieldNum);
        if (originalField) {
            if (fieldNum === '24') {
                // F24 deve essere sempre 400 per il template 1420
                processedFields.push({
                    name: fieldNum,
                    content: "400"
                });
            } else {
                processedFields.push({
                    name: fieldNum,
                    content: originalField.content
                });
            }
        }
    });
    
    // 3. Creare F117 riformattando la data dal campo F12 del 1100
    const f12Field = originalFields.find(field => field.name === '12');
    if (f12Field && f12Field.content) {
        // F12 formato: YYMMDDHHMMSS (es: 250820032630)
        // F117 formato: DDMMHHMMSS (es: 0820152330)
        const f12Value = f12Field.content;
        if (f12Value.length >= 10) {
            const yy = f12Value.substring(0, 2);
            const mm = f12Value.substring(2, 4);
            const dd = f12Value.substring(4, 6);
            const hh = f12Value.substring(6, 8);
            const min = f12Value.substring(8, 10);
            const ss = f12Value.substring(10, 12) || '30'; // default ss se non presente
            
            const f117Value = dd + mm + hh + min + ss;
            processedFields.push({
                name: "117",
                content: f117Value
            });
            
            printInfo(`Campo F117 generato per template 1420: ${f117Value} (da F12: ${f12Value})`);
        }
    }
    
    // 4. Creare il campo F56 per reversal con formula: msgcode(1100) + F11 + F12 + "05" + F32
    const f11Field = originalFields.find(field => field.name === '11');
    const f32Field = originalFields.find(field => field.name === '32');
    
    if (f11Field && f12Field && f32Field) {
        const field56Value = "1100" + f11Field.content + f12Field.content + "05" + f32Field.content;
        processedFields.push({
            name: "56",
            content: field56Value
        });
        
        printInfo(`Campo F56 generato per reversal: ${field56Value}`);
    }
    
    return processedFields;
}

module.exports = {
    process1420TemplateMessage
};