const axios = require('axios')
// const { client, v1 } = require('@datadog/datadog-api-client');

// "_dd.appsec.json": "{\"triggers\":[{\"rule\":{\"id\":\"crs-942-100\",\"name\":\"SQL Injection Attack Detected via libinjection\",\"tags\":{\"type\":\"sql_injection\",\"category\":\"attack_attempt\"}},\"rule_matches\":[{\"operator\":\"is_sqli\",\"operator_value\":\"\",\"parameters\":[{\"address\":\"server.request.body\",\"key_path\":[\"email\"],\"value\":\"' or 1=1--\",\"highlight\":[\"s&1c\"]}]}]}]}",

const http = (bearer) => {

    // 'headers':
    //         {
    //             'Cookie': 'cookie1=?; cookie2=?;'
    //         },
    //     'withCredentials: true" // ADD THIS LINE
    id = 'ASM-Testing-CLI/0.0.1'
    return {
        get: async (url, params) => {
            let res = false;
            try {
                res = await axios.get(url, {
                    params: params,
                    headers: { 'User-Agent': id, 'Cookie': "token=" + bearer, 'Authorization': "Bearer " + bearer },
                    withCredentials: true
                }) 
            } catch (error) { return error }    
            return res;
        },
        post: async (url, data, contentType = 'application/json') => {
            let res = false;
            try {
                res = await axios.post(url, data, {
                    headers: { 'User-Agent': id, 'Cookie': "token=" + bearer, 'Authorization': "Bearer " + bearer, 'Content-Type': contentType },
                    withCredentials: true
                }) 
            } catch (error) { 
                return error
            }
            return res;
        },
        patch: async (url, data, contentType = 'application/json') => {
            let res = false;
            try {
                res = await axios.patch(url, data, {
                    headers: { 
                        'User-Agent': id,
                        'Content-Type': contentType,
                        'Cookie': "token=" + bearer,
                        'Authorization': "Bearer " + bearer
                    },
                    withCredentials: true
                })
            } catch (error) { return error }
            return res;
        },
        put: async (url, data, contentType = 'application/json') => {
            let res = false;
            try {
                res = await axios.put(url, data, {
                    headers: { 
                        'User-Agent': id,
                        'Content-Type': contentType,
                        'Cookie': "token=" + bearer,
                        'Authorization': "Bearer " + bearer
                    },
                    withCredentials: true
                })
            } catch (error) { return error }
            return res;
        },
        custom: async (config) => {
            let res = false;
            try {
             res = await axios(config)
            } catch (error) { return error }
            return res
        }
    }
}

// const http = {
//     get: async (url, params) => {
//         let res = await axios.get(url, {
//             headers: { 'User-Agent': uuidv4() } ,
//             params: params
//         }) 
//         return res;
//     },
//     post: async (url, data) => {
//         let res = await axios.post(url,{
//             headers: { 'User-Agent': uuidv4() },
//             data: data
//         }) 
//         return res;
//     }
// }


// const dd = function(){
//     const configurationOpts = {
//         authMethods: {
//           apiKeyAuth: "<API KEY>",
//           appKeyAuth: "<APPLICATION KEY>"
//         },
//     };
      
//     const configuration = client.createConfiguration(configurationOpts);

//     console.log('conf', configuration)
// }




module.exports = {
    http
}