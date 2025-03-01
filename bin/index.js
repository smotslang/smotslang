#! /usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
const { exit } = require("process");

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
                console.log(memArr[memPointer]);
            } else {
                console.log(String.fromCharCode(memArr[memPointer]));
            }
        } else if (val == "climb"){
            memArr[memPointer]++;
        } else if (val == "fall"){
            memArr[memPointer]--;
        } else if (val == "wind"){
            if (memArr.length > memPointer+1){
                memArr[memPointer+1] = memArr[memPointer];
            } else {
                console.log(`ERROR: Wind attempts to copy over the maximum memory limit (${memArr.length} Adresses)! Index ${pc}`);
                exit();
            }
        } else if (val == "dash"){
            pc++;
            let adr = smotsinaryToBinary(prgmArr[pc],pc);
            let adrInt = parseInt(adr,2);
            if (adrInt < memArr.length){
                memPointer = parseInt(adr,2);
            } else {
                console.log(`ERROR: Dash attempts to move to a memory adress that is out of range! Index ${pc}`);
                exit();
            }
        } else if (val == "jump"){
            pc++;
            springLocs[parseInt(smotsinaryToBinary(prgmArr[pc],pc),2)] = pc;
        } else if (val == "spring"){
            pc++;
            if (memArr[memPointer] != 0){
                pc = springLocs[parseInt(smotsinaryToBinary(prgmArr[pc],pc),2)];
            }
        } else if (val == "crumble"){
            pc++;
            memArr[memPointer] = parseInt(smotsinaryToBinary(prgmArr[pc],pc),2);
        }
    }
}

function smotsinaryToBinary(smotsinary, idx){
    let out = ""
    for (let i = 0; i < smotsinary.length; i++){
        if (smotsinary[i] == "7") out = out.concat("0");
        else if (smotsinary[i] == "8") out = out.concat("1");
    }
    if (isNaN(parseInt(out,2))){
        console.log(`ERROR: Attempted to parse ${smotsinary} which is not a valid number! Index ${idx}`);
        exit()
    }
    return out;
}

let fileStr = fs.readFileSync(filePath,{encoding:'utf8', flag:'r'});
let fileArr = fileStr.split(/\s+/);
interpretSmotslang(fileArr);