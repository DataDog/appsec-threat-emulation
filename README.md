# Application Security Threat Emulation 
TBD



## Setup

1. Create a Datadog API Key (Follow this instruction to get or create your API key)


2. run the setup script
> setup script is a bash script to build the docker images and setup the required environment variables

```
./setup.sh
```



## Run

1. Run the vulnerable docker containers

```
docker-compose up juiceshop
```

2. Run the simulation tool

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```



## Threat emulation

1. List the available attacks

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```

result
```
┌────┬─────────────────────────────────────────────────────────────┐
│ ID │ Attack name                                                 │
├────┼─────────────────────────────────────────────────────────────┤
│ 1  │ Basic SQL injection attack on a [ non-vulnearble ] endpoint │
├────┼─────────────────────────────────────────────────────────────┤
│ 2  │ SQL injection attack on a [ vulnearble ] endpoint           │
└────┴─────────────────────────────────────────────────────────────┘
```

2. running attack

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```

result
```
Running attack #1:  Basic SQL injection attack on a [ non-vulnearble ] endpoint
Target URL:  http://juiceshop:3000
⠸ Basic SQL Injection: 1) or sleep(__TIME__)#
```