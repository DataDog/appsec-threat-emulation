# Server Side Request Forgery (SSRF) attack

## Overview
This attack is simulating a SSRF attack in two scenarios. 
The first scenario is [an attack on a non-vulnerable endpoint]() while the second one is [a successful exploit on a vulnerable endpoint]().


```
├────┼────────────────────────────────────────────────────────────┤
│ 5  │ SSRF attacks on a Non-Vulnerable endpoint                  │
├────┼────────────────────────────────────────────────────────────┤
│ 6  │ Successful SSRF attack on a Vulnerable endpoint            │
├────┼────────────────────────────────────────────────────────────┤
```


## 1. SSRF attacks on a Non-Vulnerable endpoint

```shell
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 5
```

This command will run the cli inside the docker container. and the CLI will launch some attacks from this [file](./../cli/attacks/ssrf-payloads.txt) on a non-vulnerable endpoint


```shell
Running attack #5:  SSRF attacks on a Non-Vulnerable endpoint
Target URL:  http://juiceshop:3000
✔ Basic SSRF injection attack - done
```


### Result
After launching this attack, you should be able to see the traces in Datadog ASM explorer and a attack tools signal will be generated.



### Security Traces
You can view the security traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces)


![Security Traces](./imgs/ssrf1-traces.png "Security Traces")

If you noticed here, All traces are qualified as "none successful" which means ASM detected that there is no outgoing http connection which an indication that the SSRF is not exploited successful.


### SSRF Attack Signal
Beacuse that all of the traces where not successful so ASM will generate no signals for it.



## 2. SSRF attacks on a Vulnerable endpoint

```shell
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 6
```

This time the attack will execute a working exploit on a vulnerable endpoint. So this is simulate a successful exploitation of a vulnerability



```shell
Running attack #6:  Successful SSRF attack on a Vulnerable endpoint
Target URL:  http://juiceshop:3000
✔ Successful SQL injection attack - done
```


### Result
After launching this attack, you should be able to see the traces in Datadog ASM explorer and a attack tools signal will be generated. This time the traces is highlighted as `harmful` and the signal severity is `critical` because this is an active vulnerability and its getting exploited.



### Security Traces
You can view the security traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces)


![Security Traces](./imgs/ssrf2-traces.png "Security Traces")

The traces here are qualified as `harmful` because ASM detected that this SSRF is exploited successfully


### SQL Injection Attack Signal
A SQL injection signal will be generated with severity medium. You can view the security signals by navigating to [ASM signals](https://app.datadoghq.com/security?query=%40workflow.rule.type%3A%22Application%20Security%22&column=time&order=desc&product=appsec&view=signal)



![Security Signal](./imgs/ssrf2-signal-1.png "Security Signal")
![Security Signal](./imgs/ssrf2-signal-2.png "Security Signal")