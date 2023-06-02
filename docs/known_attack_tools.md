# Attack from a known security tools

## overview
This attack is simulating attacking with known security tools.


## Run the attack
You can run the attacks using our cli tool.

```shell
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```

This command will run the CLI inside the docker container. The CLI will launch attacks from this [file](./../cli/attacks/generic-payloads.txt) pretending to come from known security tools.

```shell
Running attack #2:  Security scan using known attack tools
Target URL:  http://juiceshop:3000
✔ Basic security scan - done
```

## Result
After launching this attack, you will be able to find the traces in Datadog ASM explorer and a attack tools signal will be generated.

### Security Traces
You can review the security traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces).

![Security Traces](./imgs/attack-tools-traces.png "Security Traces")


### Attack tool Signal
A Attack Tool signal will be generated with severity low. You can review the security signals by navigating to [ASM Signals](https://app.datadoghq.com/security?query=%40workflow.rule.type%3A%22Application%20Security%22&column=time&order=desc&product=appsec&view=signal).



![Security Signal](./imgs/attack-tools-signal-1.png "Security Signal")
![Security Signal](./imgs/attack-tools-signal-2.png "Security Signal")