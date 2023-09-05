# Application Security Threat Emulation


## Table of Contents

- [Introduction](#introduction)
- [Project Overview](#project-overview)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Attacks](#supported-attacks)
- [Contributing](#contributing)
- [License](#license)

## Introduction

The Application Security Threat Emulation Project is designed to emulate web application attacks and threats against the popular vulnerable application "Juice Shop" This project aims to provide a controlled environment for security professionals, developers, and enthusiasts to learn and practice their skills in identifying and mitigating web application vulnerabilities.

## Project Overview

The project utilizes the Juice Shop application, a deliberately insecure web application developed with security flaws intentionally built-in. By simulating attacks on Juice Shop, users can gain hands-on experience in identifying and exploiting vulnerabilities commonly found in real-world web applications.

Key features of the Threat Emulation Project:

- Emulates real-world web application attacks and threats.
- Utilizes the vulnerable application "Juice Shop" as a target.
- Out of the box integration with Datadog ASM 


## Disclaimers
This repository contains deliberately insecure web application. Do not deploy it in any production environment.

## Getting started

1. export your Datadog API key 
```
export DD_API_KEY="<api-key>"
```

2. Build and run the necessary containers
```
docker compose up  -d
```
> the above command will run the `datadog agent`, `juiceshop` vulnerable application, and the tool container

3. Run the threat emulation tool
```
docker exec -it appsec-threat-emulation ./cli help
```

## Usage

Once the Threat Emulation Project is running and accessible through your web browser, you can start emulating attacks on the Juice Shop web application.


### Using CLI


* List the available attacks

```
docker exec -it appsec-threat-emulation ./cli list
```

result
```
┌────┬────────────────────────────────────────────────────────────┐
│ ID │ Attack name                                                │
├────┼────────────────────────────────────────────────────────────┤
│ 1  │ Security scan using known attack tools                     │
├────┼────────────────────────────────────────────────────────────┤
│ 2  │ Generic security scan                                      │
├────┼────────────────────────────────────────────────────────────┤
│ 3  │ Log4Shell attack on a a Non-Vulnerable application         │
├────┼────────────────────────────────────────────────────────────┤
│ 4  │ SQL injection attacks on a a Non-Vulnerable endpoint       │
├────┼────────────────────────────────────────────────────────────┤
│ 5  │ Successful SQL injection attack on a a Vulnerable endpoint │
├────┼────────────────────────────────────────────────────────────┤
│ 6  │ SSRF attacks on a Non-Vulnerable endpoint                  │
├────┼────────────────────────────────────────────────────────────┤
│ 7  │ Successful SSRF attack on a Vulnerable endpoint            │
├────┼────────────────────────────────────────────────────────────┤
│ 8  │ Credential stuffing attack                                 │
├────┼────────────────────────────────────────────────────────────┤
│ 9  │ Spam campaign                                              │
└────┴────────────────────────────────────────────────────────────┘
```

* Running specific attack

```
docker exec -it appsec-threat-emulation ./cli run -a <attack ID>
```

Example

```
docker exec -it appsec-threat-emulation ./cli run -a 5
```

Result
```
Running attack #1:  Basic SQL injection attack on a [ non-vulnearble ] endpoint
Target URL:  http://juiceshop:3000
⠸ Basic SQL Injection: 1) or sleep(__TIME__)#
```

## Supported Attacks

The Threat Emulation Project supports a wide range of attacks commonly found in web application security assessments. Some of the supported attacks include:

- General attacks (Security Scanners)
- SQL Injection attacks 
- SSRF attack
- Credential stuffing attack

Each attack is documented with [step-by-step instructions](./docs/), explanations of the underlying vulnerabilities, and suggested mitigation techniques.

## Contributing

We're open to contributions.  
If you're looking to introduce new threats to the repo, please reach out at securitylabs@datadoghq.com so that we can move forward faster!

## License

TBD