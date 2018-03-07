#!/bin/bash

if [ "${PWD##*/}" == "create" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/create' folder"
fi

# Default to peer 1's address if not defined
if [ -z "${PEER_ADDRESS}" ]; then
	echo "PEER_ADDRESS not defined. I will use \"blockchain-org1peer1:30110\"."
	echo "I will wait 5 seconds before continuing."
	sleep 5
fi
PEER_ADDRESS=${PEER_ADDRESS:-blockchain-org1peer1:30110}

# Default to "Org1MSP" if not defined
if [ -z ${PEER_MSPID} ]; then
	echo "PEER_MSPID not defined. I will use \"Org1MSP\"."
	echo "I will wait 5 seconds before continuing."
	sleep 5
fi
PEER_MSPID=${PEER_MSPID:-Org1MSP}

# Default to "channel1" if not defined
if [ -z "${CHANNEL_NAME}" ]; then
	echo "CHANNEL_NAME not defined. I will use \"channel1\"."
	echo "I will wait 5 seconds before continuing."
	sleep 5
fi
CHANNEL_NAME=${CHANNEL_NAME:-channel1}

# Default to "admin for peer1" if not defined
if [ -z "${MSP_CONFIGPATH}" ]; then
	echo "MSP_CONFIGPATH not defined. I will use \"/shared/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp\"."
	echo "I will wait 5 seconds before continuing."
	sleep 5
fi
MSP_CONFIGPATH=${MSP_CONFIGPATH:-/shared/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp}

echo "Deleting old channel pods if exists"
echo "Running: ${KUBECONFIG_FOLDER}/../scripts/delete/delete_channel-pods.sh"
${KUBECONFIG_FOLDER}/../scripts/delete/delete_channel-pods.sh

echo "Preparing yaml for joinchannel pod"
sed -e "s/%PEER_ADDRESS%/${PEER_ADDRESS}/g" -e "s/%CHANNEL_NAME%/${CHANNEL_NAME}/g" -e "s/%PEER_MSPID%/${PEER_MSPID}/g" -e "s|%MSP_CONFIGPATH%|${MSP_CONFIGPATH}|g" ${KUBECONFIG_FOLDER}/join_channel.yaml.base > ${KUBECONFIG_FOLDER}/join_channel.yaml

echo "Creating joinchannel pod"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/join_channel.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/join_channel.yaml

while [ "$(kubectl get pod -a joinchannel | grep joinchannel | awk '{print $3}')" != "Completed" ]; do
    echo "Waiting for joinchannel container to be Completed"
    sleep 1;
done

if [ "$(kubectl get pod -a joinchannel | grep joinchannel | awk '{print $3}')" == "Completed" ]; then
	echo "Join Channel Completed Successfully"
fi

if [ "$(kubectl get pod -a joinchannel | grep joinchannel | awk '{print $3}')" != "Completed" ]; then
	echo "Join Channel Failed"
fi