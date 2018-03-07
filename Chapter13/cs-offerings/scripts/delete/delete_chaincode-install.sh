#!/bin/bash

if [ "${PWD##*/}" == "delete" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/delete' folder"
fi

# The env variables don't matter as we are deleting pods
PEER_ADDRESS="DoesntMatter"
PEER_MSPID="DoesntMatter"
MSP_CONFIGPATH="DoesntMatter"
CHAINCODE_NAME="DoesntMatter"
CHAINCODE_VERSION="DoesntMatter"
CHANNEL_NAME="DoesntMatter"

# Delete Install Chaincode Pod
echo "Preparing yaml for chaincodeinstall pod"
sed -e "s/%PEER_ADDRESS%/${PEER_ADDRESS}/g" -e "s/%PEER_MSPID%/${PEER_MSPID}/g" -e "s|%MSP_CONFIGPATH%|${MSP_CONFIGPATH}|g"  -e "s/%CHAINCODE_NAME%/${CHAINCODE_NAME}/g" -e "s/%CHAINCODE_VERSION%/${CHAINCODE_VERSION}/g" ${KUBECONFIG_FOLDER}/chaincode_install.yaml.base > ${KUBECONFIG_FOLDER}/chaincode_install.yaml

echo "Deleting Existing Install Chaincode Pod"
if [ "$(kubectl get pods -a | grep chaincodeinstall | wc -l | awk '{print $1}')" != "0" ]; then
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/chaincode_install.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/chaincode_install.yaml

    # Wait for the pod to be deleted
    while [ "$(kubectl get pods -a | grep chaincodeinstall | wc -l | awk '{print $1}')" != "0" ]; do
        echo "Waiting for old install chaincode Pod to be deleted"
        sleep 1;
    done

    echo "Install chaincode pod deleted successfully."
else
    echo "Install chaincode pod doesn't exist. No need to delete."
fi
