# Generic security scanning

## Overview
Security scanning is consider one of the major steps in any hackers methdology to attempt to find vulnerabilities by launching a lot of payloads into the target hoping for something trigger.


## Run the attack
You can run the attacks using our cli tool

```shell
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```

This command will run the cli inside the docker container. and the CLI will launch some attacks from this [file](./../cli/attacks/generic-payloads.txt) on the vulnerable application

```shell
Running attack #1:  Generic security scan
Target URL:  http://juiceshop:3000
✔ Basic security scan - done
```


## Result
After launching this attack, you should be able to see the traces in Datadog ASM explorer and a security scanner signal will be generated



### Security Traces
You can view the security traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces)


![Security Traces](./imgs/security-scanner-traces.png "Security Traces")


### Security Scanner Signal
A security scanner signal will be generated with severity low. You can view the security signals by navigating to [ASM trace](https://app.datadoghq.com/security?query=%40workflow.rule.type%3A%22Application%20Security%22&column=time&order=desc&product=appsec&view=signal)



![Security Signal](./imgs/security-scanner-signal-1.png "Security Signal")
![Security Signal](./imgs/security-scanner-signal-2.png "Security Signal")