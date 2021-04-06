## Automation Dashboard

### Install dependencies

```bash
yarn
```

### Set up a Postgres database

```bash
yarn db:start
```

### Configure environment variables

Copy the `.env.local.example` file in this directory to `.env.local` (this will be ignored by Git):

```bash
cp .env.local.example .env.local
```

Set the `PG_URI` variable in `.env.local` to the connection uri of your postgres database.
Set other environment variables related to JWT and allowed user/role. May change in the future once authentication is setup.

### Apply migrations

You can create, apply and rollback migrations using the scripts in `package.json`.

```bash
yarn migrate:latest
```

### Start Next.js in development mode

```bash
yarn dev
```

Your app should now be up and running on [http://localhost:3000](http://localhost:3000)!
