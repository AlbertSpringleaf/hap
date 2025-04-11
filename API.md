# API Documentatie Koopovereenkomsten

## Inhoudsopgave
- [Authenticatie](#authenticatie)
- [Endpoints](#endpoints)
  - [Koopovereenkomst aanmaken](#koopovereenkomst-aanmaken)
  - [Koopovereenkomsten ophalen](#koopovereenkomsten-ophalen)
- [Foutafhandeling](#foutafhandeling)
- [Voorbeelden](#voorbeelden)

## Authenticatie

Alle API endpoints vereisen authenticatie via NextAuth. De authenticatie wordt afgehandeld via een sessie token die automatisch wordt meegestuurd in de headers van het verzoek.

## Endpoints

### Koopovereenkomst aanmaken

**Endpoint:** `POST /api/koopovereenkomsten`

Maakt een nieuwe koopovereenkomst aan met een base64-gecodeerde PDF.

#### Request Body

```json
{
  "naam": "string",
  "pdfBase64": "string"
}
```

| Parameter  | Type   | Verplicht | Beschrijving                                    |
|------------|--------|-----------|-------------------------------------------------|
| naam       | string | Ja        | Naam van de koopovereenkomst                    |
| pdfBase64  | string | Ja        | Base64-gecodeerde inhoud van de PDF             |

#### Response

Bij succes:
```json
{
  "id": "string",
  "naam": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "userId": "string"
}
```

#### Foutcodes

- `400` - Ongeldige input (ontbrekende verplichte velden)
- `401` - Niet geauthenticeerd
- `404` - Gebruiker niet gevonden
- `500` - Server fout

### Koopovereenkomsten ophalen

**Endpoint:** `GET /api/koopovereenkomsten`

Haalt alle koopovereenkomsten op voor de ingelogde gebruiker.

#### Response

```json
[
  {
    "id": "string",
    "naam": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "userId": "string"
  }
]
```

#### Foutcodes

- `401` - Niet geauthenticeerd
- `404` - Gebruiker niet gevonden
- `500` - Server fout

## Foutafhandeling

Alle endpoints retourneren een JSON response met een `error` veld in geval van een fout:

```json
{
  "error": "Foutmelding"
}
```

## Voorbeelden

### Koopovereenkomst aanmaken met cURL

```bash
curl -X POST http://your-domain/api/koopovereenkomsten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_auth_token" \
  -d '{
    "naam": "test_document.pdf",
    "pdfBase64": "JVBERi0xLjcKCjEgMCBvYmogICUgZW50..."
  }'
```

### Koopovereenkomsten ophalen met cURL

```bash
curl -X GET http://your-domain/api/koopovereenkomsten \
  -H "Authorization: Bearer your_auth_token"
```

### Koopovereenkomst aanmaken met JavaScript/Fetch

```javascript
const response = await fetch('/api/koopovereenkomsten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    naam: 'test_document.pdf',
    pdfBase64: 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50...'
  }),
});

const data = await response.json();
```

### Koopovereenkomsten ophalen met JavaScript/Fetch

```javascript
const response = await fetch('/api/koopovereenkomsten');
const data = await response.json();
``` 