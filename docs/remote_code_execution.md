# Remote Code Execution (RCE) via Server-Side Template Injection

## Overview
This attack simulates a Remote Code Execution (RCE) attack through Server-Side Template Injection (SSTI) on a vulnerable endpoint. The attack exploits a template injection vulnerability in the user profile update functionality to execute arbitrary system commands on the server.

```
├────┼────────────────────────────────────────────────────────────┤
│ 12 │ Remote code execution                                      │
└────┴────────────────────────────────────────────────────────────┘
```

## SSTI-based Remote Code Execution

```shell
docker run --rm -t --network appsec-threat-emulation-network asm/threat-cli run -a 12
```

This command will run the CLI inside the docker container. The CLI will execute an SSTI attack that leads to remote code execution on the vulnerable application.

### Attack Flow

1. **User Creation and Login**: The attack first creates a new user account and authenticates to obtain a valid session token.

2. **SSTI Payload Injection**: The attack sends a POST request to the `/profile` endpoint with a malicious username containing an SSTI payload: `#{require('child_process').execSync('whoami')}`

3. **Code Execution**: When the application processes this username through its template engine without proper sanitization, the injected code is executed on the server, running the `whoami` command.

```shell
Running attack #12: Remote code execution
Target URL:  http://juiceshop:3000
✔ Attack executed
```

### Result
After launching this attack, you will be able to find a track in Datadog ASM explorer and Workload Protection detection.

### Security Traces
You can review the security traces by navigating to [ASM trace](https://app.datadoghq.com/security/appsec/traces)

The traces will show the malicious SSTI payload in the request parameters, and ASM will detect the pattern indicative of template injection attempts.
