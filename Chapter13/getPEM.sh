#!/bin/bash
 
. ../common_OSX.sh

function getPEM ()
{
    showStep "getting pod list and full name for blockchain-ca pod"
    CA_POD=$(kubectl get pods | grep 'blockchain-ca' | awk '{print $1}')

    showStep "ca pod name is: $CA_POD"
    CA_TARGET="controller/restapi/features/composer/creds"
    CA_SOURCE="/shared/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/admincerts/Admin@example.com-cert.pem"
    HFC_KEYSTORE="~/.hfc-key-store"

    showStep "Retrieving pem file from ${CA_POD}"
    if [ -d $CA_TARGET ]; then
        echo "$CA_TARGET exists, deleting"
        rm -r $CA_TARGET
    else
        echo "$CA_TARGET does not exist"
    fi
    mkdir $CA_TARGET

    showStep "creating key files for PeerAdmin, saving to $CA_TARGET"
    cp -v ~/.composer/client-data/PeerAdmin@hlfv1/* $CA_TARGET
    cp -v ~/.composer/client-data/PeerAdmin@hlfv1/* ~/.hfc-key-store
    KEY_PREFIX=$(cat $CA_TARGET/PeerAdmin | sed -e 's/[}"]*\(.\)[{"]*/\1/g;y/,/\n/' | grep 'signingIdentity:' | sed 's/^.*://')
    cp $CA_TARGET/$KEY_PREFIX"-priv" $CA_TARGET/$KEY_PREFIX"_sk"

    showStep "Please enter your root password for this O/S now"
    sudo cp $CA_TARGET/$KEY_PREFIX"-priv" $HFC_KEYSTORE/$KEY_PREFIX"_sk"
    
    showStep "copying ca.pem file to $CA_SOURCE"
    kubectl exec $CA_POD cat $CA_SOURCE >> $CA_TARGET/ca.pem
}

getPEM

