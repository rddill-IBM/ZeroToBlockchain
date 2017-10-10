#!/bin/bash
 
. ../common_OSX.sh

showStep "adding PeerAdmin to wallet"
showStep "Admin is taken from composer fabric tools: fabric-tools/fabric-scripts/hlfv1/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts"
showStep "keystore is taken from composer fabric tools: fabric-tools/fabric-scripts/hlfv1/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
composer identity import -p hlfv1 -u PeerAdmin -c ./controller/restapi/features/composer/certs/msp/signcerts/Admin@org1.example.com-cert.pem -k ./controller/restapi/features/composer/certs/msp/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_priv
