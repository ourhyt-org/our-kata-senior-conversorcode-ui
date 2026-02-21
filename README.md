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

## Backend URL configuration

Set backend base URL in:

`src/environments/environment.ts`

```ts
export const environment = {
  API_BASE_URL: 'http://localhost:8080',
};
```

The frontend calls `${API_BASE_URL}/migrate`.

## Test

```bash
npm run test -- --watch=false
```
