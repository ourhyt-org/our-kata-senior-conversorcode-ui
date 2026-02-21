# Legacy2Modern Frontend

Angular 21 single-page UI for migrating legacy COBOL/Delphi code to modern targets by calling `POST /migrate`.

## Run locally

```bash
npm install
npm run start
```

Or with Angular CLI:

```bash
ng serve
```

App runs at `http://localhost:4200`.

## Backend configuration

Set API config in:

`src/environments/environment.ts`

```ts
export const environment = {
  apiBaseUrl: 'https://dev-api.ourhyt.art',
  apiKey: '<dev key>',
};
```

Production values are in:

`src/environments/environment.prod.ts`

The frontend calls `${apiBaseUrl}/migrate` and sends `X-API-KEY`.

For kata/demo only: browser API keys are visible to users and should not be treated as secure secrets.

## Test

```bash
npm run test -- --watch=false
```
