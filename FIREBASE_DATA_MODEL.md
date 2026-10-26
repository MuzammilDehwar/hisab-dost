# Hisab Dost Firebase data model

Hisab Dost uses Firebase Realtime Database on the free-friendly path below. No Firestore collections are required.

```text
users/
  {firebaseUid}/
    app/
      state/
        sales: []
        expenses: []
        customers: []
        customerTransactions: []
        products: []
        suppliers: []
        purchases: []
        settings: {}
        updatedAt: Firebase ServerValue.TIMESTAMP
```

`database.rules.json` allows only the authenticated owner of `{firebaseUid}` to read or write that user's state. Supplier and purchase arrays are created automatically the first time the app saves the updated state; there is no shared admin collection.
