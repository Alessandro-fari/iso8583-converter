# ISO8583 to JMeter Converter (conviso)

Applicazione che permette di convertire un messaggio ISO8583 con questa struttura `<Msg=1100> <F2=4895251000000009> <F3=000000>` in un file di test per JMeter da importare.

**Caratteristiche:**
- Supporto automatico ai messaggi reversal (1400)
- Conversione diretta da log ISO8583 a file JMX per JMeter

## Installazione

### Prerequisiti
Scaricare Node.js dal seguente link: https://nodejs.org/en/download

### Setup
```bash
npm link
```
Eseguire questo comando nella directory del progetto ISO8583-CONVERTER per creare il comando globale `conviso`.

## Utilizzo

### Comando base
```bash
conviso "2025-07-31 13:03:16.399 INFO [GT-AXEPTA-RDR-65] - RX <Msg=1100> <F2=4895251000000009> <F3=000000>"
```

### Opzioni disponibili

#### Specificare file di output
```bash
conviso -o C:\Users\a.farina\.iso8583-converter\output\ciao.jmx "RX <Msg=1100> <F2=4895251000000009> <F3=000000>"
```

#### Messaggio reversal (1400)
```bash
conviso -r "RX <Msg=1100> <F2=4895251000000009> <F3=000000> <F11=123456> <F12=140530> <F32=12345678> <F37=123456789012>"
```

#### Reversal con output specifico
```bash
conviso -r -o /path/to/output.jmx "RX <Msg=1100> <F11=123456> <F12=140530> <F32=12345678>"
```

#### Configurare file di output predefinito
```bash
conviso -c C:\Users\a.farina\.iso8583-converter\output\mytest.jmx
```

#### Usare file configurato precedentemente
```bash
conviso "RX <Msg=1100> <F11=123456> <F12=140530>"
```

#### Ignorare configurazione e usare percorso di default
```bash
conviso -d "RX <Msg=1100> <F2=4895251000000009> <F3=000000>"
```

## Build

Per creare un pacchetto distribuibile:
```bash
npm pack
```