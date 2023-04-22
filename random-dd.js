const fs = require('fs');
const path = require('path');

// get command line arguments
const args = process.argv.slice(2);

function logUsage() {
  console.log(`Please provide one of the following commands...
  domt - Get an item from the deck of many things
  encounter - Get an encounter
  trinket - Get a trinket
  wildmagic - Get a wild magic occurrence
   - wildmagic can optionally be followed by a "type" argument to pull from different tables
     - 5e - 5e wild magic table
     - d10k_1.2 - d10000 1.2 wild magic table
     - d10k_2.0 - d10000 2.0 wild magic table

Examples:
  node random-dd.js domt
  node random-dd.js wildmagic d10k_2.0
`
  );
}

if (args.length < 1) {
  logUsage();
  process.exit(1);
}

const commandPathMap = {
  domt: { path: 'commands/domt/' },
  encounter: { path: 'commands/encounter/' },
  trinket: { path: 'commands/trinket/' },
  wildmagic: {
    path: 'commands/wildmagic/',
    noArgument: {
      key: 'd10k_2.0',
      path: 'd10k_2.0/'
    },
    arguments: {
      '5e': { path: '5e/' },
      'd10k_1.2': { path: 'd10k_1.2/' },
      'd10k_2.0': { path: 'd10k_2.0/' }
    }
  }
};

// get files from the commandPathMap that match the first argument
const command = commandPathMap[args[0]];
if (!command) {
  console.log(`Invalid command: ${args[0]}\n`);
  logUsage();
  process.exit(1);
}

// build the json file path
let jsonPath = path.join(__dirname)
if (command.path) {
  jsonPath = path.join(jsonPath, command.path);

  const arg = args[1];
  if (arg) {
    if (!command.arguments[arg]) {
      console.log(`Invalid argument: ${arg}\n`);
      logUsage();
      process.exit(1);
    } else {
      jsonPath = path.join(jsonPath, command.arguments[arg].path);
    }
  } else if(command.arguments) {
    jsonPath = path.join(jsonPath, command.noArgument.path);
  }
}

// load and merge all json files in the path
let files;
let data;
try {
  files = fs.readdirSync(jsonPath);
  data = files.reduce((acc, file) => {
    const filePath = path.join(jsonPath, file);
    const fileData = fs.readFileSync(filePath);
    const jsonData = JSON.parse(fileData);
    // number the keys to match the file index if there are multiple files
    if (files.length > 1) {
      const indexedJsonData = {};
      Object.keys(jsonData).forEach(key => {
        indexedJsonData[`${file.replace(/\..+/, '')}-${key}`] = jsonData[key];
      });
      return { ...acc, ...indexedJsonData };
    } else {
      return { ...acc, ...jsonData };
    }
  }, {});
} catch (error) {
  console.log(`Error reading/parsing files in path: "${jsonPath}"`);
  console.log('Ensure that the path and files exist and that they are valid JSON.');
  process.exit(1);
}

// get a random key from the json object
const keys = Object.keys(data);
const randomKey = keys[Math.floor(Math.random() * keys.length)];

// log the value of the random key
console.log(`Random ${args[0] + (args[1] ? ' of type ' + args[1] : '')}`);
console.log(`  key: ${randomKey}`);
console.log(`  value: ${data[randomKey]}`);

console.log('\nPress any key to exit');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));