#!/bin/bash
set -e

echo "SETUP your local environment for the first time :) "

read -e -p "what's your datadog api key please: " API_KEY

read -e -p "What's the service name [simple-test-service]: " SERVICE_NAME

echo "Valid DD_SITE values:"
echo "  - datadoghq.com (us1)"
echo "  - datadoghq.eu (eu1)"
echo "  - us3.datadoghq.com (us3)"
echo "  - us5.datadoghq.com (us5)"
read -e -p "What's the DD_SITE (leave empty for datadoghq.com): " DD_SITE

if [ "$DD_SITE" == "eu1" ]; then DD_SITE="datadoghq.eu"; fi
if [ "$DD_SITE" == "us1" ]; then DD_SITE="datadoghq.com"; fi
if [ "$DD_SITE" == "us3" ]; then DD_SITE="us3.datadoghq.com"; fi
if [ "$DD_SITE" == "us5" ]; then DD_SITE="us5.datadoghq.com"; fi

echo "Creating the environment variables ..."

echo "DD_API_KEY=$API_KEY" > .env
echo "DD_SERVICE=${SERVICE_NAME:-peer-test-service}" >> .env
echo "DD_SITE=${DD_SITE:-datadoghq.com}" >> .env

# source .env

echo "Building the vulnerable docker container"

docker-compose build juiceshop

echo "Building the threat cli tool"

cd cli
docker build -t appsec/threat-cli .
cd ..

echo 'Done, you can now run docker-compose up juiceshop.'
echo "docker-compose up juiceshop"
echo 'And you can use the appsec/threat-cli to test various kind of threats'
echo "Examples:"
echo "docker run --rm -t --network appsec-threat-emulation-network appsec/threat-cli list"
echo "docker run --rm -t --network appsec-threat-emulation-network appsec/threat-cli run -a 1"