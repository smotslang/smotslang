#! /usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
const { exit, stdout } = require("process");
let prompt = require("prompt-sync")();

const usage = "\nUsage: smots <file_path>";
const options = yargs  
.usage(usage)                                                                                                  
.help(true) 
.option("s", {alias:"str", describe: "Output as string", type: "boolean", demandOption: false }) 
.argv;

if (yargs.argv._.length == 0){
    console.log(`ERROR: Exprected at least 1 argument, got 0!`);
    exit();
}
let filePath = yargs.argv._[0];

if (!fs.existsSync(filePath)){
    console.log(`ERROR: The file "${filePath}" does not exist!`);
    exit();
}
function interpretSmotslang(prgmArr){
    let memArr = new Array(256);
    memArr.fill(0);
    let memPointer = 0;
    let springLocs = new Array(256);
    springLocs.fill(0);

    for (let pc = 0; pc < prgmArr.length; pc++){
        let val = prgmArr[pc];
        if (val == "run"){
            if (yargs.argv.s != true && yargs.argv.str != true){
                stdout.write(memArr[memPointer].toString() + "\n");
            } else {
                stdout.write(String.fromCharCode(memArr[memPointer]) + "\n");
            }
        } else if (val == "climb"){
            memArr[memPointer]++;
        } else if (val == "fall"){
            memArr[memPointer]--;
        } else if (val == "wind"){
            pc++;
            let adr = prgmArr[pc];
            let adrInt = smotsinaryToBinary(adr,pc,memArr);
            if (memArr.length > adrInt){
                memArr[adrInt] = memArr[memPointer];
            } else {
                console.log(`ERROR: Wind attempts to copy over the maximum memory limit (${memArr.length} Adresses)! Index ${pc}`);
                exit();
            }
        } else if (val == "dash"){
            pc++;
            let adr = prgmArr[pc];
            let adrInt = smotsinaryToBinary(adr,pc,memArr);
            if (adrInt < memArr.length){
                memPointer = adrInt
            } else {
                console.log(`ERROR: Dash attempts to move to a memory adress that is out of range! Index ${pc}`);
                exit();
            }
        } else if (val == "jump"){
            pc++;
            springLocs[smotsinaryToBinary(prgmArr[pc],pc,memArr)] = pc;
        } else if (val == "spring"){
            pc++;
            if (memArr[memPointer] != 0){
                pc = springLocs[smotsinaryToBinary(prgmArr[pc],pc,memArr)];
            }
        } else if (val == "crumble"){
            pc++;
            memArr[memPointer] = smotsinaryToBinary(prgmArr[pc],pc,memArr);
        } else if (val == "retry"){
            if (yargs.argv.s != true && yargs.argv.str != true){
                stdout.write(memArr[memPointer].toString());
            } else {
                stdout.write(String.fromCharCode(memArr[memPointer]));
            }
        } else if (val == "spinner"){
            if (getRandomInt(0,2) == 2){
                memArr[memPointer] = 1;
            } else {
                memArr[memPointer] = 0;
            }
        } else if (val == "smots5"){
            exit();
        }
    }
}

function smotsinaryToBinary(smotsinary, idx, memArr){
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
            console.log(`ERROR: Attempted to parse ${smotsinary} which is not a valid number! Index ${idx}`);
            exit();
        }
    } else {
        for (let i = 0; i < inp.length; i++){
            if (inp[i] == "7") out = out.concat("0");
            else if (inp[i] == "8") out = out.concat("1");
        }
        out = parseInt(out,2);
        if (isNaN(out)){
            console.log(`ERROR: Attempted to parse ${smotsinary} which is not a valid number! Index ${idx}`);
            exit();
        }
    }
    if (valMode){
        if (out < memArr.length){
            out = memArr[out];
        } else {
            console.log(`ERROR: Attempted to parse ${smotsinary} which is out of range of the memory array! Index ${idx}`);
            exit();
        }
    }
    return out;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let fileStr = fs.readFileSync(filePath,{encoding:'utf8', flag:'r'});
let fileArr = fileStr.split(/\s+/);
interpretSmotslang(fileArr);