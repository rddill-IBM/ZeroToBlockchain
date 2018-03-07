#!/bin/bash

if [ "${PWD##*/}" == "create" ]; then
    KUBECONFIG_FOLDER=${PWD}/../../kube-configs
elif [ "${PWD##*/}" == "scripts" ]; then
    KUBECONFIG_FOLDER=${PWD}/../kube-configs
else
    echo "Please run the script from 'scripts' or 'scripts/create' folder"
fi

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

echo "Deleting old channel pods if exists"
echo "Running: ${KUBECONFIG_FOLDER}/../scripts/delete/delete_channel-pods.sh"
${KUBECONFIG_FOLDER}/../scripts/delete/delete_channel-pods.sh

echo "Preparing yaml file for create channel"
sed -e "s/%CHANNEL_NAME%/${CHANNEL_NAME}/g" -e "s/%PEER_MSPID%/${PEER_MSPID}/g" ${KUBECONFIG_FOLDER}/create_channel.yaml.base > ${KUBECONFIG_FOLDER}/create_channel.yaml

echo "Creating createchannel pod"
echo "Running: kubectl create -f ${KUBECONFIG_FOLDER}/create_channel.yaml"
kubectl create -f ${KUBECONFIG_FOLDER}/create_channel.yaml

while [ "$(kubectl get pod -a createchannel | grep createchannel | awk '{print $3}')" != "Completed" ]; do
    echo "Waiting for createchannel container to be Completed"
    sleep 1;
done

if [ "$(kubectl get pod -a createchannel | grep createchannel | awk '{print $3}')" == "Completed" ]; then
	echo "Create Channel Completed Successfully"
fi

if [ "$(kubectl get pod -a createchannel | grep createchannel | awk '{print $3}')" != "Completed" ]; then
	echo "Create Channel Failed"
fi