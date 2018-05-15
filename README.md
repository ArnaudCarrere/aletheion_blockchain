# Accounts Certification Network
A blockchain POC on Hyperledger Composer 

> This is a Hyperledger Composer POC, which demonstrates the core functionalities of our solution by changing the status of the accounts after a decision taken by the corresponding company.

**This network defines:**
- A network of decentralized companies (participants) that participates in the network by managing their bank accounts.
- An account is added to the blockchain by a bank as Awaiting during a transfer.
- An account can be Rejected or Certified through the mobile app by the associated company.

**Participant**
`Company`

**Asset**
`Account`

**Transaction**
`CertifiedTransaction`
`RejectedTransaction`

**Event**
`CertifiedEvent`
`RejectedEvent`
`ErrorEvent`

Accounts are added to the blockchain by banks and processed by companies as Certified or Rejected by submitting either a CertifiedTransaction or RejectedTransaction. These transactions and events must be submitted by the company corresponding to the account. Once the account is processed, the bank receives the result to finish the transfer.

To test this Business Network Definition in the **Test** tab:

Create a `Company` participant:

```
{
  "$class": "org.acme.sample.Company",
  "companyId": "peugeotId",
  "companyName": "Automobiles Peugeot",
  "address": "7 RUE HENRI STE CLAIRE DEVILLE 92563 RUEIL-MALMAISON",
  "touch":"To configure",
  "siret": 55214450301248
}
```

Create a `Account` asset:

```
{
  "$class": "org.acme.sample.Account",
  "accountId": "1",
  "company": "resource:org.acme.sample.Company#peugeotId",
  "accountName": "PEUGEOT IVRY",
  "iban": "FR7630004015870002601171220",
  "status": "Awaiting"
}
```

Submit a `CertifiedTransaction` transaction:

```
{
  "$class": "org.acme.sample.CertifiedTransaction",
  "account": "resource:org.acme.sample.Account#1",
  "company": "resource:org.acme.sample.Company#peugeotId"
}
```

After submitting this transaction, you should now see the transaction in the Transaction Registry and that a `CertifiedEvent` has been emitted.

Submit a `RejectedTransaction` transaction:

```
{
  "$class": "org.acme.sample.RejectedTransaction",
  "account": "resource:org.acme.sample.Account#1",
  "company": "resource:org.acme.sample.Company#peugeotId"
}
```

After submitting this transaction, you should now see the transaction in the Transaction Registry and that a `RejectedEvent` has been emitted.
