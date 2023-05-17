const chalk = require('chalk');
const sqli = require('./sqli');
let baseUrl = "http://juiceshop:3000"

const attackList = [
    {id: 1, description: "Basic SQL injection attack on " + "a [ non-vulnearble ]" + " endpoint", attackFunc: sqli.basic1},
    {id: 2, description: "SQL injection attack on " + "a [ vulnearble ]" + " endpoint", attackFunc: sqli.exploit },
    // {id: 3, description: "Basic SSRF attack on " + bold("a non-vulnearble") + " endpoint", attackFunc: ()=> console.log('ssrf 1')},
    // {id: 4, description: "Basic SSRF attack on " + bold("a Vulnearble") + " endpoint",  attackFunc: ()=> console.log('ssrf 2')},
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