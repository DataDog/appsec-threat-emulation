// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const chalk = require('chalk');
const scanners = require('./scanners');
const sqli = require('./sqli');
const auth = require('./auth');
const ssrf = require('./ssrf');
const rate_limit = require('./rate_limiting');

let baseUrl = "http://juiceshop:3000"

const attackList = [

    {id: 1, description: "Security scan using known attack tools", attackFunc: scanners.attack_tools},
    {id: 2, description: "Generic security scan", attackFunc: scanners.generic},
    {id: 3, description: "Log4Shell attack on a " + bold("a Non-Vulnerable") + " application", attackFunc: scanners.log4shell},
    {id: 4, description: "SQL injection attacks on a " + bold("a Non-Vulnerable") + " endpoint", attackFunc: sqli.basic1},
    {id: 5, description: "Successful SQL injection attack on a " + bold("a Vulnerable") + " endpoint", attackFunc: sqli.exploit },
    {id: 6, description: "SSRF attacks on " + bold("a Non-Vulnerable") + " endpoint", attackFunc: ssrf.basic1},
    {id: 7, description: "Successful SSRF attack on " + bold("a Vulnerable") + " endpoint",  attackFunc: ssrf.exploit},
    {id: 8, description: "Credential stuffing attack", attackFunc: auth.credentialStuffing},
    {id: 9, description: "Spam campaign", attackFunc: rate_limit.spam}
];

module.exports = {
    getList: () => {
        return attackList;
    },
    run: async (id, targetURL) => {
        if(!targetURL){
            targetURL = baseUrl;
        }
        for (const attack of attackList) {
            if(id == attack.id){
                console.log(chalk.yellow('Running attack #'+id + ': '), attack.description)
                console.log(chalk.yellow('Target URL: '), targetURL)
                await attack.attackFunc(targetURL);
            }
        }
    }
}

function bold(str){
    return '\033[1m' + str  + '\033[0m';
}