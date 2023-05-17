# Application Security Threat Emulation 
TBD



# Setup

1. Create a Datadog API Key (Follow this instruction to get or create your API key)


2. Add the key to environment variable

```
cp .env.example .env
```

Then open `.env` file and add your datadog API Key

```env
DD_API_KEY="<Datadog API Key>"
```

3. Run the docker compose

```
docker-compose up juiceshop
```