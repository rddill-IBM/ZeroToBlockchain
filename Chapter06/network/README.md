# bd test Business Network

> test network for bd for hyplerledger compose.

This business network defines:

**Participant**
`Buyer`
`Seller`
`Provider`
`Shipper`
`FinanceCo`

**Asset**
`Order`

**Transaction**
`CreateOrder`
`Buy`
`OrderFromSupplier`
`RequestShipping`
`Deliver`
`RequestPayment`
`Pay`
`Dispute`
`Resolve`
`Backorder`

**Event**
`(none yet)`

Orders are created by Buyers and executed by Sellers, who may work with a 3rd part (Provider) to fulfill the order. Either Sellers or Providers can RequestShipment, which is fulfilled by a Shipper who executes a Deliver transaction when complete. Orders can be Disputed. Disputed Orders can be resolved. Payments are made against either Delivered or Resolved Orders. 

To test this Business Network Definition in the **Test** tab:

Create a `Order` asset:

```
asset Order identified by orderNumber {
    o String orderNumber
    o String status
    o Integer amount
    o String created
    o String bought
    o String ordered
    o String dateBackordered
    o String requestShipment
    o String delivered
    o String disputeOpened
    o String disputeResolved
    o String paymentRequested
    o String orderRefunded
    o String paid
    o String[] vendors
    o String dispute
    o String resolve
    o String backorder
    o String refund
    --> Buyer buyer
    --> Seller seller 
```

Create a participant:

```
participant Buyer identified by buyerID {
    o String buyerID
    o String companyName
}
participant Seller identified by sellerID {
    o String sellerID
    o String companyName
}

asset Order identified by orderNumber {
    o String orderNumber
    o String status
    o Integer amount
    o String created
    o String bought
    o String ordered
    o String dateBackordered
    o String requestShipment
    o String delivered
    o String disputeOpened
    o String disputeResolved
    o String paymentRequested
    o String orderRefunded
    o String paid
    o String[] vendors
    o String dispute
    o String resolve
    o String backorder
    o String refund
    --> Buyer buyer
    --> Seller seller 

}
participant Shipper identified by shipperID {
    o String shipperID
    o String companyName
}
participant Provider identified by providerID {
    o String providerID
    o String companyName
}
participant FinanceCo identified by financeCoID {
    o String financeCoID
    o String companyName
}
```

Submit a  transaction:

```
  transaction CreateOrder {
    o Integer amount
    --> Order order
    --> Buyer buyer
    --> Seller seller
}
  transaction Buy {
    --> Order order
    --> Buyer buyer
    --> Seller seller
}
  transaction OrderFromSupplier {
    --> Order order
    --> Provider provider
}
  transaction RequestShipping {
    --> Order order
    --> Shipper shipper
}
  transaction Deliver {
    --> Order order
    --> Shipper shipper
}
  transaction BackOrder {
    o String backorder
    --> Order order
    --> Provider provider
}
  transaction Dispute {
    o String dispute
    --> Order order
    --> Buyer buyer
    --> Seller seller
    --> FinanceCo financeCo
}
  transaction Resolve {
    o String resolve
    --> Order order
    --> Buyer buyer
    --> Seller seller
    --> FinanceCo financeCo
}
  transaction RequestPayment {
    --> Order order
    --> Buyer buyer
    --> Seller seller
    --> FinanceCo financeCo
}
  transaction Pay {
    --> Order order
    --> Seller seller
    --> FinanceCo financeCo
}
  transaction Refund {
    o String refund
    --> Order order
    --> Buyer buyer
    --> Seller seller
    --> FinanceCo financeCo
}
```
