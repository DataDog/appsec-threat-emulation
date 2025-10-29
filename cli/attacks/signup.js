const  ora = require('ora');
const logSymbols= require('log-symbols');
const { faker } = require('@faker-js/faker');
const { http } = require('../lib/request');


const threshold = 100;

async function signups(targetURL, headers){

    const spinner = ora('Starting user signups...').start();
    
    for (let i = 0; i < 11; i++) {
        let info =  {
            email: faker.internet.email() ,
            password: faker.internet.password(),
            token: null
        }
        //create a valid user
        await http('', headers).post(
            targetURL + '/api/Users',
            {
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
            }
        );        
        spinner.text = 'Signing up: ' + (i+1).toString() + ' / 11';
        await new Promise(r => setTimeout(r, 100));
    }

    spinner.stopAndPersist({
                    symbol: logSymbols.success,
                    text: 'User signups: 11 accounts created',
                });
   
}

module.exports = { signups }