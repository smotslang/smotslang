#! /usr/bin/env node
//@ts-check
const yargs = require("yargs");
const fs = require("fs");
const { exit, stdout } = require("process");
const colors = require("yoctocolors-cjs");
let prompt = require("prompt-sync")();

const usage = "\nUsage: smots <file_path>";
const options = yargs
    .usage(usage)
    .help(true)
    .option("s", { alias: "str", describe: "Output as string", boolean: true, demandOption: false })
    .option("m", { alias: "mem-size", describe: "Sets the number of memory addresses (default: 256)", number: true, demandOption: false })
    .argv;

const argv = /**@type any*/(yargs.argv);

if (argv._.length == 0) {
    console.error(colors.bgRed(`ERROR: Exprected at least 1 argument, got 0!`));
    exit();
}
let filePath = argv._[0];

class ProgramState {
    /**
     * @param {Number} memSize 
     * @param {String[]} prgmArr
     **/
    constructor(memSize, prgmArr) {
        this.memSize = memSize;
        this.memArr = new Array(memSize);
        this.memArr.fill(0);
        this.springLocs = new Array(memSize);
        this.springLocs.fill(0);
        this.memPointer = 0;
        this.pc = 0;
        this.prgmArr = prgmArr;
    }
    currentMemValue() {
        return this.memArr[this.memPointer];
    }
    /**
     * @param {Number} x
     **/
    setCurrentMemValue(x) {
        this.memArr[this.memPointer] = x;
    }
    currentToken() {
        return this.prgmArr[this.pc];
    }
}

if (!fs.existsSync(filePath)) {
    console.error(colors.bgRed(`ERROR: The file "${filePath}" does not exist!`));
    exit();
}
/** @param {ProgramState} prgmState
 * @param {any} argv
 * */
function interpretSmotslang(prgmState, argv) {
    for (;prgmState.pc < prgmState.prgmArr.length; prgmState.pc++) {
        const val = prgmState.currentToken();
        if (val == "run") {
            if (argv.s != true && argv.str != true) {
                stdout.write(prgmState.currentMemValue().toString() + "\n");
            } else {
                stdout.write(String.fromCharCode(prgmState.currentMemValue()) + "\n");
            }
        } else if (val == "climb") {
            prgmState.setCurrentMemValue(prgmState.currentMemValue()+1);
        } else if (val == "fall") {
            prgmState.setCurrentMemValue(prgmState.currentMemValue()-1);
        } else if (val == "wind") {
            prgmState.pc++;
            const adr = prgmState.currentToken();
            const adrInt = parseTokenAsNumber(adr, prgmState);
            if (prgmState.memArr.length > adrInt) {
                prgmState.memArr[adrInt] = prgmState.currentMemValue(); 
            } else {
                console.error(colors.bgRed(`ERROR: Wind attempts to copy over the maximum memory limit (${prgmState.memArr.length} Adresses)! Index ${prgmState.pc}`));

                exit();
            }
        } else if (val == "dash") {
            prgmState.pc++;
            const adr = prgmState.currentToken();
            const adrInt = parseTokenAsNumber(adr, prgmState);
            if (adrInt < prgmState.memArr.length) {
                prgmState.memPointer = adrInt
            } else {
                console.error(colors.bgRed(`ERROR: Dash attempts to move to a memory adress that is out of range! Index ${prgmState.pc}`));
                exit();
            }
        } else if (val == "jump") {
            prgmState.pc++;
            prgmState.springLocs[parseTokenAsNumber(prgmState.currentToken(), prgmState)] = prgmState.pc;
        } else if (val == "spring") {
            prgmState.pc++;
            if (prgmState.currentMemValue() != 0) {
                prgmState.pc = prgmState.springLocs[parseTokenAsNumber(prgmState.currentToken(), prgmState)];
            }
        } else if (val == "crumble") {
            prgmState.pc++;
            prgmState.setCurrentMemValue(parseTokenAsNumber(prgmState.currentToken(), prgmState));
        } else if (val == "retry") {
            if (argv.s != true && argv.str != true) {
                stdout.write(prgmState.currentMemValue().toString());
            } else {
                stdout.write(String.fromCharCode(prgmState.currentMemValue()));
            }
        } else if (val == "spinner") {
            if (getRandomInt(0, 2) == 2) {
                prgmState.setCurrentMemValue(1);
            } else {
                prgmState.setCurrentMemValue(0);
            }
        } else if (val == "smots5") {
            exit();
        } else if (val == "spike") {
            prgmState.pc++;
            const adr = prgmState.currentToken();
            const adrInt = parseTokenAsNumber(adr, prgmState);
            let adr2 = "meow";
            let adrInt2 = -7;

            if (prgmState.currentMemValue() == 0) {
                while (adrInt2 != adrInt) {
                    while (prgmState.currentToken() != "jump") {
                        prgmState.pc++;
                    }
                    prgmState.pc++;
                    adr2 = prgmState.currentToken();
                    adrInt2 = parseTokenAsNumber(adr2, prgmState);
                }
                prgmState.pc -= 2;
            }
        } else if (val[0] == "-" && val[1] == "-") {
            prgmState.pc++;
            while (!prgmState.currentToken().includes("--")) {
                prgmState.pc++;
            }
        }
    }
}

/**@param {String} token
 * @param {ProgramState} prgmState 
 * */
function parseTokenAsNumber(token, prgmState) {
    if (token[0] == "$") {
        const addr = parseTokenAsNumber(token.slice(1), prgmState);
        if (addr > prgmState.memArr.length) {
            console.error(colors.bgRed(`Attempted to read value from address ${addr}, which is outside of the bounds of the memory array.`));
            exit();
        }
        return prgmState.memArr[addr];
    } else if (token == "@madeline") {
        const val = prompt(">>>");
        const out = parseInt(val);
        if (isNaN(out)) {
            console.error(colors.bgRed(`ERROR: ${val} is not a valid number!`));
            exit();
        }
        return out;
    } else if (token == "@tas") {
        prgmState.pc++;
        let filePath = prgmState.currentToken();
        if (!fs.existsSync(filePath)) {
            console.log(`ERROR: File ${filePath} does not exist!`);
            exit();
        }
        const fileStr = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        let idx = prgmState.currentMemValue();
        if (idx > fileStr.length) {
            console.log(`ERROR: Tried to read byte number ${idx+1} from a file with only ${fileStr.length} bytes in it!`);
            exit();
        }
        return fileStr.charCodeAt(idx);
    } else {
        return parseSmotsinary(token);
    }
}

/**@param {String} token*/
function parseSmotsinary(token) {
    let out_str = "";
    for (let i = 0; i < token.length; i++) {
        if (token[i] == "7") out_str = out_str.concat("0");
        else if (token[i] == "8") out_str = out_str.concat("1");
        else { console.error(colors.bgRed(`ERROR: Unexpected character ${token[i]} in Smotsinary literal.`)); exit(); }
    }
    const out = parseInt(out_str, 2);
    if (isNaN(out)) {
        console.error(colors.bgRed(`Error parsing Smotsinary value: ${token}`));
        exit();
    }
    return out
}

/**@param {Number} min
 * @param {Number} max
 * */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const fileStr = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
const fileArr = fileStr.split(/\s+/);
let state = new ProgramState(argv.m ?? 256, fileArr);
interpretSmotslang(state, argv);
