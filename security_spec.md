# Security Specification: CarMatch Firebase Firestore

## 1. Data Invariants
1. A workspace ID must be alphanumeric and bounded in length (`isValidId(workspaceId)`).
2. Vehicle documents stored in `/workspaces/{workspaceId}/vehicles/{vehicleId}` must have valid IDs matching the path.
3. Every write requires authentication (anonymous or identity token).
4. Vehicles must satisfy minimum data integrity: `make`, `model`, `year`, `price` must be well-formed with bounded strings and positive numbers.
5. Injected oversized fields, arbitrary keys or malicious prototype properties must be rejected.
6. Preferences in `/workspaces/{workspaceId}/config/preferences` must enforce positive numbers for annual mileage and prices.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read**: Attempting to read `/workspaces/demo/vehicles/v1` without `request.auth`.
2. **Unauthenticated Write**: Attempting to write a vehicle without `request.auth`.
3. **Workspace ID Injection**: Document ID containing path traversal characters like `../../etc`.
4. **Oversized Make Payload**: Vehicle with `make` string exceeding 128 characters.
5. **Negative Price Attack**: Vehicle with `price: -50000`.
6. **Negative Year Attack**: Vehicle with `year: 1800` or `year: 3000`.
7. **Junk Key Injection**: Adding unauthorized root keys to Vehicle document.
8. **Malicious Script in Notes**: Note string exceeding maximum size limit (10,000 chars).
9. **Invalid Mileage in Preferences**: Setting `annualKm: -1000`.
10. **Arbitrary Config ID Attack**: Attempting to write arbitrary documents outside authorized subcollections.
11. **Massive Array Attack**: Uploading an array of 5,000 photos in a single vehicle doc.
12. **Null Vehicle Object**: Attempting to update a vehicle with non-object payload.

## 3. Test Runner
Verified against Firestore Security Rules using Firebase emulator and structural rules evaluation.
