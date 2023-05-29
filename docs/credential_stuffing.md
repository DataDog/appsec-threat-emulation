# Generic security scanning

## Overview
Credential stuffing attack is a very popular attacks against authentication systems. Where the threat actors attempts to gain unauthorized access to accounts by using compromised credentials.


## Run the attack
You can run the attacks using our cli tool

```shell
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 7
```

This command will run the cli inside the docker container. and the CLI will launch some attacks from this [file](./../cli/attacks/generic-payloads.txt) on the vulnerable application

```shell
Running attack #7:  Credential stuffing attack
Target URL:  http://juiceshop:3000
✔ Credential stuffing attack - done
```


## Result
After launching this attack, you should be able to see the traces in Datadog ASM explorer and a security scanner signal will be generated


### login Traces
You can view the login traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces)


![Security Traces](./imgs/auth-traces.png "Security Traces")


### Credential stuffing Signal
A security scanner signal will be generated with severity low. You can view the security signals by navigating to [ASM trace](https://app.datadoghq.com/security?query=%40workflow.rule.type%3A%22Application%20Security%22&column=time&order=desc&product=appsec&view=signal)



![Security Signal](./imgs/auth-signal-1.png "Security Signal")
![Security Signal](./imgs/auth-signal-2.png "Security Signal")