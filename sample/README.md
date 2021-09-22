Sample project for Imposter with Jest
=====================================

## Prerequisites

- Node.js 12+
- [Imposter CLI](https://github.com/gatehill/imposter-cli)

## Instructions

Run tests as follows:

	npm install
    npm test

## Details

Three third party services are defined using OpenAPI specifications under the `third-party` directory:

- order-service
- pet-name-service
- stock-service

Some are 'bare' directories containing only OpenAPI files, and others have Imposter configuration files, dynamic scripts etc. 
