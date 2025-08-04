# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **conviso** - an ISO8583 to JMeter JMX converter tool that parses ISO8583 financial messaging logs and converts them into JMeter test samplers.

### Core Architecture

- **Main converter**: `src/iso_to_jmx_converter.js` - CLI tool that parses ISO8583 fields and generates JMeter XML
- **Logging utilities**: `src/util/log.js` - Colored terminal output utilities
- **Template system**: `template/template.jmx` - Base JMeter template that gets modified with new test samplers

### Key Functions

- `parseISO8583Fields()` - Extracts ISO8583 fields from log text using regex patterns
- `createJMeterXMLString()` - Generates JMeter ISO8583Sampler XML with extracted fields  
- `processTemplateFile()` - Inserts new samplers into existing JMX templates

## Development Commands

### Running the Tool
```bash
# Direct execution
node src/iso_to_jmx_converter.js "RX <Msg=1100> <F2=4895251000000009> <F3=000000>"

# Using npm script
npm start

# After npm link (creates global 'conviso' command)
npm link
conviso "RX <Msg=1100> <F2=4895251000000009> <F3=000000>"
```

### Command Line Options
- `-o, --output <path>` - Specify output JMX file path (updates existing file if present)
- `-r, --reversal` - Generate reversal message (1400) instead of normal message (1100)
- Input format: ISO8583 log strings with `<Msg=XXXX>` and `<FXX=value>` patterns

### Reversal Message Handling
When using `-r` flag, the tool:
1. Changes message type from 1100 to 1400
2. Preserves original F37 and F38 values (doesn't use JMeter variables)
3. Generates F56 field with formula: `msgcode(1100) + F11 + F12 + "05" + F32`
4. Maintains all other field logic from normal 1100 messages

### Build and Package
```bash
npm pack  # Creates distributable package
```

### Testing
No formal test suite is configured (package.json shows placeholder test command).

## File Structure

- Output files are saved to `~/.iso8583-converter/output/` by default
- Template file must exist at `template/template.jmx`
- Field 37 is automatically replaced with JMeter variables: `${JULIAN}${__time(HH)}${COUNT}`

## Special Behavior

The tool searches for the pattern `</nz.co.breakpoint.jmeter.iso8583.ISO8583Sampler>\n            <hashTree/>` in template files to determine where to insert new test samplers.