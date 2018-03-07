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

# Delete Instantiate Chaincode Pod
echo "Preparing yaml for chaincode instantiate delete"
sed -e "s/%CHANNEL_NAME%/${CHANNEL_NAME}/g" -e "s/%PEER_ADDRESS%/${PEER_ADDRESS}/g" -e "s/%PEER_MSPID%/${PEER_MSPID}/g" -e "s|%MSP_CONFIGPATH%|${MSP_CONFIGPATH}|g"  -e "s/%CHAINCODE_NAME%/${CHAINCODE_NAME}/g" -e "s/%CHAINCODE_VERSION%/${CHAINCODE_VERSION}/g" ${KUBECONFIG_FOLDER}/chaincode_instantiate.yaml.base > ${KUBECONFIG_FOLDER}/chaincode_instantiate.yaml

echo "Deleting Existing Instantiate Chaincode Pod"
if [ "$(kubectl get pods -a | grep chaincodeinstantiate | wc -l | awk '{print $1}')" != "0" ]; then
    echo "Running: kubectl delete -f ${KUBECONFIG_FOLDER}/chaincode_instantiate.yaml"
    kubectl delete -f ${KUBECONFIG_FOLDER}/chaincode_instantiate.yaml

    # Wait for the pod to be deleted
    while [ "$(kubectl get pods -a | grep chaincodeinstantiate | wc -l | awk '{print $1}')" != "0" ]; do
        echo "Waiting for old instantiate chaincode Pod to be deleted"
        sleep 1;
    done

    echo "Instantiate chaincode pod deleted successfully."
else
    echo "Instantiate chaincode pod doesn't exist. No need to delete."
fi
