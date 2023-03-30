## Automation Dashboard

### 1. Install dependencies

```bash
yarn
```

### 2. Set up a Postgres database

```bash
yarn db:start
```

### 3. Configure environment variables

Copy the `.env.local.example` file in this directory to `.env.local` (this will be ignored by Git):

```bash
cp .env.local.example .env.local
```

Change the `PG_URI` variable in `.env.local` if using connection URI different than the default.

### 4. Apply migrations

You can create, apply and rollback migrations using the scripts in `package.json`.

```bash
yarn migrate:latest
```

### 5. Generate a JWT token

Set the following environment variables at `.env.local`. The values are example only and should be changed in your production deployment.
```
JWT_SECRET=changewithrandomsecret6du58QrVV87N8FDB
JWT_USER=cypress-test
JWT_ROLE=integration
JWT_ALG=HS256
JWT_EXPIRES_IN=365d
```

Once set, run `node script/sign.js` to sign and generate a JWT token.
Copy the token value and set the following environment variables at `.env.local`:

```
ALLOWED_USER=cypress-test
ALLOWED_ROLE=integration
JWT_SIGNED_TOKEN=eyJhb<... and the rest of token value>
```

### 6. Optional environment variables

`UPLOAD_REQUEST_URL`: Used for uploading images to an S3 bucket. This is a lambda function with request authorizer. Source is not available here but will be added soon.
`BASE_IMAGE_URL`: Used by NextJS to load images from a certain domain.

### 7. Start Next.js in development mode

```bash
yarn dev
```

Your app should now be up and running at [http://localhost:4000](http://localhost:4000)!

### 8. Integrate with Cypress test runner

a. Go to your local directory of `https://github.com/mattermost/mattermost-server/e2e-tests/cypress` and install package dependencies.

```
cd mattermost-server/e2e-tests/cypress
npm i
```

b. Set the following environment variables:
```
export AUTOMATION_DASHBOARD_URL=http://localhost:4000/api
export AUTOMATION_DASHBOARD_TOKEN=eyJhb<... and the rest of token value>
export REPO=mattermost-server
export BRANCH=master
export BUILD_ID=1
```

Note: Combination of `REPO`, `BRANCH` and `BUILD_ID` must be unique every time you generate a test cycle.

c. Generate a test cycle 
```
# With all tests
node generate_test_cycle.js

# With certain filter based on stage and group metadata
node generate_test_cycle.js --stage=@prod --group=@playbooks
```

Note: A log is printed either it's successfully created or not. If successful, you should be able to see the newly created cycle at `http://localhost:4000/cycles`.

4. Run Cypress test with the Automation Dashboard orchestrating the spec file:
```
# Required and used to track which server in parallel is running the test
export CI_BASE_URL=localhost-1

node run_test_cycle.js
```

Note: Visit `http://localhost:4000/cycles` and see if the cycle is running a test.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?c=1&s=https://github.com/saturninoabril/automation-dashboard)

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=automation-dashboard) ([Documentation](https://nextjs.org/docs/deployment)).
