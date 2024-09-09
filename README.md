# Getting started with developing for the Critter Capture Club

Prerequisites:

- Clone the repo
- Ensure you have `pnpm` installed
- Run `pnpm install` to install the dependencies

To get started with development, you have a couple options.

## UI only development

If you're interested on working on the UI, you can use the production API by default.

Run `pnpm --filter=@critter/ui start` to start the development server and point your browser to http://localhost:5173. Make any changes you'd like and submit a PR for it!

## UI & API development

If you're interested in working on both the UI and API, there are a couple more steps to complete.

- Ensure you have `docker` installed and running on your machine
- You will need to copy the `src/services/api/.env.example` file to `src/services/api/.env` and supply the correct environment variables.

### Variables you will need to change

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_USERNAME`

Go to the [Twitch Developer Dashboard](https://dev.twitch.tv/console) and create a new application to get your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`. Ensure that you set the redirect URL to `http://localhost:35523/auth/redirect` & `http://localhost:35523/admin/redirect`.

You also need to specifiy the username of the bot you'd like to use in the `TWITCH_USERNAME` variable. For development, it makes sense to use your own.

- `STORAGE_ACCOUNT_NAME`
- `STORAGE_ACCOUNT_KEY`
- `CONTAINER_NAME`

Currently, we don't support the Azurite emulator for local development, so you'll need to have an Azure storage account and container that you can use.

### Variables you could change

- `JWT_SECRET`

This is the secret that the API uses to sign the JWTs. For local development, you can stick to the default value but know that it makes the token insecure.

- `COMMAND_PREFIX`

This is the prefix that the bot will respond to. If you're developing in a channel with other people/bots, it's a good idea to change this so you don't have commands that conflict with others.

- `CHANNELS_TO_LISTEN_TO`

This is an array of channels that the bot will join and listen to. Probably just stick to your own channel for local development.

### Variables you probably should keep the same

- `UI_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_SSL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `HOST`
- `PORT`

These are all the default values that are used when the local docker compose file is ran. Unless you have a reason to change them, it's best to keep them the same.

### Running the services

In the root of the repo, run `docker compose up` to start the remaining services needed for the API to function.

- Edit the file found in `apps/ui/src/services/backstage/local.ts` and point the `apiBaseUrl` to the API URL you're running locally. (You can probably just uncomment the line.)

You can now make changes to both the UI and API and submit a PR for it!

- Run `pnpm --filter=@critter/api start` to start the API (you can use `pnpm --filter=@critter/api dev` to start the API in "watch" mode.)
- Run `pnpm --filter=@critter/ui start` to start the UI

### Seeding the database

You will need to seed the database with the correct data.

The most important thing to to set a role for your account so you can access the UI. Create an entry in the `Roles` table, add your username and set yourself as an Admin. (This will be scripted soon.)

### Running the chat service

You will need to authenticate the bot in order for it to connect to Twitch. When running both the UI & the API, go to http://localhost:5173/status and authenticate the bot with the correct credentials.
