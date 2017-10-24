# ZeroToBlockchain Chapter 11: Building the Unified User Experience

[Return to Table of Contents](../README.md)

In this chapter, we will build a nodeJS web server which will interact with the HyperLedger Composer defined Blockchain. This runs on HyperLedger Fabric Version 1.0. The code that we will write is managed in this chapter and all the subsequent chapters in the following folder structure:

```
Chapter 05
  ↳ controller
     ↳restapi
       router.js
        ↳features
           ↳composer
             autoLoad.js
             hlcAdmin.js
             hlcClient.js
             queryBlockChain.js
             Z2B_Services.js
             Z2B_Utilities.js
           ↳ text
               multi-lingual.js
               resources.js
  ↳ HTML
    index.html
    admin.html
    buyer.html
    ceateConnectionProfile.html
    createMember.html
    createOrder.html
    deleteConnectionProfile.html
    financeCo.html
    getMemberSecret.html
    removeMember.html
    provider.html
    seller.html
    shipper.html
    singleUX.html
     ↳CSS
       pageStyles.css
     ↳js
       z2b-admin.js
       z2b-buyer.js
       z2b-events.js
       z2b-financeCo.js
       z2b-initiate.js
       z2b-provider.js
       z2b-seller.js
       z2b-shipper.js
       z2b-utilities.js
  ↳ network
   permissions.acl
   queries.qry
    ↳lib
      sample.js
    ↳models
      base.cto
      events.cto
      sample.cto
```
One new file is created and two existing files are updated:

## Files used in this chapter
### Web Server Code Unique to this Chapter
 - **no updates**

### Defining the business network
 
 - **np updates**
 

### Web Browser Code 
 - **singleUX.html**
   - This page loads a 2x2 table, with one cell each for Buyer (top left), Seller (top right), Provider (bottom left) and Shipper (bottom right).
 - **z2b-events.js**
   - This the loadSingleUX() function is updated to simultaneously display all four members simultaneously
 - **CSS/pageStyles.css**
   - CSS controls the look and feel of a web page. This file is updated to support putting all four roles into a single web page at the same time.