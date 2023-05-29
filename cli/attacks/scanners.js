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



module.exports = { generic, attack_tools}