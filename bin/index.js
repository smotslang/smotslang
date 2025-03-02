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



if (!fs.existsSync(filePath)) {
    console.error(colors.bgRed(`ERROR: The file "${filePath}" does not exist!`));
    exit();
}
/** @param {String[]} prgmArr
 * @param {any} argv
 * */
function interpretSmotslang(prgmArr, argv) {
    const memSize = /**@type {Number}*/(argv.m ?? 256);
    const memArr = /**@type {Number[]}*/(new Array(memSize));
    memArr.fill(0);
    let memPointer = 0;
    const springLocs =  /**@type {Number[]}*/(new Array(memSize));
    springLocs.fill(0);
    for (let pc = 0; pc < prgmArr.length; pc++) {
        const val = prgmArr[pc];
        if (val == "run") {
            if (argv.s != true && argv.str != true) {
                stdout.write(memArr[memPointer].toString() + "\n");
            } else {
                stdout.write(String.fromCharCode(memArr[memPointer]) + "\n");
            }
        } else if (val == "climb") {
            memArr[memPointer]++;
        } else if (val == "fall") {
            memArr[memPointer]--;
        } else if (val == "wind") {
            pc++;
            const adr = prgmArr[pc];
            const adrInt = parseTokenAsNumber(adr, pc, memArr);
            if (memArr.length > adrInt) {
                memArr[adrInt] = memArr[memPointer];
            } else {
                console.error(colors.bgRed(`ERROR: Wind attempts to copy over the maximum memory limit (${memArr.length} Adresses)! Index ${pc}`));

                exit();
            }
        } else if (val == "dash") {
            pc++;
            const adr = prgmArr[pc];
            const adrInt = parseTokenAsNumber(adr, pc, memArr);
            if (adrInt < memArr.length) {
                memPointer = adrInt
            } else {
                console.error(colors.bgRed(`ERROR: Dash attempts to move to a memory adress that is out of range! Index ${pc}`));
                exit();
            }
        } else if (val == "jump") {
            pc++;
            springLocs[parseTokenAsNumber(prgmArr[pc], pc, memArr)] = pc;
        } else if (val == "spring") {
            pc++;
            if (memArr[memPointer] != 0) {
                pc = springLocs[parseTokenAsNumber(prgmArr[pc], pc, memArr)];
            }
        } else if (val == "crumble") {
            pc++;
            memArr[memPointer] = parseTokenAsNumber(prgmArr[pc], pc, memArr);
        } else if (val == "retry") {
            if (argv.s != true && argv.str != true) {
                stdout.write(memArr[memPointer].toString());
            } else {
                stdout.write(String.fromCharCode(memArr[memPointer]));
            }
        } else if (val == "spinner") {
            if (getRandomInt(0, 2) == 2) {
                memArr[memPointer] = 1;
            } else {
                memArr[memPointer] = 0;
            }
        } else if (val == "smots5") {
            exit();
        } else if (val == "spike") {
            pc++;
            const adr = prgmArr[pc];
            const adrInt = parseTokenAsNumber(adr, pc, memArr);
            let adr2 = "meow";
            let adrInt2 = -7;

            if (memArr[memPointer] == 0) {
                while (adrInt2 != adrInt) {
                    while (prgmArr[pc] != "jump") {
                        pc++;
                    }
                    pc++;
                    adr2 = prgmArr[pc];
                    adrInt2 = parseTokenAsNumber(adr2, pc, memArr);
                }
                pc -= 2;
            }
        } else if (val[0] == "-" && val[1] == "-") {
            pc++;
            while (!prgmArr[pc].includes("--")) {
                pc++;
            }
        }
    }
}

/**@param {String} token
 * @param {Number} idx
 * @param {Number[]} memArr
 * */
function parseTokenAsNumber(token, idx, memArr) {
    if (token[0] == "$") {
        const addr = parseTokenAsNumber(token.slice(1), idx, memArr);
        if (addr > memArr.length) {
            console.error(colors.bgRed(`Attempted to read value from address ${addr}, which is outside of the bounds of the memory array.`));
            exit();
        }
        return memArr[addr];
    } else if (token == "@madeline") {
        const val = prompt(">>>");
        const out = parseInt(val);
        if (isNaN(out)) {
            console.error(colors.bgRed(`ERROR: ${val} is not a valid number!`));
            exit();
        }
        return out;
    } else if (token == "@tas") {
        // not implemented yet
        console.error(colors.bgRed("ERROR: Not implemented yet!"));
        exit();
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

/*function parseTokenAsNumber(smotsinary, idx, memArr){
    let inp = smotsinary;
    let out = "";
    let valMode = false;
    if (smotsinary[0] == "$"){
        inp = smotsinary.slice(1);
        valMode = true;
    }
    if (smotsinary == "@madeline"){
        out = prompt(">>>");
        out = parseInt(out);
        if (isNaN(out)){
            console.error(`ERROR: Attempted to parse ${smotsinary} which is not a valid number! Index ${idx}`);
            exit();
        }
    } else {
        for (let i = 0; i < inp.length; i++){
            if (inp[i] == "7") out = out.concat("0");
            else if (inp[i] == "8") out = out.concat("1");
        }
        out = parseInt(out,2);
        if (isNaN(out)){
            console.error(`ERROR: Attempted to parse ${smotsinary} which is not a valid number! Index ${idx}`);
            exit();
        }
    }
    if (valMode){
        if (out < memArr.length){
            out = memArr[out];
        } else {
            console.error(`ERROR: Attempted to parse ${smotsinary} which is out of range of the memory array! Index ${idx}`);
            exit();
        }
    }
    return out;
}*/

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
interpretSmotslang(fileArr, argv);
