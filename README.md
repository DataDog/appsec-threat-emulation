# Application Security Threat Emulation 
TBD



## Setup

1. Create a Datadog API Key (Follow this instruction to get or create your API key)


2. run the setup script
> setup script is a bash script to build the docker images and setup the required environment variables

```
./setup.sh
```



## Emulate threats

1. Run the vulnerable docker containers

```
docker-compose up juiceshop
```

2. Run the simulation tool

```
docker run --rm -t --network asm-threat-emulation-network asm/threat-cli run -a 1
```


