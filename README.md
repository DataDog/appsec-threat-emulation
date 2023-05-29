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

## Installation

To install the Threat Emulation Project and set up the environment, follow these steps:



1. **Clone the Repository**: with the included sub-module

    ```shell
    git clone --recurse-submodules git@github.com:DataDog/asm-threat-emulation.git
    ```


2. **Setup & Configuration**: run the setup script to build the docker images and configure the required environment variables
    ```shell
    ./setup.sh
    ```

5. **Run the vulnerable app**: Launch the Threat Emulation Project by running the following command:

   ```shell
   docker-compose up juiceshop
   ```
The application should be accessible via this url `http://localhost:8081`


## Usage

Once the Threat Emulation Project is running and accessible through your web browser, you can start emulating attacks on the Juice Shop web application.


### Using CLI


* List the available attacks

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```

result
```
┌────┬────────────────────────────────────────────────────────────┐
│ ID │ Attack name                                                │
├────┼────────────────────────────────────────────────────────────┤
│ 1  │ Generic security scan                                      │
├────┼────────────────────────────────────────────────────────────┤
│ 2  │ Security scan using known attack tools                     │
├────┼────────────────────────────────────────────────────────────┤
│ 3  │ SQL injection attacks on a a non-vulnearble endpoint       │
├────┼────────────────────────────────────────────────────────────┤
│ 4  │ Successful SQL injection attack on a a Vulnearble endpoint │
├────┼────────────────────────────────────────────────────────────┤
│ 5  │ SSRF attacks on a non-vulnearble endpoint                  │
├────┼────────────────────────────────────────────────────────────┤
│ 6  │ Successful SSRF attack on a Vulnearble endpoint            │
├────┼────────────────────────────────────────────────────────────┤
│ 7  │ Credential stuffing attack                                 │
└────┴────────────────────────────────────────────────────────────┘
```

* Running specific attack

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a <attack ID>
```

Example

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 5
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

Each attack is documented with step-by-step instructions, explanations of the underlying vulnerabilities, and suggested mitigation techniques.

## Contributing

At the time, the repository is not accepting contributions. However, if you'd like to share an interesting attack or threat with us, reach out at securitylabs@datadoghq.com!

## License

TBD


---- 
Idea

- give the customer a shell inside the container to exec popular tools like sqlmap or bla bla 

