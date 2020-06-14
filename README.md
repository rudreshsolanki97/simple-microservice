# Simple Microservice

A simple express app demonstrating two  independent services namely `auth` and `user`.  
The `auth` service will be responsible for authentication related APIs like login, logout, validate/renew. The `user` service will cater to user functionalities like getting a user's profile, sign-up.

## Pre-Requisites

Following software are required to run this app.  
- docker
- docker-compose

## Running

Following are the steps to start the app

1. Setup .env files for both services ( refer .env.example )
2. From the root directory run `docker-compose build`
3. From the root directory run `docker-compose up`
4. To terminate: `docker-compose down`
## Interaction

* Auth - PORT 3001
* User - PORT 3002
* MongoDB - PORT 27017

Refer Postman collection for direct requests.  
Setup `Bearer token` for authentication wherever required.